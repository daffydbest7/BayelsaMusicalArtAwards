import { getCachedSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/server";
import { Header } from "@/components/site/Header";
import { VotingPageClient } from "@/components/voting/VotingPageClient";
import { CATEGORIES, getCategorySlug } from "@/lib/constants/categories";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vote | BMAA 2026",
  description: "Cast your votes for the Bayelsa Musical Artiste Awards 2026. Vote for your favourite artists across 26 categories.",
};

/** Nominee shape exposed to the public voting client — intentionally excludes vote counts, real name, email, phone, etc. */
export interface PublicNominee {
  id: string;
  stage_name: string;
  song_title: string;
  photo_url: string;
  category: string;       // raw category name (e.g. "Best Male Artist")
  categorySlug: string;   // slug (e.g. "best-male-artist")
}

export default async function VotingPage() {
  const settings = await getCachedSettings();

  // Determine voting state server-side (§5.1)
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

  // Only fetch nominees when voting is active
  let nominees: PublicNominee[] = [];
  if (votingState === "active") {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("submissions")
      .select("id, stage_name, song_title, photo_url, category")
      .eq("status", "approved")
      .order("stage_name", { ascending: true });

    if (!error && data) {
      nominees = data.map((s) => ({
        id: s.id,
        stage_name: s.stage_name,
        song_title: s.song_title,
        photo_url: s.photo_url,
        category: s.category,
        categorySlug: getCategorySlug(s.category),
      }));
    }
  }

  // Build category sections from the canonical list, only including categories that have nominees
  const categorySections = CATEGORIES
    .map((name) => {
      const slug = getCategorySlug(name);
      const categoryNominees = nominees.filter((n) => n.categorySlug === slug);
      return { name, slug, nominees: categoryNominees };
    })
    .filter((section) => section.nominees.length > 0);

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg text-brand-white pt-16">
      <Header />
      <VotingPageClient
        votingState={votingState}
        votingOpenAt={settings.voting_open_at}
        votingCloseAt={settings.voting_close_at}
        categorySections={categorySections}
      />
    </div>
  );
}
