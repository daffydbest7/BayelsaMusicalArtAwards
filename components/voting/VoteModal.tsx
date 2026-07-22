"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertTriangle, Clock, Loader2 } from "lucide-react";
import { BotCheckWidget, BotCheckData, buildBotCheckPayload } from "@/components/BotCheckWidget";
import { getFingerprint } from "@/lib/fingerprint";
import { formatDate } from "@/lib/utils";

interface Nominee {
  id: string;
  stage_name: string;
  song_title: string;
  photo_url: string;
  category: string; // slug
  categoryName: string;
}

interface VoteModalProps {
  nominee: Nominee | null;
  onClose: () => void;
  onVoteSuccess: (category: string, votesRemaining: number) => void;
}

type ModalState = "confirm" | "loading" | "success" | "error";

interface ErrorInfo {
  reason: string;
  message: string;
  votesUsed?: number;
  votingOpenAt?: string;
}

export function VoteModal({ nominee, onClose, onVoteSuccess }: VoteModalProps) {
  const [state, setState] = useState<ModalState>("confirm");
  const [votesRemaining, setVotesRemaining] = useState(0);
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);
  const [botData, setBotData] = useState<BotCheckData>({});

  const handleBotVerify = useCallback((data: BotCheckData) => {
    setBotData(data);
  }, []);

  const handleVote = async () => {
    if (!nominee) return;

    setState("loading");

    try {
      const fingerprint = await getFingerprint();
      const payload = buildBotCheckPayload(botData);

      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: nominee.id,
          category: nominee.category,
          voter_fingerprint_hash: fingerprint,
          token: payload.token,
          honeypot: payload.honeypot,
          formRenderedAt: payload.formRenderedAt,
          formSubmittedAt: payload.formSubmittedAt,
        }),
      });

      const result = await res.json();

      if (result.success) {
        setVotesRemaining(result.votes_remaining ?? 0);
        setState("success");
        onVoteSuccess(nominee.category, result.votes_remaining ?? 0);
      } else {
        setErrorInfo({
          reason: result.reason,
          message: result.message,
          votesUsed: result.votes_used,
          votingOpenAt: result.voting_open_at,
        });
        setState("error");
      }
    } catch {
      setErrorInfo({
        reason: "network_error",
        message: "Network error. Please check your connection and try again.",
      });
      setState("error");
    }
  };

  const handleClose = () => {
    setState("confirm");
    setErrorInfo(null);
    setBotData({});
    onClose();
  };

  const getErrorDisplay = () => {
    if (!errorInfo) return { icon: AlertTriangle, title: "Vote Failed", message: "An error occurred." };

    switch (errorInfo.reason) {
      case "limit_reached":
        return {
          icon: Clock,
          title: "Daily Limit Reached",
          message: errorInfo.message,
        };
      case "voting_not_open":
        return {
          icon: Clock,
          title: "Voting Not Open",
          message: errorInfo.votingOpenAt
            ? `Voting hasn't started yet — check back ${formatDate(errorInfo.votingOpenAt)}.`
            : "Voting hasn't started yet.",
        };
      case "voting_closed":
        return {
          icon: AlertTriangle,
          title: "Voting Closed",
          message: "Voting has closed for BMAA 2026. Thank you for participating.",
        };
      case "verification_failed":
        return {
          icon: AlertTriangle,
          title: "Verification Failed",
          message: "Please try again. If the problem persists, refresh the page.",
        };
      default:
        return {
          icon: AlertTriangle,
          title: "Vote Failed",
          message: errorInfo.message || "An unexpected error occurred. Please try again.",
        };
    }
  };

  if (!nominee) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-brand-surface border border-brand-brown-deep w-full sm:max-w-md rounded-t-xl sm:rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-brand-brown-deep/50 bg-brand-bg">
            <h2 className="font-heading text-sm font-bold text-brand-white uppercase tracking-wider">
              {state === "success" ? "Vote Counted!" : state === "error" ? "Oops" : "Confirm Vote"}
            </h2>
            <button
              onClick={handleClose}
              className="p-1 rounded-full hover:bg-brand-brown-deep/20 text-brand-white/60 hover:text-brand-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5">
            {state === "confirm" && (
              <div className="flex flex-col gap-4">
                {/* Nominee Info */}
                <div className="flex gap-4">
                  <div className="w-20 h-[106px] rounded-md overflow-hidden border border-brand-brown-deep/50 shrink-0 bg-brand-bg">
                    <img
                      src={nominee.photo_url}
                      alt={nominee.stage_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-center gap-1.5 min-w-0">
                    <h3 className="font-heading text-lg font-bold text-brand-white leading-tight truncate">
                      {nominee.stage_name}
                    </h3>
                    <span className="font-sans text-xs text-brand-white/60 truncate">
                      {nominee.song_title}
                    </span>
                    <span className="inline-block w-fit px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-brand-gold/10 text-brand-gold border border-brand-gold/20 truncate max-w-full">
                      {nominee.categoryName}
                    </span>
                  </div>
                </div>

                <p className="font-sans text-xs text-brand-white/50 text-center">
                  You are about to cast a vote. You have a maximum of 2 votes per category per 24 hours.
                </p>

                {/* Bot Check Widget */}
                <BotCheckWidget onVerify={handleBotVerify} />

                <button
                  onClick={handleVote}
                  className="w-full py-3 bg-brand-gold hover:bg-brand-gold/90 text-brand-bg font-heading text-sm font-bold uppercase tracking-wider rounded-md glow-gold-hover hover:glow-gold transition-all duration-300 cursor-pointer"
                >
                  Cast Your Vote
                </button>
              </div>
            )}

            {state === "loading" && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="w-10 h-10 text-brand-gold animate-spin" />
                <p className="font-sans text-sm text-brand-white/60">Recording your vote...</p>
              </div>
            )}

            {state === "success" && (
              <div className="flex flex-col items-center gap-4 py-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
                >
                  <CheckCircle className="w-16 h-16 text-brand-status-approved" />
                </motion.div>
                <div className="text-center space-y-2">
                  <h3 className="font-heading text-lg font-bold text-brand-white">
                    Vote Counted!
                  </h3>
                  <p className="font-sans text-sm text-brand-white/60">
                    Your vote for <span className="text-brand-gold font-semibold">{nominee.stage_name}</span> has been recorded.
                  </p>
                  <p className="font-mono text-xs text-brand-status-pending font-semibold">
                    {votesRemaining} of 2 votes remaining for this category today
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="mt-2 px-6 py-2 bg-brand-surface border border-brand-brown-deep hover:bg-brand-brown-deep/30 text-brand-white font-heading text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition-colors"
                >
                  Continue Browsing
                </button>
              </div>
            )}

            {state === "error" && (() => {
              const errorDisplay = getErrorDisplay();
              const ErrorIcon = errorDisplay.icon;
              return (
                <div className="flex flex-col items-center gap-4 py-6">
                  <ErrorIcon className="w-12 h-12 text-brand-status-rejected" />
                  <div className="text-center space-y-2">
                    <h3 className="font-heading text-base font-bold text-brand-white">
                      {errorDisplay.title}
                    </h3>
                    <p className="font-sans text-sm text-brand-white/60">
                      {errorDisplay.message}
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="mt-2 px-6 py-2 bg-brand-surface border border-brand-brown-deep hover:bg-brand-brown-deep/30 text-brand-white font-heading text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition-colors"
                  >
                    Close
                  </button>
                </div>
              );
            })()}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
