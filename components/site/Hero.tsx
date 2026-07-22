"use client";

import { motion, Variants } from "framer-motion";
import Image from "next/image";
import { FallingStars } from "./FallingStars";
import { InteractiveTrophy } from "./InteractiveTrophy";

interface HeroProps {
  onEnterClick?: () => void;
}

export function Hero({ onEnterClick }: HeroProps) {
  const handleScroll = () => {
    if (onEnterClick) {
      onEnterClick();
    } else {
      const el = document.getElementById("entry-form");
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12, // 80-120ms stagger
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 }, // 12-16px upward slide
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1], // premium custom ease-out
      },
    },
  };

  const trophyVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9, rotate: -3 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        duration: 1.2,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <section className="relative flex items-center justify-center min-h-[90vh] text-left px-4 sm:px-8 lg:px-16 py-12 sm:py-20 overflow-hidden bg-gradient-to-b from-brand-bg via-brand-bg to-brand-surface/30">
      {/* 3D Falling Stars Canvas */}
      <FallingStars />

      {/* Premium Spotlight Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-brand-gold/5 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] rounded-full bg-brand-bronze/10 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
        {/* Left: Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-7 flex flex-col items-start gap-6"
        >
          {/* Presenter tag */}
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-2"
          >
           
            <p className="font-sans text-brand-gold/80 text-xs sm:text-sm font-bold tracking-[0.25em] uppercase">
              Bayelsa Musical Artiste Awards Presents
            </p>
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={itemVariants}
            className="font-heading text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-brand-white uppercase leading-none"
          >
            BMAA <span className="text-brand-gold glow-text">2026</span>
          </motion.h1>

          {/* Theme Tag */}
          <motion.div
            variants={itemVariants}
            className="px-4 py-2 border border-brand-gold/30 rounded bg-brand-surface/60 shadow-lg shadow-black/30 inline-flex items-center gap-2 backdrop-blur-sm"
          >
          
            <span className="font-heading text-sm sm:text-base text-brand-white font-bold tracking-wider uppercase">
              Beyond the Plains
            </span>
          </motion.div>

          {/* Copy */}
          <motion.p
            variants={itemVariants}
            className="font-sans text-brand-white/70 text-base sm:text-lg max-w-xl leading-relaxed mt-2"
          >
            Celebrating the rich musical heritage, resilience, and outstanding talent of Bayelsa. Are you a Bayelsa-born or Bayelsa-based artiste? This is your stage. This is your award.
          </motion.p>

          {/* CTA */}
          <motion.div variants={itemVariants} className="mt-4 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button
              onClick={handleScroll}
              className="px-8 py-4 bg-brand-gold text-brand-bg font-heading text-sm font-bold tracking-wider uppercase rounded-md glow-gold-hover hover:glow-gold transition-all duration-300 transform active:scale-95 text-center cursor-pointer shadow-lg shadow-brand-gold/10"
            >
              Enter Now
            </button>
            <a
              href="#categories"
              className="px-8 py-4 bg-transparent border border-brand-brown-deep hover:border-brand-gold text-brand-white hover:text-brand-gold font-heading text-sm font-bold tracking-wider uppercase rounded-md transition-all duration-300 text-center cursor-pointer backdrop-blur-sm"
            >
              Explore Categories
            </a>
          </motion.div>
        </motion.div>

        {/* Right: Premium Interactive 3D Trophy Display */}
        <motion.div
          variants={trophyVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-5 flex justify-center items-center relative"
        >
          <InteractiveTrophy />
        </motion.div>
      </div>
    </section>
  );
}
