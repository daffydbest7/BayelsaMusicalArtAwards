"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function CategoryList() {
  return (
    <section
      id="categories"
      className="py-20 px-4 max-w-5xl mx-auto border-t border-brand-brown-deep/20 relative"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-brand-gold/5 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative"
      >
        {/* Image container — edges feathered via CSS mask so the black blends into the page */}
        <div className="relative group">
          {/* Subtle gold glow on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10"
            style={{
              boxShadow: "inset 0 0 80px -10px rgba(210, 148, 46, 0.12)",
            }}
          />

          <div
            style={{
              maskImage:
                "linear-gradient(to bottom, transparent 0%, black 6%, black 94%, transparent 100%), " +
                "linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)",
              maskComposite: "intersect",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, black 6%, black 94%, transparent 100%), " +
                "linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)",
              WebkitMaskComposite: "source-in",
            }}
          >
            <Image
              src="/bmaa-categories.jpg"
              alt="BMAA 2026 Award Categories — 25 official categories featuring Artist of the Year, Song of the Year, Album of the Year, Best New Act, Best Male Artist, Best Female Artist, Best Collaboration, Music Video of the Year, and more"
              width={3840}
              height={5120}
              unoptimized
              priority
              className="w-full h-auto object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 90vw, 900px"
            />
          </div>
        </div>

        {/* Subtle caption below the image */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-center mt-6 font-sans text-sm text-brand-white/50 tracking-wide"
        >
          26 categories recognizing excellence across music, gospel, rap &amp; more
        </motion.p>
      </motion.div>
    </section>
  );
}
