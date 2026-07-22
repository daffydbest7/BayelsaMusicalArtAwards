"use client";

import { motion, Variants } from "framer-motion";
import { CATEGORIES } from "@/lib/constants/categories";

export function CategoryList() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <section id="categories" className="py-20 px-4 max-w-6xl mx-auto border-t border-brand-brown-deep/20 relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-brand-gold/5 blur-[120px] pointer-events-none" />

      <div className="text-center mb-12">
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-brand-gold uppercase tracking-wide">
          Official Categories
        </h2>
        <p className="font-sans text-sm text-brand-white/60 mt-3 max-w-xl mx-auto leading-relaxed">
          An overview of all 26 official categories featured in the BMAA 2026. Review eligibility and choose your best fit.
        </p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
      >
        {CATEGORIES.map((category, idx) => {
          const formattedNumber = String(idx + 1).padStart(2, "0");
          return (
            <motion.div
              key={idx}
              variants={cardVariants}
              whileHover={{ 
                scale: 1.02, 
                y: -4,
                borderColor: "rgba(210, 148, 46, 0.8)",
                boxShadow: "0 0 20px -4px rgba(210, 148, 46, 0.25)"
              }}
              className="p-5 rounded-md bg-brand-surface border border-brand-brown-deep/60 shadow-lg shadow-black/40 flex items-start gap-4 transition-all duration-300 group cursor-default"
            >
              {/* Scoring tag design */}
              <span className="font-mono text-xs sm:text-sm text-brand-gold/50 font-bold group-hover:text-brand-gold transition-colors pt-0.5">
                {formattedNumber}
              </span>
              <div className="flex flex-col gap-1 text-left">
                <span className="font-heading text-base sm:text-lg text-brand-white group-hover:text-brand-gold transition-colors font-semibold leading-snug">
                  {category}
                </span>
                <span className="font-sans text-[11px] text-brand-white/40 group-hover:text-brand-white/60 transition-colors uppercase tracking-wider font-semibold">
                  BMAA Nominee Class
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
