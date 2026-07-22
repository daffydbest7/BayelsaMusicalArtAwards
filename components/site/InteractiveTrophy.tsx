"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Image from "next/image";

export function InteractiveTrophy() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Motion values for 3D tilt
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth physics springs
  const mouseX = useSpring(x, { stiffness: 250, damping: 20 });
  const mouseY = useSpring(y, { stiffness: 250, damping: 20 });

  // Map mouse offsets to rotation angles (-16 deg to +16 deg)
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [16, -16]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-16, 16]);

  // Dynamic light reflection position
  const glareX = useTransform(mouseX, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(mouseY, [-0.5, 0.5], [0, 100]);

  useEffect(() => {
    // Check reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handleChange = () => setReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Calculate normalized offset from center (-0.5 to 0.5)
    const offsetX = (e.clientX - rect.left) / width - 0.5;
    const offsetY = (e.clientY - rect.top) / height - 0.5;

    x.set(offsetX);
    y.set(offsetY);
  };

  const handleMouseEnter = () => {
    if (!reducedMotion) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Ambient rotating gold backlight blur */}
      <div
        className="absolute w-[280px] sm:w-[420px] h-[280px] sm:h-[420px] rounded-full bg-gradient-to-tr from-brand-gold/25 via-brand-gold/10 to-brand-bronze/20 animate-spin blur-[60px] pointer-events-none"
        style={{ animationDuration: "18s" }}
      />

      {/* 3D Perspective Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative py-4 cursor-pointer"
        style={{ perspective: 1000 }}
      >
        <motion.div
          style={{
            rotateX: reducedMotion ? 0 : rotateX,
            rotateY: reducedMotion ? 0 : rotateY,
            transformStyle: "preserve-3d",
          }}
          animate={
            reducedMotion
              ? {}
              : isHovered
              ? { scale: 1.04 }
              : { y: [0, -8, 0], scale: 1 }
          }
          transition={
            isHovered
              ? { duration: 0.2, ease: "easeOut" }
              : {
                  y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                  scale: { duration: 0.3 },
                }
          }
          className="relative w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] rounded-2xl overflow-hidden border border-brand-gold/30 bg-brand-surface/60 shadow-2xl shadow-black/80 flex items-center justify-center backdrop-blur-md group"
        >
          {/* Trophy Image Layer (Elevated in 3D space) */}
          <div
            className="relative w-full h-full rounded-2xl overflow-hidden"
            style={{ transform: "translateZ(20px)" }}
          >
            <Image
              src="/bmaa-logo.jpeg"
              alt="BMAA Trophy Crest"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover opacity-95 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
              priority
            />
          </div>

          {/* Dynamic Light Specular Reflection Overlay */}
          {!reducedMotion && isHovered && (
            <motion.div
              className="absolute inset-0 pointer-events-none rounded-2xl z-20 opacity-40 mix-blend-overlay transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle at ${glareX.get()}% ${glareY.get()}%, rgba(255,255,255,0.8) 0%, rgba(210,148,46,0.3) 40%, transparent 80%)`,
              }}
            />
          )}

          {/* Inner Gold Frame Accent */}
          <div
            className="absolute inset-2 border border-brand-gold/30 rounded-xl pointer-events-none z-10 group-hover:border-brand-gold/60 transition-colors duration-300"
            style={{ transform: "translateZ(30px)" }}
          />

          {/* Corner Gold Badge Accent */}
          <div
            className="absolute bottom-4 right-4 px-3 py-1 bg-brand-surface/90 border border-brand-gold/40 rounded-full text-[9px] font-heading font-bold text-brand-gold uppercase tracking-widest backdrop-blur-md shadow-lg pointer-events-none z-20"
            style={{ transform: "translateZ(35px)" }}
          >
            BMAA 2026
          </div>
        </motion.div>
      </div>
    </div>
  );
}
