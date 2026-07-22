"use client";

import { useState, FormEvent } from "react";
import { Search, Loader2, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TrackedSubmission {
  stageName: string;
  category: string;
  songTitle: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
}

export function StatusTracker() {
  const [referenceId, setReferenceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submission, setSubmission] = useState<TrackedSubmission | null>(null);

  const handleTrack = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmission(null);

    const cleanId = referenceId.trim();
    if (!cleanId) {
      setErrorMsg("Please enter a Reference ID.");
      setTimeout(() => setErrorMsg(null), 6000);
      return;
    }

    // Client-side format validation (e.g. BMAA-2026-F982DA)
    const REF_ID_REGEX = /^BMAA-2026-[A-Z0-9]{6}$/i;
    if (!REF_ID_REGEX.test(cleanId)) {
      setErrorMsg("Invalid Reference ID format. Expected format: BMAA-2026-F982DA");
      setTimeout(() => setErrorMsg(null), 8000);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/submissions/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ referenceId: cleanId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No submission found with this ID.");
      }

      setSubmission(data.submission);
    } catch (err: any) {
      if (typeof window !== "undefined" && !window.navigator.onLine) {
        setErrorMsg("Network connection error. Please check your internet connection and try again.");
      } else if (err.name === "TypeError" || err.message?.includes("fetch") || err.message?.includes("NetworkError")) {
        setErrorMsg("Unable to connect to the server. Please check your network connection.");
      } else {
        setErrorMsg(err.message || "Unable to find submission. Please try again later.");
      }
      setTimeout(() => setErrorMsg(null), 8000);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyles = (status: "pending" | "approved" | "rejected") => {
    switch (status) {
      case "approved":
        return "bg-brand-status-approved/15 text-brand-status-approved border-brand-status-approved/30";
      case "rejected":
        return "bg-brand-status-rejected/15 text-brand-status-rejected border-brand-status-rejected/30";
      default:
        return "bg-brand-status-pending/15 text-brand-status-pending border-brand-status-pending/30";
    }
  };

  return (
    <motion.section 
      id="status-tracker" 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6 }}
      className="py-20 px-4 max-w-xl mx-auto border-t border-brand-brown-deep/20"
    >
      <div className="text-center mb-8">
        <h2 className="font-heading text-2xl font-bold text-brand-gold uppercase tracking-wide">
          Track Your Entry
        </h2>
        <p className="font-sans text-sm text-brand-white/60 mt-2">
          Enter your unique Reference ID to check your review status.
        </p>
      </div>

      <form onSubmit={handleTrack} className="flex gap-2 mb-6">
        <input
          type="text"
          value={referenceId}
          onChange={(e) => setReferenceId(e.target.value)}
          placeholder="e.g. BMAA-2026-F982DA"
          className="flex-1 bg-brand-surface border border-brand-brown-deep text-brand-white px-3 py-2.5 rounded focus:outline-none focus:border-brand-gold text-sm font-sans placeholder:text-brand-white/30"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-5 bg-brand-gold text-brand-bg font-heading text-sm font-bold tracking-wider uppercase rounded-md glow-gold-hover hover:glow-gold transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Track</span>
            </>
          )}
        </button>
      </form>

      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 rounded-md bg-brand-status-rejected/10 border border-brand-status-rejected/30 text-brand-status-rejected flex justify-between items-start text-left mb-4"
          >
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="font-sans text-sm">{errorMsg}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setErrorMsg(null)}
              className="text-brand-status-rejected hover:text-brand-white transition-colors cursor-pointer p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {submission && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", damping: 20, stiffness: 250 }}
            className="relative p-5 rounded-md bg-brand-surface border border-brand-brown-deep shadow-black/40 text-left flex flex-col gap-4"
          >
            {/* Close button for card */}
            <button
              type="button"
              onClick={() => setSubmission(null)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-brand-brown-deep/30 text-brand-white/40 hover:text-brand-gold transition-all cursor-pointer"
              aria-label="Close status"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex justify-between items-start gap-8 pr-6">
              <div>
                <h3 className="font-heading text-lg font-bold text-brand-white">
                  {submission.stageName}
                </h3>
                <p className="font-sans text-xs text-brand-white/60 mt-0.5">
                  {submission.songTitle}
                </p>
              </div>
              <span
                className={`font-sans text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full border tracking-wide uppercase ${getStatusStyles(
                  submission.status
                )}`}
              >
                {submission.status}
              </span>
            </div>

            <div className="h-[1px] bg-brand-brown-deep/20" />

            <div>
              <span className="font-sans text-[10px] text-brand-white/40 uppercase tracking-wider font-semibold">Category</span>
              <p className="font-sans text-sm text-brand-white/80 font-medium mt-0.5">{submission.category}</p>
            </div>

            {submission.status === "rejected" && submission.rejectionReason && (
              <div className="p-3.5 rounded bg-brand-status-rejected/5 border border-brand-status-rejected/20">
                <span className="font-sans text-[10px] text-brand-status-rejected font-bold uppercase tracking-wider">Rejection Reason</span>
                <p className="font-sans text-xs text-brand-white/80 mt-1 leading-relaxed">{submission.rejectionReason}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
