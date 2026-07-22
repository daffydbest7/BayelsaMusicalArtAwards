"use client";

import { useState, useRef, useEffect } from "react";
import { CATEGORIES } from "@/lib/constants/categories";
import { Search, ChevronDown, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CategorySelectProps {
  value: string;
  onChange: (val: string) => void;
  error?: boolean;
}

export function CategorySelect({ value, onChange, error }: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter categories based on search input
  const filtered = CATEGORIES.filter((cat) =>
    cat.toLowerCase().includes(search.toLowerCase())
  );

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (category: string) => {
    onChange(category);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative w-full text-left">
      <label className="font-sans text-xs font-semibold text-brand-white/80 block mb-1">
        Category *
      </label>
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-brand-bg border text-left px-3 py-2.5 rounded focus:outline-none focus:border-brand-gold text-sm font-sans flex items-center justify-between transition-colors cursor-pointer ${
          error ? "border-brand-status-rejected" : "border-brand-brown-deep"
        }`}
      >
        <span className={value ? "text-brand-white font-medium" : "text-brand-white/35"}>
          {value || "Select a Category"}
        </span>
        <ChevronDown className={`w-4 h-4 text-brand-white/40 transition-transform duration-200 ${isOpen ? "rotate-180 text-brand-gold" : ""}`} />
      </button>

      {/* Popover / Overlay Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Desktop dropdown / Mobile full-screen sheet */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm sm:absolute sm:inset-auto sm:top-full sm:left-0 sm:w-full sm:mt-1 sm:bg-brand-surface sm:border sm:border-brand-brown-deep sm:rounded-md sm:shadow-2xl sm:z-40 overflow-hidden flex flex-col sm:block"
            >
              {/* Mobile Sheet Header */}
              <div className="flex sm:hidden items-center justify-between p-4 border-b border-brand-brown-deep bg-brand-surface">
                <span className="font-heading font-bold text-brand-gold uppercase tracking-wider text-sm">
                  Select Category
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full hover:bg-brand-brown-deep/20 text-brand-white/60 hover:text-brand-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-3 border-b border-brand-brown-deep/45 bg-brand-surface">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-brand-white/30" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search 26 categories..."
                    className="w-full bg-brand-bg border border-brand-brown-deep text-brand-white pl-9 pr-3 py-2 rounded focus:outline-none focus:border-brand-gold text-xs sm:text-sm font-sans"
                    autoFocus
                  />
                </div>
              </div>

              {/* Category Options List */}
              <div className="flex-1 overflow-y-auto max-h-[60vh] sm:max-h-60 bg-brand-surface">
                {filtered.length > 0 ? (
                  filtered.map((cat, idx) => {
                    const isSelected = value === cat;
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => handleSelect(cat)}
                        className={`w-full text-left px-4 py-3 sm:py-2.5 hover:bg-brand-gold/10 hover:text-brand-gold text-xs sm:text-sm font-sans flex items-center justify-between border-b border-brand-brown-deep/20 sm:border-none cursor-pointer transition-colors ${
                          isSelected ? "text-brand-gold bg-brand-gold/5 font-semibold" : "text-brand-white/80"
                        }`}
                      >
                        <span>{cat}</span>
                        {isSelected && <Check className="w-4 h-4 text-brand-gold shrink-0 ml-2" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs sm:text-sm text-brand-white/40 font-sans">
                    No categories match your search.
                  </div>
                )}
              </div>
            </motion.div>

            {/* Mobile backdrop close listener */}
            <div
              className="fixed inset-0 z-40 sm:hidden"
              onClick={() => setIsOpen(false)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
