"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Vote } from "lucide-react";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Eligibility", href: "/#eligibility" },
    { label: "Categories", href: "/#categories" },
    { label: "Submit Entry", href: "/#entry-form" },
    { label: "Track Status", href: "/#status-tracker" },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setIsOpen(false);

    if (href.includes("#")) {
      const targetId = href.split("#")[1];

      if (pathname === "/") {
        e.preventDefault();
        // Delay slightly so mobile menu collapse animation completes and page height stabilizes
        setTimeout(() => {
          const element = document.getElementById(targetId);
          if (element) {
            const yOffset = -80; // Account for fixed header height
            const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
            window.scrollTo({ top: y, behavior: "smooth" });
            window.history.pushState(null, "", `#${targetId}`);
          }
        }, 150);
      }
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "backdrop-blur-md bg-brand-bg/90 border-b border-brand-brown-deep/40 py-3 shadow-lg shadow-black/20"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo and Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 rounded-full overflow-hidden border border-brand-gold/60 group-hover:border-brand-gold shadow-md shadow-brand-gold/10 transition-colors">
            <Image
              src="/bmaa-logo.jpeg"
              alt="BMAA Logo"
              fill
              sizes="36px"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <span className="font-heading font-bold text-lg sm:text-xl tracking-wider text-brand-white group-hover:text-brand-gold transition-colors">
            BMAA
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="font-sans text-sm text-brand-white/80 hover:text-brand-gold transition-colors cursor-pointer font-medium relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-brand-gold hover:after:w-full after:transition-all after:duration-300"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/voting"
            className="hidden flex items-center gap-2 px-5 py-2 rounded bg-brand-gold text-brand-bg font-heading text-xs font-bold uppercase tracking-wider glow-gold-hover hover:glow-gold transition-all duration-300"
          >
            <Vote className="w-3.5 h-3.5 " />
            Vote Now
          </Link>
        </nav>

        {/* Mobile Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded text-brand-white hover:text-brand-gold hover:bg-brand-surface/40 transition-colors cursor-pointer"
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
            className="md:hidden border-b border-brand-brown-deep/40 bg-brand-surface/95 backdrop-blur-md overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="font-sans text-base text-left text-brand-white/90 hover:text-brand-gold py-2 transition-colors cursor-pointer font-medium"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/voting"
                onClick={() => setIsOpen(false)}
                className="hidden flex items-center justify-center gap-2 w-full py-3 mt-2 rounded bg-brand-gold text-brand-bg font-heading text-sm font-bold uppercase tracking-wider"
              >
                <Vote className="w-4 h-4" />
                Vote Now
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
