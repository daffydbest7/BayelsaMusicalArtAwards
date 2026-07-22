-- Submissions table
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  reference_id text unique not null,           -- e.g. BMAA-2026-XXXXXX
  stage_name text not null,
  real_name text not null,
  phone text not null,                          -- normalized +234 format
  email text not null,                          -- normalized lowercase
  location text not null,
  category text not null,                       -- slug from CATEGORIES constant
  song_title text not null,
  media_link text not null,
  release_date date not null,
  cover_art_url text not null,
  photo_url text not null,
  instagram text,
  facebook text,
  tiktok text,
  youtube text,
  status text not null default 'pending',       -- pending | approved | rejected
  rejection_reason text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

-- Partial unique indexes enforce per-category dedupe on email OR phone
create unique index if not exists submissions_email_category_unique
  on submissions (lower(email), category);
create unique index if not exists submissions_phone_category_unique
  on submissions (phone, category);

-- Votes table (append-only ledger for eligibility and admin velocity dashboards)
create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  category text not null,
  voter_fingerprint_hash text not null,         -- sole hard-match key for eligibility
  ip_address inet,                               -- advisory only — admin flagging dashboard
  created_at timestamptz not null default now()
);

create index if not exists votes_fingerprint_category_time_idx
  on votes (voter_fingerprint_hash, category, created_at);

-- Site settings (singleton row to drive count-downs/states)
create table if not exists settings (
  id int primary key default 1,
  submission_open_at timestamptz,
  submission_close_at timestamptz,
  voting_open_at timestamptz,
  voting_close_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint singleton check (id = 1)
);

-- Seed initial settings row
insert into settings (id, submission_open_at, submission_close_at, voting_open_at, voting_close_at)
values (
  1,
  '2026-07-01T00:00:00Z',
  '2026-09-30T23:59:59Z',
  '2026-10-01T00:00:00Z',
  '2026-11-30T23:59:59Z'
) on conflict (id) do nothing;

-- Admin role mapping
create table if not exists admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'site_manager' check (role in ('super_admin', 'site_manager')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

-- RLS Configuration
alter table submissions enable row level security;
alter table votes enable row level security;
alter table settings enable row level security;
alter table admin_users enable row level security;

-- Drop existing policies to prevent conflicts on rebuild
drop policy if exists "Admin full access on submissions" on submissions;
drop policy if exists "Public read approved submissions" on submissions;
drop policy if exists "Admin full access on votes" on votes;
drop policy if exists "Public read settings" on settings;
drop policy if exists "Admin full access on settings" on settings;
drop policy if exists "Admin read roles" on admin_users;
drop policy if exists "Super admin write roles" on admin_users;

-- 1. admin_users policies
create policy "Admin read roles" on admin_users
  for select using (auth.uid() = user_id or auth.uid() in (select user_id from admin_users));

create policy "Super admin write roles" on admin_users
  for all using (
    auth.uid() in (select user_id from admin_users where role = 'super_admin')
  );

-- 2. settings policies
create policy "Public read settings" on settings
  for select using (true);

create policy "Admin full access on settings" on settings
  for all using (auth.uid() in (select user_id from admin_users));

-- 3. submissions policies (writes go via service_role to run server-side logic)
create policy "Admin full access on submissions" on submissions
  for all using (auth.uid() in (select user_id from admin_users));

create policy "Public read approved submissions" on submissions
  for select using (status = 'approved');

-- 4. votes policies (writes go via service_role, public cannot read raw votes)
create policy "Admin full access on votes" on votes
  for all using (auth.uid() in (select user_id from admin_users));

-- cast_vote RPC (atomic voting mechanism with embedded validation checks)
create or replace function cast_vote(
  p_submission_id uuid,
  p_category text,
  p_voter_fingerprint_hash text,
  p_ip_address inet
) returns jsonb as $$
declare
  v_lock_key bigint := hashtextextended(p_voter_fingerprint_hash || p_category, 0);
  v_count int;
  v_sub_status text;
  v_voting_open timestamptz;
  v_voting_close timestamptz;
begin
  -- 1. Check voting window from settings singleton (if configured)
  select voting_open_at, voting_close_at
  into v_voting_open, v_voting_close
  from settings
  where id = 1;

  if v_voting_open is not null and now() < v_voting_open then
    return jsonb_build_object('success', false, 'reason', 'voting_not_open', 'voting_open_at', v_voting_open);
  end if;

  if v_voting_close is not null and now() >= v_voting_close then
    return jsonb_build_object('success', false, 'reason', 'voting_closed');
  end if;

  -- 2. Verify submission exists and status is approved
  select status into v_sub_status
  from submissions
  where id = p_submission_id and category = p_category;

  if v_sub_status is null then
    return jsonb_build_object('success', false, 'reason', 'submission_not_found');
  elsif v_sub_status != 'approved' then
    return jsonb_build_object('success', false, 'reason', 'not_approved');
  end if;

  -- 3. Serialize concurrent requests from the same voter+category so a rapid
  -- double-tap can't race past the 5-vote limit
  perform pg_advisory_xact_lock(v_lock_key);

  select count(*) into v_count
  from votes
  where voter_fingerprint_hash = p_voter_fingerprint_hash
    and category = p_category
    and created_at > now() - interval '24 hours';

  if v_count >= 2 then
    return jsonb_build_object('success', false, 'reason', 'limit_reached', 'votes_used', v_count);
  end if;

  -- 4. Record the vote
  insert into votes (submission_id, category, voter_fingerprint_hash, ip_address)
  values (p_submission_id, p_category, p_voter_fingerprint_hash, p_ip_address);

  return jsonb_build_object('success', true, 'votes_remaining', 1 - v_count);
end;
$$ language plpgsql security definer;
