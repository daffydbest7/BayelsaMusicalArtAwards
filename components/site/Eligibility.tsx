"use client";

import Image from "next/image";
import { motion, Variants } from "framer-motion";

export function Eligibility() {
  const criteria = [
    {
      image: "/eligibility-materials.png",
      title: "Eligible Materials",
      description: "Music must be publicly available on digital platforms, radio, or TV.",
    },
    {
      image: "/eligibility-period.png",
      title: "Eligibility Period",
      description: "Release date must fall between Dec 27, 2021 and Apr 27, 2026.",
    },
    {
      image: "/eligibility-rights.png",
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
        {criteria.map((item, idx) => (
          <motion.div
            key={idx}
            variants={cardVariants}
            whileHover={{ 
              y: -5,
              borderColor: "rgba(210, 148, 46, 0.6)",
              boxShadow: "0 0 24px -4px rgba(210, 148, 46, 0.2)"
            }}
            className="flex flex-col rounded-md overflow-hidden bg-brand-surface border border-brand-brown-deep shadow-lg shadow-black/50 transition-all duration-300 group cursor-default"
          >
            {/* Visual illustration image container */}
            <div className="relative h-44 sm:h-48 w-full border-b border-brand-brown-deep/40 overflow-hidden bg-brand-bg">
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-surface to-transparent opacity-60" />
            </div>

            {/* Content card body */}
            <div className="p-6 flex flex-col text-left gap-2">
              <h3 className="font-heading text-lg font-bold text-brand-gold group-hover:text-brand-white transition-colors duration-300">
                {item.title}
              </h3>
              <p className="font-sans text-xs sm:text-sm text-brand-white/70 leading-relaxed font-medium">
                {item.description}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
