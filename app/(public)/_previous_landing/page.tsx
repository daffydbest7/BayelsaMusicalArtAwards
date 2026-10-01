import { getCachedSettings } from "@/lib/settings";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { Countdown } from "@/components/site/Countdown";
import { Eligibility } from "@/components/site/Eligibility";
import { CategoryList } from "@/components/site/CategoryList";
import { EntryForm } from "@/components/site/EntryForm";
import { StatusTracker } from "@/components/site/StatusTracker";
import { Footer } from "@/components/site/Footer";
import { ScrollToTop } from "@/components/site/ScrollToTop";

export const dynamic = "force-dynamic";

/**
 * Archived Submissions / Entries Landing Page.
 * Moved to _previous_landing private route folder so it won't render as a public route
 * until needed again in the future.
 */
export default async function PreviousLandingPage() {
  const settings = await getCachedSettings();

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg text-brand-white pt-16">
      {/* Header Navigation */}
      <Header />

      {/* Hero section */}
      <Hero />

      {/* Countdown section */}
      <div className="py-12 bg-brand-surface/30 border-y border-brand-brown-deep/20">
        <Countdown
          openAt={settings.submission_open_at}
          closeAt={settings.submission_close_at}
          labelOpen="Submissions close in:"
          labelClosed="Submissions for BMAA 2026 have closed."
          labelCountdown="Submission window opens in:"
        />
      </div>

      {/* Eligibility section */}
      <Eligibility />

      {/* Categories section */}
      <CategoryList />

      {/* Entry Form section */}
      <EntryForm
        submissionOpenAt={settings.submission_open_at}
        submissionCloseAt={settings.submission_close_at}
      />

      {/* Tracker section */}
      <StatusTracker />

      {/* Footer */}
      <Footer />

      {/* Scroll To Top floating trigger */}
      <ScrollToTop />
    </div>
  );
}
