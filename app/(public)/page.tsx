import { getCachedSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/server";
import { Header } from "@/components/site/Header";
import { VotingHubClient, ActiveCategorySummary } from "@/components/voting/VotingHubClient";
import { CATEGORIES, getCategorySlug } from "@/lib/constants/categories";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "BMAA 2026 | Official Voting Platform",
  description: "Cast your votes for the Bayelsa Musical Artiste Awards 2026. Beyond the Plains - vote for your favourite artists across 26 categories.",
};

export interface PublicNominee {
  id: string;
  stage_name: string;
  song_title: string;
  photo_url: string;
  category: string;
  categorySlug: string;
}

export default async function PublicHomePage() {
  const settings = await getCachedSettings();

  const now = Date.now();
  const votingOpen = new Date(settings.voting_open_at).getTime();
  const votingClose = new Date(settings.voting_close_at).getTime();

  let votingState: "upcoming" | "active" | "closed";
  if (now < votingOpen) {
    votingState = "upcoming";
  } else if (now < votingClose) {
    votingState = "active";
  } else {
    votingState = "closed";
  }

  let categorySummaries: ActiveCategorySummary[] = [];

  if (votingState === "active") {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("submissions")
      .select("id, stage_name, song_title, photo_url, category")
      .eq("status", "approved")
      .order("stage_name", { ascending: true });

    if (!error && data) {
      // Group nominees by category slug
      const grouped = new Map<string, { name: string; avatars: string[]; count: number }>();

      for (const s of data) {
        const slug = getCategorySlug(s.category);
        if (!grouped.has(slug)) {
          grouped.set(slug, { name: s.category, avatars: [], count: 0 });
        }
        const item = grouped.get(slug)!;
        item.count += 1;
        if (s.photo_url && item.avatars.length < 5) {
          item.avatars.push(s.photo_url);
        }
      }

      const list: ActiveCategorySummary[] = [];
      for (const name of CATEGORIES) {
        const slug = getCategorySlug(name);
        const item = grouped.get(slug);
        if (item && item.count > 0) {
          list.push({
            name,
            slug,
            nomineeCount: item.count,
            nomineeAvatars: item.avatars,
          });
        }
      }
      categorySummaries = list;
    }
  }

  return (
    <div
      className="flex flex-col min-h-screen text-brand-white pt-16 sm:pt-20 relative bg-brand-bg bg-repeat"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(14, 8, 4, 0.85), rgba(14, 8, 4, 0.92)), url('/bmaa-bg-pattern.jpg')`,
        backgroundRepeat: "repeat",
        backgroundSize: "320px auto",
        backgroundAttachment: "fixed",
      }}
    >
      <Header />
      <VotingHubClient
        votingState={votingState}
        votingOpenAt={settings.voting_open_at}
        votingCloseAt={settings.voting_close_at}
        categorySummaries={categorySummaries}
      />
    </div>
  );
}
