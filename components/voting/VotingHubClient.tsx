"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Trophy, Clock, Vote, ChevronRight } from "lucide-react";
import { Countdown } from "@/components/site/Countdown";
import { Footer } from "@/components/site/Footer";
import { ScrollToTop } from "@/components/site/ScrollToTop";

export interface ActiveCategorySummary {
  name: string;
  slug: string;
  nomineeCount: number;
  nomineeAvatars: string[];
}

interface VotingHubClientProps {
  votingState: "upcoming" | "active" | "closed";
  votingOpenAt: string;
  votingCloseAt: string;
  categorySummaries: ActiveCategorySummary[];
}

export function VotingHubClient({
  votingState,
  votingOpenAt,
  votingCloseAt,
  categorySummaries,
}: VotingHubClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categorySummaries;
    const query = searchQuery.toLowerCase().trim();
    return categorySummaries.filter(
      (cat) =>
        cat.name.toLowerCase().includes(query) ||
        cat.slug.toLowerCase().includes(query)
    );
  }, [categorySummaries, searchQuery]);

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
            The voting window for BMAA 2026 is not yet active. Check back once voting opens to support your favourite nominees.
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
        <Footer />
        <ScrollToTop />
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
            Voting for BMAA 2026 has concluded. Thank you for voting! Winners will be announced at the main awards night.
          </p>
          <p className="font-heading text-sm text-brand-gold font-bold tracking-widest">
            #BMAA2026 #BEYONDTHEPLAINS
          </p>
        </motion.div>
        <Footer />
        <ScrollToTop />
      </div>
    );
  }

  // ── "Active" state — Category Hub ──
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-gold/10 border border-brand-gold/30 text-brand-gold text-xs font-heading font-bold uppercase tracking-widest"
          >
            <Vote className="w-3.5 h-3.5" />
            Official Voting Hub
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-white tracking-tight"
          >
            Vote For Your <span className="text-brand-gold">Favourites</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-sans text-sm text-brand-white/60 leading-relaxed max-w-2xl mx-auto"
          >
            Select a category below to view nominees and cast your votes. Each category has its own dedicated page with nominee previews. You get 1 vote per category every 24 hours.
          </motion.p>

          {/* Countdown timer */}
          <div className="pt-2">
            <Countdown
              openAt={votingOpenAt}
              closeAt={votingCloseAt}
              labelOpen="Voting window closes in:"
              labelClosed="Voting has closed."
              labelCountdown="Voting opens in:"
            />
          </div>
        </div>

        {/* Search & Active Category Counter */}
        <div id="categories" className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-brand-surface/70 backdrop-blur-md p-4 rounded-xl border border-brand-brown-deep/40 shadow-lg">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-white/40" />
            <input
              type="text"
              placeholder="Search category name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-black/60 border border-brand-brown-deep/60 rounded-lg text-sm text-brand-white placeholder:text-brand-white/30 focus:outline-none focus:border-brand-gold transition-colors"
            />
          </div>

          <div className="text-xs font-heading font-semibold tracking-wider text-brand-gold/90 uppercase">
            Showing <span className="text-brand-white">{filteredCategories.length}</span> of {categorySummaries.length} Active Categories
          </div>
        </div>

        {/* Categories Grid */}
        {filteredCategories.length === 0 ? (
          <div className="text-center py-16 bg-brand-surface/30 rounded-xl border border-brand-brown-deep/30">
            <p className="font-heading text-lg font-bold text-brand-white">No categories found</p>
            <p className="font-sans text-xs text-brand-white/50 mt-1">Try a different search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-16">
            {filteredCategories.map((category, idx) => (
              <motion.div
                key={category.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
              >
                <Link
                  href={`/category/${category.slug}`}
                  className="group relative flex flex-col justify-between h-full bg-gradient-to-b from-brand-surface/90 to-brand-surface/60 backdrop-blur-md border border-brand-brown-deep/60 hover:border-brand-gold/60 rounded-2xl p-6 shadow-xl shadow-black/40 hover:shadow-brand-gold/10 transition-all duration-300 overflow-hidden"
                >
                  {/* Subtle top gold accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-gold/0 via-brand-gold/60 to-brand-gold/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div>
                    {/* Header: Nominee count badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-heading font-bold uppercase tracking-wider bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
                        <Trophy className="w-3 h-3" />
                        {category.nomineeCount} Nominees
                      </span>
                    </div>

                    {/* Category Name */}
                    <h2 className="font-heading text-xl font-bold text-brand-white group-hover:text-brand-gold transition-colors leading-snug mb-4">
                      {category.name}
                    </h2>
                  </div>

                  <div>
                    {/* Nominee Avatars Preview */}
                    {category.nomineeAvatars.length > 0 && (
                      <div className="flex items-center gap-3 pt-4 border-t border-brand-brown-deep/40 mb-5">
                        <div className="flex -space-x-2 overflow-hidden">
                          {category.nomineeAvatars.slice(0, 4).map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt="Nominee preview"
                              className="inline-block h-8 w-8 rounded-full ring-2 ring-brand-bg object-cover"
                            />
                          ))}
                        </div>
                        {category.nomineeCount > 4 && (
                          <span className="text-[11px] font-sans text-brand-white/40">
                            +{category.nomineeCount - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action Link Button */}
                    <div className="flex items-center justify-between text-xs font-heading font-bold uppercase tracking-wider text-brand-gold group-hover:text-brand-white transition-colors">
                      <span>Vote In Category</span>
                      <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Footer />
      <ScrollToTop />
    </>
  );
}
