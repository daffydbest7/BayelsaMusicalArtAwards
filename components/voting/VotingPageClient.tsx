"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Vote, Clock, Trophy, CheckCircle, ShieldAlert, RotateCcw } from "lucide-react";
import { Countdown } from "@/components/site/Countdown";
import { VoteModal } from "@/components/voting/VoteModal";
import type { PublicNominee } from "@/app/(public)/voting/page";
import { checkBrowserGate, BrowserGateResult } from "@/lib/browser-gate";

interface CategorySection {
  name: string;
  slug: string;
  nominees: PublicNominee[];
}

interface VotingPageClientProps {
  votingState: "upcoming" | "active" | "closed";
  votingOpenAt: string;
  votingCloseAt: string;
  categorySections: CategorySection[];
}

export function VotingPageClient({
  votingState,
  votingOpenAt,
  votingCloseAt,
  categorySections,
}: VotingPageClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>(
    categorySections[0]?.slug || ""
  );
  const [selectedNominee, setSelectedNominee] = useState<PublicNominee | null>(null);
  const [votedCategories, setVotedCategories] = useState<Set<string>>(new Set());
  const [categoryVotesRemaining, setCategoryVotesRemaining] = useState<Record<string, number>>({});

  // Browser gate state for blocking Brave & Safari Private Browsing
  const [gateState, setGateState] = useState<{
    checking: boolean;
    result: BrowserGateResult;
  }>({
    checking: true,
    result: { isBlocked: false },
  });

  const runGateCheck = useCallback(async () => {
    setGateState((prev) => ({ ...prev, checking: true }));
    const result = await checkBrowserGate();
    setGateState({ checking: false, result });
  }, []);

  useEffect(() => {
    runGateCheck();
  }, [runGateCheck]);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const chipBarRef = useRef<HTMLDivElement>(null);
  const scrollSpyEnabled = useRef(true);

  // ── Scroll-spy: highlight the chip for the currently visible category section ──
  useEffect(() => {
    if (votingState !== "active" || categorySections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!scrollSpyEnabled.current) return;

        for (const entry of entries) {
          if (entry.isIntersecting) {
            const slug = entry.target.getAttribute("data-category-slug");
            if (slug) {
              setActiveCategory(slug);
              // Scroll the chip bar to keep the active chip visible
              const chipEl = document.getElementById(`chip-${slug}`);
              if (chipEl && chipBarRef.current) {
                chipEl.scrollIntoView({
                  behavior: "smooth",
                  block: "nearest",
                  inline: "center",
                });
              }
            }
          }
        }
      },
      {
        rootMargin: "-20% 0px -60% 0px", // Trigger when section is near the top third of viewport
        threshold: 0,
      }
    );

    for (const section of categorySections) {
      const el = sectionRefs.current[section.slug];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [votingState, categorySections]);

  const handleChipClick = useCallback((slug: string) => {
    scrollSpyEnabled.current = false;
    setActiveCategory(slug);

    const el = sectionRefs.current[slug];
    if (el) {
      const offset = 140; // Account for sticky header + chip bar
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }

    // Re-enable scroll spy after scroll completes
    setTimeout(() => {
      scrollSpyEnabled.current = true;
    }, 1000);
  }, []);

  const handleNomineeClick = useCallback((nominee: PublicNominee) => {
    setSelectedNominee(nominee);
  }, []);

  const handleVoteSuccess = useCallback((category: string, votesRemaining: number) => {
    setVotedCategories((prev) => new Set(prev).add(category));
    setCategoryVotesRemaining((prev) => ({ ...prev, [category]: votesRemaining }));
  }, []);

  const handleModalClose = useCallback(() => {
    setSelectedNominee(null);
  }, []);

  // ── Browser Gate Blocked state (Brave / Safari Private Browsing) ──
  if (gateState.result.isBlocked) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-w-lg p-8 rounded-md bg-brand-surface border border-brand-status-rejected/40 shadow-2xl flex flex-col items-center gap-5 text-center"
        >
          <ShieldAlert className="w-16 h-16 text-brand-status-rejected" />
          <div className="space-y-2">
            <h2 className="font-heading text-xl font-bold text-brand-white uppercase tracking-wider">
              Voting Restricted in This Browser Mode
            </h2>
            <p className="font-sans text-sm text-brand-white/80 leading-relaxed">
              {gateState.result.message}
            </p>
          </div>

          {gateState.result.reason === "safari_private" && (
            <button
              type="button"
              onClick={runGateCheck}
              disabled={gateState.checking}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-gold hover:bg-brand-gold/90 text-brand-bg font-heading text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition-all mt-2 disabled:opacity-50"
            >
              <RotateCcw className={`w-4 h-4 ${gateState.checking ? "animate-spin" : ""}`} />
              <span>Try again</span>
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  // ── "Upcoming" state ──
  if (votingState === "upcoming") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg space-y-8"
        >
          <Clock className="w-16 h-16 text-brand-gold mx-auto" />
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-brand-white">
            Voting Opens Soon
          </h1>
          <p className="font-sans text-brand-white/60 text-sm">
            The voting window for BMAA 2026 is not yet active. Come back when it opens to cast your votes.
          </p>
          <div className="py-6">
            <Countdown
              openAt={votingOpenAt}
              closeAt={votingCloseAt}
              labelOpen="Voting closes in:"
              labelClosed="Voting has closed."
              labelCountdown="Voting opens in:"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  // ── "Closed" state ──
  if (votingState === "closed") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg space-y-6"
        >
          <Trophy className="w-16 h-16 text-brand-gold mx-auto" />
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-brand-white">
            Voting Has Closed
          </h1>
          <p className="font-sans text-brand-white/60 text-sm">
            Voting for BMAA 2026 has closed. Thank you for participating! Stay tuned for the winners announcement.
          </p>
          <p className="font-heading text-sm text-brand-gold font-bold tracking-widest">
            #BMAA2026 #BEYONDTHEPLAINS
          </p>
        </motion.div>
      </div>
    );
  }

  // ── "Active" state ──
  return (
    <>
      {/* Page Header */}
      <div className="px-4 sm:px-6 py-8 text-center max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-heading text-2xl sm:text-3xl font-bold text-brand-white"
        >
          Vote For Your <span className="text-brand-gold">Favourites</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-sans text-xs text-brand-white/50 mt-2"
        >
          Scroll through the categories and tap a nominee to cast your vote. You have 2 votes per category every 24 hours.
        </motion.p>

        {/* Countdown to close */}
        <div className="mt-6">
          <Countdown
            openAt={votingOpenAt}
            closeAt={votingCloseAt}
            labelOpen="Voting closes in:"
            labelClosed="Voting has closed."
            labelCountdown="Voting opens in:"
          />
        </div>
      </div>

      {/* Sticky Category Chip Bar — jump-navigation, not a filter (§5.2) */}
      <div className="sticky top-16 z-30 bg-brand-bg/95 backdrop-blur-sm border-b border-brand-brown-deep/30 shadow-lg shadow-black/20">
        <div
          ref={chipBarRef}
          className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide max-w-7xl mx-auto"
        >
          {categorySections.map((section) => {
            const isActive = activeCategory === section.slug;
            const hasVoted = votedCategories.has(section.slug);
            return (
              <button
                key={section.slug}
                id={`chip-${section.slug}`}
                onClick={() => handleChipClick(section.slug)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-heading font-bold uppercase tracking-wider border transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-brand-gold text-brand-bg border-brand-gold shadow-md shadow-brand-gold/20"
                    : "bg-brand-surface/60 text-brand-white/60 border-brand-brown-deep/40 hover:text-brand-white hover:border-brand-white/20"
                }`}
              >
                {hasVoted && <CheckCircle className="w-3 h-3 shrink-0" />}
                {section.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Sections — all visible, vertically stacked (§5.2) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        {categorySections.map((section, idx) => (
          <section
            key={section.slug}
            ref={(el) => { sectionRefs.current[section.slug] = el; }}
            data-category-slug={section.slug}
            className="pt-10 pb-6"
          >
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6 border-b border-brand-brown-deep/30 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-brand-gold rounded-full" />
                <div>
                  <h2 className="font-heading text-lg sm:text-xl font-bold text-brand-white">
                    {section.name}
                  </h2>
                  <span className="font-sans text-[11px] text-brand-white/40">
                    {section.nominees.length} nominee{section.nominees.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Votes remaining indicator (§5.2) — shown after first vote */}
              {categoryVotesRemaining[section.slug] !== undefined && (
                <span className="font-mono text-[10px] text-brand-status-pending bg-brand-status-pending/10 border border-brand-status-pending/20 px-2.5 py-1 rounded-full">
                  {categoryVotesRemaining[section.slug]}/2 votes left
                </span>
              )}
            </div>

            {/* Nominee Grid — 2 cols mobile, 3 cols sm, 4 cols lg (§5.2) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {section.nominees.map((nominee, nIdx) => (
                <motion.button
                  key={nominee.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: nIdx * 0.03, duration: 0.3 }}
                  onClick={() => handleNomineeClick(nominee)}
                  className="group relative flex flex-col bg-brand-surface rounded-md border border-brand-brown-deep/50 overflow-hidden shadow shadow-black/40 hover:border-brand-gold/40 hover:shadow-brand-gold/10 transition-all duration-200 cursor-pointer text-left"
                >
                  {/* Photo — 3:4 portrait crop (DESIGN.md §9) */}
                  <div className="relative w-full aspect-[3/4] bg-brand-bg overflow-hidden">
                    <img
                      src={nominee.photo_url}
                      alt={nominee.stage_name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Hover overlay with vote prompt */}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-bg/90 via-brand-bg/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-gold/90 text-brand-bg rounded-full text-[10px] font-heading font-bold uppercase tracking-wider">
                        <Vote className="w-3 h-3" />
                        Vote
                      </span>
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="p-3 flex flex-col gap-0.5">
                    <h3 className="font-heading text-sm font-bold text-brand-white leading-tight truncate group-hover:text-brand-gold transition-colors">
                      {nominee.stage_name}
                    </h3>
                    <span className="font-sans text-[10px] text-brand-white/40 truncate">
                      {nominee.song_title}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Vote Confirmation Modal */}
      {selectedNominee && (
        <VoteModal
          nominee={{
            id: selectedNominee.id,
            stage_name: selectedNominee.stage_name,
            song_title: selectedNominee.song_title,
            photo_url: selectedNominee.photo_url,
            category: selectedNominee.categorySlug,
            categoryName: selectedNominee.category,
          }}
          onClose={handleModalClose}
          onVoteSuccess={handleVoteSuccess}
        />
      )}

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
    </>
  );
}
