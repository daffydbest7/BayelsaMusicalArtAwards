"use client";

import { motion, Variants } from "framer-motion";
import { Radio, CalendarDays, ShieldCheck } from "lucide-react";

export function Eligibility() {
  const criteria = [
    {
      icon: Radio,
      title: "Eligible Materials",
      description: "Music must be publicly available on digital platforms, radio, or TV.",
    },
    {
      icon: CalendarDays,
      title: "Eligibility Period",
      description: "Release date must fall between Dec 27, 2021 and Apr 27, 2026.",
    },
    {
      icon: ShieldCheck,
      title: "Rights Ownership",
      description: "Artistes must own or have legal rights to all submitted recordings.",
    },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <section id="eligibility" className="py-20 px-4 max-w-5xl mx-auto border-t border-brand-brown-deep/20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 className="font-heading text-3xl font-bold text-brand-gold uppercase tracking-wide">
          Eligibility & Rules
        </h2>
        <p className="font-sans text-sm text-brand-white/60 mt-3 max-w-md mx-auto leading-relaxed">
          Ensure your submission satisfies the guidelines before entering the awards.
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {criteria.map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <motion.div
              key={idx}
              variants={cardVariants}
              whileHover={{ 
                y: -5,
                borderColor: "rgba(210, 148, 46, 0.6)",
                boxShadow: "0 0 24px -4px rgba(210, 148, 46, 0.2)"
              }}
              className="flex flex-col items-center text-center p-8 rounded-md bg-brand-surface border border-brand-brown-deep shadow-lg shadow-black/50 transition-all duration-300 group cursor-default"
            >
              {/* Premium Metallic Icon Container */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-b from-brand-gold/20 to-brand-brown-deep/40 border border-brand-gold/40 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-brand-gold transition-all duration-300 shadow-inner shrink-0">
                <IconComponent className="w-8 h-8 text-brand-gold group-hover:text-brand-white transition-colors duration-300" />
              </div>

              {/* Content card body */}
              <div className="flex flex-col gap-2">
                <h3 className="font-heading text-lg font-bold text-brand-gold group-hover:text-brand-white transition-colors duration-300">
                  {item.title}
                </h3>
                <p className="font-sans text-xs sm:text-sm text-brand-white/70 leading-relaxed font-medium">
                  {item.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
