import { getCachedSettings } from "@/lib/settings";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { Countdown } from "@/components/site/Countdown";
import { Eligibility } from "@/components/site/Eligibility";
import { CategoryList } from "@/components/site/CategoryList";
import { EntryForm } from "@/components/site/EntryForm";
import { StatusTracker } from "@/components/site/StatusTracker";

export default async function PublicHomePage() {
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
      <footer className="py-10 text-center border-t border-brand-brown-deep/20 bg-brand-surface/20">
        <div className="flex flex-col gap-3">
          <p className="font-heading text-sm text-brand-gold font-bold tracking-widest">
            #BMAA2026 #BEYONDTHEPLAINS
          </p>
          <p className="font-sans text-xs text-brand-white/40">
            © 2026 Bayelsa Musical Artiste Awards. All rights reserved. Follow us on Socials @BMAAOfficial.
          </p>
        </div>
      </footer>
    </div>
  );
}
