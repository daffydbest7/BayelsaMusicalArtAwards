import { notFound } from "next/navigation";
import { getCachedSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/server";
import { Header } from "@/components/site/Header";
import { SingleCategoryVotingClient } from "@/components/voting/SingleCategoryVotingClient";
import { CATEGORIES, getCategorySlug, getCategoryNameFromSlug } from "@/lib/constants/categories";
import type { PublicNominee } from "@/app/(public)/page";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categoryName = getCategoryNameFromSlug(slug);

  if (!categoryName) {
    return { title: "Category Not Found | BMAA 2026" };
  }

  return {
    title: `Vote for ${categoryName} | BMAA 2026`,
    description: `Cast your votes for ${categoryName} at the Bayelsa Musical Artiste Awards 2026.`,
  };
}

export default async function CategoryVotingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let categoryName: string | undefined = getCategoryNameFromSlug(slug);

  const settings = await getCachedSettings();

  // Determine voting state server-side
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

  let nominees: PublicNominee[] = [];
  let prevCategory: { name: string; slug: string } | null = null;
  let nextCategory: { name: string; slug: string } | null = null;

  if (votingState === "active") {
    const supabase = createAdminClient();

    // Fetch all approved submissions to match by category slug reliably
    const { data, error } = await supabase
      .from("submissions")
      .select("id, stage_name, song_title, photo_url, category")
      .eq("status", "approved")
      .order("stage_name", { ascending: true });

    if (!error && data) {
      // Match submissions for this category by slug
      const categorySubmissions = data.filter(
        (s) => getCategorySlug(s.category) === slug
      );

      if (categorySubmissions.length > 0 && categorySubmissions[0].category) {
        categoryName = categorySubmissions[0].category;
      }

      nominees = categorySubmissions.map((s) => ({
        id: s.id,
        stage_name: s.stage_name,
        song_title: s.song_title,
        photo_url: s.photo_url,
        category: s.category,
        categorySlug: getCategorySlug(s.category),
      }));

      // Build active categories list for prev/next category switcher
      const activeSlugsSet = new Set(data.map((s) => getCategorySlug(s.category)));

      const activeList: { name: string; slug: string }[] = [];
      for (const cat of CATEGORIES) {
        const catSlug = getCategorySlug(cat);
        if (activeSlugsSet.has(catSlug)) {
          activeList.push({ name: cat, slug: catSlug });
        }
      }

      const currentIndex = activeList.findIndex((c) => c.slug === slug);
      if (currentIndex !== -1) {
        prevCategory = currentIndex > 0 ? activeList[currentIndex - 1] : null;
        nextCategory = currentIndex < activeList.length - 1 ? activeList[currentIndex + 1] : null;
      }
    }
  }

  if (!categoryName && nominees.length === 0) {
    notFound();
  }

  const displayCategoryName = categoryName || slug.replace(/-/g, " ").toUpperCase();

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
      <SingleCategoryVotingClient
        categoryName={displayCategoryName}
        categorySlug={slug}
        nominees={nominees}
        votingState={votingState}
        votingOpenAt={settings.voting_open_at}
        votingCloseAt={settings.voting_close_at}
        prevCategory={prevCategory}
        nextCategory={nextCategory}
      />
    </div>
  );
}
