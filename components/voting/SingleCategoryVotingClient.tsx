"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Vote, CheckCircle, ShieldAlert, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { FaCalendarAlt, FaMapMarkerAlt, FaInstagram, FaPhoneAlt } from "react-icons/fa";
import { VoteModal } from "@/components/voting/VoteModal";
import type { PublicNominee } from "@/app/(public)/page";
import { checkBrowserGate, BrowserGateResult } from "@/lib/browser-gate";
import { Footer } from "@/components/site/Footer";
import { ScrollToTop } from "@/components/site/ScrollToTop";

interface SingleCategoryVotingClientProps {
  categoryName: string;
  categorySlug: string;
  nominees: PublicNominee[];
  votingState: "upcoming" | "active" | "closed";
  votingOpenAt: string;
  votingCloseAt: string;
  prevCategory?: { name: string; slug: string } | null;
  nextCategory?: { name: string; slug: string } | null;
}

export function SingleCategoryVotingClient({
  categoryName,
  categorySlug,
  nominees,
  votingState,
  prevCategory,
  nextCategory,
}: SingleCategoryVotingClientProps) {
  const [selectedNominee, setSelectedNominee] = useState<PublicNominee | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votesRemaining, setVotesRemaining] = useState<number | null>(null);

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

  const handleNomineeClick = useCallback((nominee: PublicNominee) => {
    setSelectedNominee(nominee);
  }, []);

  const handleVoteSuccess = useCallback((category: string, remaining: number) => {
    setHasVoted(true);
    setVotesRemaining(remaining);
  }, []);

  const handleModalClose = useCallback(() => {
    setSelectedNominee(null);
  }, []);

  // ── Browser Gate Blocked state ──
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

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
        {/* Top Header Navigation & Exact Poster Header Branding */}
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-brand-brown-deep/40">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-brand-surface/80 hover:bg-brand-surface border border-brand-brown-deep/60 text-brand-white hover:text-brand-gold font-heading text-xs font-bold uppercase tracking-wider transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Categories</span>
          </Link>

          {/* Exact Top Right Poster Header Branding */}
          <div className="text-right uppercase font-heading font-extrabold tracking-wider leading-none">
            <span className="text-[10px] sm:text-xs text-brand-gold block leading-tight">
              BAYELSA MUSICAL
            </span>
            <span className="text-[10px] sm:text-xs text-brand-gold block leading-tight">
              ARTISTE AWARDS 2026
            </span>
            <span className="text-[9px] sm:text-[10px] text-brand-white block mt-1 tracking-widest font-bold">
              BEYOND THE{" "}
              <span className="inline-block px-1 py-0.5 border border-brand-gold text-brand-gold font-bold rounded-sm">
                PLAINS
              </span>
            </span>
          </div>
        </div>

        {/* Category Title Section */}
        <div className="text-center my-4 space-y-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/10 border border-brand-gold/30 text-brand-gold text-[11px] font-heading font-bold uppercase tracking-widest"
          >
            <Vote className="w-3.5 h-3.5" />
            Category Voting
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-white uppercase tracking-wider text-center"
          >
            {categoryName}
          </motion.h1>

          <p className="font-sans text-xs sm:text-sm text-brand-white/60 max-w-xl mx-auto">
            Tap on any nominee below to cast your vote. You have 1 vote per category every 24 hours.
          </p>

          {/* Voted Confirmation Badge */}
          {hasVoted && (
            <div className="pt-1 flex justify-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-status-approved/20 border border-brand-status-approved/40 text-brand-status-approved text-xs font-heading font-bold uppercase tracking-wider">
                <CheckCircle className="w-4 h-4" />
                Vote Counted ({votesRemaining ?? 0}/1 left today)
              </span>
            </div>
          )}
        </div>

        {/* Nominee Grid */}
        <div className="my-6">
          {nominees.length === 0 ? (
            <div className="text-center py-16 bg-brand-surface/30 rounded-xl border border-brand-brown-deep/30 max-w-md mx-auto">
              <p className="font-heading text-base font-bold text-brand-white">No Approved Nominees Yet</p>
              <p className="font-sans text-xs text-brand-white/50 mt-1">Check back soon for updates in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 justify-center">
              {nominees.map((nominee, idx) => (
                <motion.button
                  key={nominee.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  onClick={() => handleNomineeClick(nominee)}
                  className="group relative flex flex-col bg-gradient-to-b from-[#e7aa55] via-[#d79840] to-[#b77926] rounded-2xl p-2 shadow-xl shadow-black/50 hover:scale-[1.03] transition-all duration-300 cursor-pointer text-left overflow-hidden border border-brand-gold/60"
                >
                  {/* Photo Container inside Gold Frame */}
                  <div className="relative w-full aspect-[3/4] bg-black/60 rounded-xl overflow-hidden mb-2.5">
                    <img
                      src={nominee.photo_url}
                      alt={nominee.stage_name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Hover Vote Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-gold text-brand-bg rounded-full text-xs font-heading font-bold uppercase tracking-wider shadow-lg">
                        <Vote className="w-3.5 h-3.5" />
                        Vote
                      </span>
                    </div>
                  </div>

                  {/* Nominee Stage Name */}
                  <div className="px-1 py-1 flex flex-col items-center text-center">
                    <h3 className="font-heading text-sm sm:text-base font-extrabold text-brand-white uppercase tracking-wider leading-tight drop-shadow group-hover:text-brand-gold transition-colors">
                      {nominee.stage_name}
                    </h3>
                    {nominee.song_title && (
                      <span className="font-sans text-[11px] text-brand-white/80 truncate max-w-full mt-0.5 font-medium">
                        {nominee.song_title}
                      </span>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Next / Previous Category Quick Switcher */}
        <div className="flex items-center justify-between gap-4 my-6 pt-6 border-t border-brand-brown-deep/40">
          {prevCategory ? (
            <Link
              href={`/category/${prevCategory.slug}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-surface/70 hover:bg-brand-surface border border-brand-brown-deep/60 text-brand-white hover:text-brand-gold font-heading text-xs font-bold uppercase tracking-wider transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev: {prevCategory.name}</span>
              <span className="sm:hidden">Prev Category</span>
            </Link>
          ) : <div />}

          {nextCategory ? (
            <Link
              href={`/category/${nextCategory.slug}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-gold hover:bg-brand-gold/90 text-brand-bg font-heading text-xs font-bold uppercase tracking-wider shadow-lg transition-all"
            >
              <span className="hidden sm:inline">Next: {nextCategory.name}</span>
              <span className="sm:hidden">Next Category</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : <div />}
        </div>

        {/* Event Details Banner with react-icons */}
        <div className="mt-auto bg-black/90 backdrop-blur-md rounded-2xl border border-brand-gold/40 p-5 sm:p-6 text-brand-white space-y-4 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-gold to-transparent" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            {/* Left Column: Date & Location & Socials */}
            <div className="space-y-3   md:text-left">
              {/* Event Date using react-icons FaCalendarAlt */}
              <div className="flex items-center  md:justify-start gap-2.5">
                <FaCalendarAlt className="w-4 h-4 text-brand-gold shrink-0" />
                <span className="font-heading font-extrabold text-xs sm:text-sm text-brand-gold uppercase tracking-wider">
                  SUN 8TH NOV, 2026
                </span>
              </div>

              {/* Location / Venue using react-icons FaMapMarkerAlt */}
              <div className="flex items-start justify-center md:justify-start gap-2.5 max-w-lg">
                <FaMapMarkerAlt className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                <span className="font-heading font-bold text-xs sm:text-xs text-brand-white/90 uppercase tracking-wide leading-tight">
                  DIEPREYE ALAMIEYESEIGHA BANQUET HALL, YENAGOA, BAYELSA STATE.
                </span>
              </div>

              {/* Socials & Phone using react-icons FaInstagram & FaPhoneAlt */}
              <div className="flex flex-wrap items-center  md:justify-start gap-x-5 gap-y-2 pt-1 font-sans text-xs text-brand-white/90">
                <span className="inline-flex items-center gap-2 font-medium">
                  <FaInstagram className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                  @bmaaofficial
                </span>
                <span className="inline-flex items-center gap-2 font-medium">
                  <FaPhoneAlt className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                  +234 9043599284, +234 813 367 3492
                </span>
              </div>
            </div>

            {/* Right Column: Watermark Logo */}
            <div className="hidden sm:flex items-center justify-center opacity-50 shrink-0">
              <div className="relative w-24 h-20 bg-transparent">
                <img
                  src="/bmaa-logo.jpeg"
                  alt="BMAA Logo"
                  className="w-full h-full object-contain grayscale brightness-125"
                />
              </div>
            </div>
          </div>
        </div>
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

      <Footer />
      <ScrollToTop />
    </>
  );
}
