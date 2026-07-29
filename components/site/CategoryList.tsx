"use client";

import { motion, Variants } from "framer-motion";
import React from "react";

/* ───────────────────────────────────────────────────────────
   SVG Icons — white silhouettes matching the award plaque poster
   ─────────────────────────────────────────────────────────── */

const icons: Record<string, React.ReactNode> = {
  /* Artist of the Year — singer silhouette */
  "Artist of the Year": (
    <svg viewBox="0 0 64 64" fill="white" xmlns="http://www.w3.org/2000/svg">
      <circle cx="38" cy="14" r="8" />
      <path d="M26 60V36c0-6 4-10 10-10h4c6 0 10 4 10 10v24" stroke="white" strokeWidth="2" fill="none" />
      <path d="M30 38l-12 8v-12l12-4v8z" />
      <path d="M20 32l-6 4v-8l6-2v6z" opacity="0.7" />
    </svg>
  ),

  /* Song of the Year — music note */
  "Song of the Year": (
    <svg viewBox="0 0 64 64" fill="white" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="22" cy="50" rx="10" ry="7" />
      <rect x="30" y="10" width="4" height="42" />
      <path d="M34 10c8 2 16 4 16 12s-8 8-16 6V10z" />
    </svg>
  ),

  /* Album of the Year — vinyl record */
  "Album of the Year": (
    <svg viewBox="0 0 64 64" fill="white" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="48" height="48" rx="4" fill="none" stroke="white" strokeWidth="3" />
      <circle cx="32" cy="32" r="16" fill="none" stroke="white" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="5" />
      <circle cx="32" cy="32" r="10" fill="none" stroke="white" strokeWidth="1" opacity="0.5" />
    </svg>
  ),

  /* Best New Act — star */
  "Best New Act": (
    <svg viewBox="0 0 64 64" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 6l8 16 18 3-13 13 3 18-16-8-16 8 3-18L6 25l18-3z" />
    </svg>
  ),

  /* Best Male Artist — microphone */
  "Best Male Artist": (
    <svg viewBox="0 0 64 64" fill="white" xmlns="http://www.w3.org/2000/svg">
      <rect x="24" y="6" width="16" height="28" rx="8" />
      <path d="M18 28v6c0 8 6 14 14 14s14-6 14-14v-6" fill="none" stroke="white" strokeWidth="3" />
      <rect x="30" y="48" width="4" height="10" />
      <rect x="22" y="56" width="20" height="4" rx="2" />
    </svg>
  ),

  /* Best Female Artist — female singer silhouette */
  "Best Female Artist": (
    <svg viewBox="0 0 64 64" fill="white" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="14" r="9" />
      <path d="M20 58c0-8 2-18 4-24 1-3 3-5 6-6l2 8 2-8c3 1 5 3 6 6 2 6 4 16 4 24H20z" />
      <path d="M24 14c-2 4-8 6-10 10" stroke="white" strokeWidth="2" fill="none" opacity="0.7" />
      <path d="M40 14c2 4 8 6 10 10" stroke="white" strokeWidth="2" fill="none" opacity="0.7" />
    </svg>
  ),

  /* Best Collaboration — handshake */
  "Best Collaboration": (
    <svg viewBox="0 0 64 64" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 28l14-12h8l-4 6 8-2 8 2-4-6h8l14 12-6 6-8-6-4 6-4-6-4 6-4-6-8 6-6-6z" />
      <path d="M24 38l8 8 8-8" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 42l-4 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M44 42l4 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),

  /* Music Video of the Year — play on film strip */
  "Music Video of the Year": (
    <svg viewBox="0 0 64 64" fill="white" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="12" width="48" height="40" rx="3" fill="none" stroke="white" strokeWidth="3" />
      <polygon points="26,22 26,42 44,32" />
      <rect x="10" y="12" width="6" height="6" opacity="0.5" />
      <rect x="48" y="12" width="6" height="6" opacity="0.5" />
      <rect x="10" y="46" width="6" height="6" opacity="0.5" />
      <rect x="48" y="46" width="6" height="6" opacity="0.5" />
    </svg>
  ),

  /* Best Video Director — director's chair */
  "Best Video Director": (
    <svg viewBox="0 0 64 64" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 16l6 38" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <path d="M48 16l-6 38" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <path d="M14 30h36" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <rect x="12" y="22" width="40" height="8" rx="2" fill="white" opacity="0.8" />
      <path d="M22 54h20" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),

  /* Afrobeats Song of the Year — treble clef with notes */
  "Afrobeats Song of the Year": (
    <svg viewBox="0 0 64 64" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 50c-4 0-8-3-8-7s4-7 8-7 6 2 6 5v-28l24-6v28c0 3-4 7-8 7s-8-3-8-7 4-5 8-5" fill="none" stroke="white" strokeWidth="3" />
      <ellipse cx="18" cy="48" rx="6" ry="4.5" />
      <ellipse cx="42" cy="42" rx="6" ry="4.5" />
      <line x1="24" y1="12" x2="24" y2="48" stroke="white" strokeWidth="2.5" />
      <line x1="48" y1="6" x2="48" y2="42" stroke="white" strokeWidth="2.5" />
      <line x1="24" y1="12" x2="48" y2="6" stroke="white" strokeWidth="2.5" />
    </svg>
  ),

  /* Best Rap Artist — mic in hand */
  "Best Rap Artist": (
    <svg viewBox="0 0 64 64" fill="white" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="12" r="7" />
      <path d="M24 22h16c4 0 8 4 8 8v14H16V30c0-4 4-8 8-8z" />
      <rect x="14" y="36" width="6" height="18" rx="3" transform="rotate(-20 17 45)" />
      <rect x="28" y="44" width="4" height="14" rx="2" />
      <circle cx="30" cy="58" r="3" />
    </svg>
  ),

  /* Best Rap Album — album/device */
  "Best Rap Album": (
    <svg viewBox="0 0 64 64" fill="white" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="6" width="28" height="52" rx="4" fill="none" stroke="white" strokeWidth="3" />
      <rect x="22" y="12" width="20" height="32" rx="2" fill="white" opacity="0.3" />
      <circle cx="32" cy="50" r="3" />
    </svg>
  ),

  /* Best Gospel Act — praying hands */
  "Best Gospel Act": (
    <svg viewBox="0 0 64 64" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 8L22 34c0 0-2 6 2 10l8 10 8-10c4-4 2-10 2-10L32 8z" />
      <line x1="32" y1="8" x2="32" y2="54" stroke="white" strokeWidth="1.5" opacity="0.5" />
      <path d="M22 34c4 2 8 3 10 3s6-1 10-3" fill="none" stroke="white" strokeWidth="1.5" opacity="0.5" />
      <path d="M26 42c3 1 5 2 6 2s3-1 6-2" fill="none" stroke="white" strokeWidth="1.5" opacity="0.5" />
    </svg>
  ),

  /* Best Gospel Song — music note with cross */
  "Best Gospel Song": (
    <svg viewBox="0 0 64 64" fill="white" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="20" cy="48" rx="9" ry="6" />
      <rect x="27" y="10" width="3.5" height="40" />
      <path d="M30.5 10c6 2 14 4 14 10s-6 6-14 4V10z" />
      <line x1="10" y1="20" x2="18" y2="20" stroke="white" strokeWidth="2.5" />
      <line x1="14" y1="16" x2="14" y2="24" stroke="white" strokeWidth="2.5" />
    </svg>
  ),

  /* Best Gospel Album — bible */
  "Best Gospel Album": (
    <svg viewBox="0 0 64 64" fill="white" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="8" width="36" height="48" rx="3" fill="none" stroke="white" strokeWidth="3" />
      <line x1="22" y1="8" x2="22" y2="56" stroke="white" strokeWidth="2" opacity="0.5" />
      <line x1="28" y1="24" x2="40" y2="24" stroke="white" strokeWidth="2.5" />
      <line x1="34" y1="18" x2="34" y2="30" stroke="white" strokeWidth="2.5" />
    </svg>
  ),

  /* Best Gospel Video — cross with screen */
  "Best Gospel Video": (
    <svg viewBox="0 0 64 64" fill="white" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="14" width="44" height="32" rx="3" fill="none" stroke="white" strokeWidth="3" />
      <line x1="32" y1="22" x2="32" y2="40" stroke="white" strokeWidth="3" />
      <line x1="24" y1="28" x2="40" y2="28" stroke="white" strokeWidth="3" />
      <line x1="26" y1="46" x2="38" y2="46" stroke="white" strokeWidth="2.5" />
      <line x1="32" y1="46" x2="32" y2="52" stroke="white" strokeWidth="2.5" />
      <line x1="24" y1="52" x2="40" y2="52" stroke="white" strokeWidth="2.5" />
    </svg>
  ),

  /* Best Bayelsa Artist in the Diaspora — globe */
  "Best Bayelsa Artist in the Diaspora": (
    <svg viewBox="0 0 64 64" fill="white" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="22" fill="none" stroke="white" strokeWidth="3" />
      <ellipse cx="32" cy="32" rx="10" ry="22" fill="none" stroke="white" strokeWidth="2" />
      <line x1="10" y1="32" x2="54" y2="32" stroke="white" strokeWidth="2" />
      <path d="M14 20h36" stroke="white" strokeWidth="1.5" opacity="0.6" />
      <path d="M14 44h36" stroke="white" strokeWidth="1.5" opacity="0.6" />
    </svg>
  ),

  /* Best Gospel Choir — group of singers */
  "Best Gospel Choir": (
    <svg viewBox="0 0 64 64" fill="white" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="18" r="5" />
      <circle cx="32" cy="14" r="6" />
      <circle cx="44" cy="18" r="5" />
      <path d="M12 44V34c0-4 3-7 7-7h2c3 0 5 2 6 4" />
      <path d="M52 44V34c0-4-3-7-7-7h-2c-3 0-5 2-6 4" />
      <path d="M22 46V34c0-5 4-9 9-9h2c5 0 9 4 9 9v12" />
      <circle cx="14" cy="24" r="3.5" opacity="0.6" />
      <circle cx="50" cy="24" r="3.5" opacity="0.6" />
      <path d="M8 48V40c0-3 2-5 5-5" opacity="0.6" />
      <path d="M56 48V40c0-3-2-5-5-5" opacity="0.6" />
    </svg>
  ),

  /* Best Owigiri Pop Artist — singer with notes */
  "Best Owigiri Pop Artist": (
    <svg viewBox="0 0 64 64" fill="white" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="14" r="8" />
      <path d="M18 56V38c0-6 4-10 8-10h4c4 0 8 4 8 10v18" />
      <ellipse cx="50" cy="26" rx="4" ry="3" />
      <line x1="54" y1="14" x2="54" y2="26" stroke="white" strokeWidth="2" />
      <path d="M54 14l6-2v6l-6-2" />
      <ellipse cx="50" cy="40" rx="3" ry="2" opacity="0.6" />
      <line x1="53" y1="32" x2="53" y2="40" stroke="white" strokeWidth="1.5" opacity="0.6" />
    </svg>
  ),

  /* Best Campus Act — graduation cap */
  "Best Campus Act": (
    <svg viewBox="0 0 64 64" fill="white" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="20" r="8" />
      <path d="M22 54V40c0-5 4-9 10-9 6 0 10 4 10 9v14" />
      <polygon points="18,10 32,4 46,10 32,16" />
      <line x1="46" y1="10" x2="46" y2="22" stroke="white" strokeWidth="2" />
      <circle cx="46" cy="24" r="2" />
    </svg>
  ),

  /* Best Owigiri Artist — drum */
  "Best Owigiri Artist": (
    <svg viewBox="0 0 64 64" fill="white" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="18" rx="18" ry="8" fill="none" stroke="white" strokeWidth="3" />
      <ellipse cx="32" cy="18" rx="18" ry="8" fill="white" opacity="0.2" />
      <line x1="14" y1="18" x2="14" y2="48" stroke="white" strokeWidth="3" />
      <line x1="50" y1="18" x2="50" y2="48" stroke="white" strokeWidth="3" />
      <ellipse cx="32" cy="48" rx="18" ry="8" fill="none" stroke="white" strokeWidth="3" />
      <line x1="20" y1="20" x2="20" y2="50" stroke="white" strokeWidth="1.5" opacity="0.3" />
      <line x1="44" y1="20" x2="44" y2="50" stroke="white" strokeWidth="1.5" opacity="0.3" />
    </svg>
  ),

  /* Best DJ — turntable */
  "Best DJ": (
    <svg viewBox="0 0 64 64" fill="white" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="16" width="48" height="36" rx="4" fill="none" stroke="white" strokeWidth="3" />
      <circle cx="28" cy="34" r="12" fill="none" stroke="white" strokeWidth="2.5" />
      <circle cx="28" cy="34" r="3" />
      <circle cx="28" cy="34" r="7" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
      <rect x="44" y="24" width="8" height="4" rx="2" />
      <rect x="44" y="32" width="8" height="4" rx="2" />
      <rect x="44" y="40" width="8" height="4" rx="2" />
    </svg>
  ),

  /* Music Producer of the Year — headphones + mixer */
  "Music Producer of the Year": (
    <svg viewBox="0 0 64 64" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 34V28c0-9 7-16 16-16s16 7 16 16v6" fill="none" stroke="white" strokeWidth="3" />
      <rect x="10" y="32" width="8" height="16" rx="4" />
      <rect x="46" y="32" width="8" height="16" rx="4" />
      <rect x="24" y="52" width="6" height="8" rx="1" opacity="0.7" />
      <rect x="34" y="50" width="6" height="10" rx="1" opacity="0.7" />
    </svg>
  ),

  /* Sound Engineer of the Year — mixer/equalizer */
  "Sound Engineer of the Year": (
    <svg viewBox="0 0 64 64" fill="white" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="44" height="44" rx="4" fill="none" stroke="white" strokeWidth="3" />
      <rect x="18" y="20" width="4" height="24" rx="2" />
      <rect x="26" y="16" width="4" height="28" rx="2" />
      <rect x="34" y="24" width="4" height="20" rx="2" />
      <rect x="42" y="18" width="4" height="26" rx="2" />
      <circle cx="20" cy="30" r="2.5" fill="none" stroke="white" strokeWidth="1.5" />
      <circle cx="28" cy="26" r="2.5" fill="none" stroke="white" strokeWidth="1.5" />
      <circle cx="36" cy="32" r="2.5" fill="none" stroke="white" strokeWidth="1.5" />
      <circle cx="44" cy="28" r="2.5" fill="none" stroke="white" strokeWidth="1.5" />
    </svg>
  ),

  /* Hypeman of the Year — person with megaphone */
  "Hypeman of the Year": (
    <svg viewBox="0 0 64 64" fill="white" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="14" r="8" />
      <path d="M14 56V38c0-6 4-10 8-10h4c4 0 8 4 8 10v18" />
      <polygon points="36,22 54,14 54,34 36,30" />
      <line x1="48" y1="34" x2="50" y2="44" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),

  /* Best Owigiri Song — music note variant */
  "Best Owigiri Song": (
    <svg viewBox="0 0 64 64" fill="white" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="18" cy="48" rx="9" ry="6" />
      <rect x="25" y="12" width="3.5" height="38" />
      <path d="M28.5 12c8 2 18 5 18 12s-8 7-18 5V12z" />
    </svg>
  ),
};

/* ─────────────────────────────────────────
   Category data with ordering from the poster
   ───────────────────────────────────────── */

const POSTER_CATEGORIES = [
  "Artist of the Year",
  "Song of the Year",
  "Album of the Year",
  "Best New Act",
  "Best Male Artist",
  "Best Female Artist",
  "Best Collaboration",
  "Music Video of the Year",
  "Best Video Director",
  "Afrobeats Song of the Year",
  "Best Rap Artist",
  "Best Rap Album",
  "Best Gospel Act",
  "Best Gospel Song",
  "Best Gospel Album",
  "Best Gospel Video",
  "Best Bayelsa Artist in the Diaspora",
  "Best Gospel Choir",
  "Best Owigiri Pop Artist",
  "Best Campus Act",
  "Best Owigiri Artist",
  "Best DJ",
  "Music Producer of the Year",
  "Hypeman of the Year",
  "Best Owigiri Song",
  "Sound Engineer of the Year",
];

/* ─────────────────────────────────────────
   Component
   ───────────────────────────────────────── */

export function CategoryList() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.04 },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.85 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <section
      id="categories"
      className="py-20 px-4 max-w-6xl mx-auto border-t border-brand-brown-deep/20 relative"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-brand-gold/5 blur-[120px] pointer-events-none" />

      {/* Title block — matching the poster header style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6 }}
        className="text-center mb-14"
      >
        <h2 className="inline-block font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-brand-bg uppercase tracking-wider px-6 py-2"
          style={{ backgroundColor: "#d2942e" }}
        >
          BMAA 2026 Award
        </h2>
        <div className="mt-2">
          <span className="inline-block font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-brand-bg uppercase tracking-wider px-6 py-1.5"
            style={{ backgroundColor: "#d2942e" }}
          >
            Categories
          </span>
        </div>
        <p className="font-heading text-xs sm:text-sm text-brand-white/60 mt-4 uppercase tracking-[0.25em] font-semibold">
          Celebrating Every Voice
        </p>
      </motion.div>

      {/* Category grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="grid grid-cols-2 lg:grid-cols-5 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12"
      >
        {POSTER_CATEGORIES.map((name) => (
          <motion.div
            key={name}
            variants={cardVariants}
            whileHover={{ scale: 1.08, y: -4 }}
            className="flex flex-col items-center text-center group cursor-default"
          >
            {/* Icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 mb-3 transition-transform duration-300 group-hover:drop-shadow-[0_0_12px_rgba(210,148,46,0.4)]">
              {icons[name] || (
                <svg viewBox="0 0 64 64" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="32" cy="32" r="22" fill="none" stroke="white" strokeWidth="3" />
                  <text x="32" y="38" textAnchor="middle" fontSize="18" fill="white">♪</text>
                </svg>
              )}
            </div>

            {/* Category name */}
            <span className="font-heading text-[10px] sm:text-xs font-bold uppercase tracking-wider leading-tight text-brand-gold group-hover:text-brand-white transition-colors duration-300"
              style={{ maxWidth: "120px" }}
            >
              {name}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* Subtle caption */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="text-center mt-14 font-sans text-sm text-brand-white/40 tracking-wide"
      >
        26 categories recognizing excellence across music, gospel, rap &amp; more
      </motion.p>
    </section>
  );
}
