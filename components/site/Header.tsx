"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Vote } from "lucide-react";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { label: "Categories", href: "/#categories" },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setIsOpen(false);

    if (href.includes("#")) {
      const targetId = href.split("#")[1];

      if (pathname === "/") {
        e.preventDefault();
        setTimeout(() => {
          const element = document.getElementById(targetId);
          if (element) {
            const yOffset = -70; // Account for compact fixed header height
            const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
            window.scrollTo({ top: y, behavior: "smooth" });
            window.history.pushState(null, "", `#${targetId}`);
          }
        }, 150);
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-black border-b border-brand-brown-deep/40 py-1 shadow-md shadow-black/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Compact, clean logo alone - black background */}
        <Link href="/" className="flex items-center group py-0.5">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-black overflow-hidden">
            <Image
              src="/bmaa-logo.jpeg"
              alt="BMAA Logo"
              fill
              sizes="(max-width: 640px) 48px, 56px"
              className="object-contain group-hover:scale-105 transition-transform duration-300"
              priority
            />
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="font-sans text-sm text-brand-white/80 hover:text-brand-gold transition-colors cursor-pointer font-medium relative py-1"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/#categories"
            onClick={(e) => handleNavClick(e, "/#categories")}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-brand-gold hover:bg-brand-gold/90 text-brand-bg font-heading text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md shadow-brand-gold/20"
          >
            <Vote className="w-3.5 h-3.5" />
            Categories
          </Link>
        </nav>

        {/* Mobile Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-1.5 rounded text-brand-white hover:text-brand-gold hover:bg-brand-surface/40 transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-brand-brown-deep/40 bg-black overflow-hidden"
          >
            <div className="px-4 pt-2 pb-5 flex flex-col gap-3">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="font-sans text-base text-left text-brand-white/90 hover:text-brand-gold py-1.5 transition-colors cursor-pointer font-medium"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/#categories"
                onClick={(e) => {
                  setIsOpen(false);
                  handleNavClick(e, "/#categories");
                }}
                className="flex items-center justify-center gap-2 w-full py-2.5 mt-1 rounded-lg bg-brand-gold text-brand-bg font-heading text-sm font-bold uppercase tracking-wider shadow-lg shadow-brand-gold/20"
              >
                <Vote className="w-4 h-4" />
                Categories
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
