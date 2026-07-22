"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Save,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  CalendarClock,
  Vote,
  Inbox,
  Info,
} from "lucide-react";

export interface SettingsData {
  id: number;
  submission_open_at: string | null;
  submission_close_at: string | null;
  voting_open_at: string | null;
  voting_close_at: string | null;
  updated_at: string;
}

type PhaseStatus = "upcoming" | "active" | "closed";

function getPhaseStatus(
  openAt: string | null,
  closeAt: string | null
): { status: PhaseStatus; label: string } {
  if (!openAt || !closeAt) return { status: "upcoming", label: "Not Configured" };

  const now = Date.now();
  const open = new Date(openAt).getTime();
  const close = new Date(closeAt).getTime();

  if (now < open) return { status: "upcoming", label: "Upcoming" };
  if (now >= open && now < close) return { status: "active", label: "Active" };
  return { status: "closed", label: "Closed" };
}

function getStatusColor(status: PhaseStatus): string {
  switch (status) {
    case "active":
      return "text-brand-status-approved bg-brand-status-approved/10 border-brand-status-approved/30";
    case "upcoming":
      return "text-brand-status-pending bg-brand-status-pending/10 border-brand-status-pending/30";
    case "closed":
      return "text-brand-white/50 bg-brand-white/5 border-brand-white/15";
  }
}

/** Convert an ISO string (or null) to a datetime-local input value in UTC */
function toDatetimeLocalUTC(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/** Convert a datetime-local value back to an ISO string (treated as UTC) */
function fromDatetimeLocalUTC(value: string): string | null {
  if (!value) return null;
  return new Date(value + ":00.000Z").toISOString();
}

interface SystemSettingsClientProps {
  initialSettings: SettingsData | null;
}

export function SystemSettingsClient({ initialSettings }: SystemSettingsClientProps) {
  const [settings, setSettings] = useState<SettingsData | null>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state (datetime-local string values)
  const [submissionOpen, setSubmissionOpen] = useState(
    toDatetimeLocalUTC(initialSettings?.submission_open_at ?? null)
  );
  const [submissionClose, setSubmissionClose] = useState(
    toDatetimeLocalUTC(initialSettings?.submission_close_at ?? null)
  );
  const [votingOpen, setVotingOpen] = useState(
    toDatetimeLocalUTC(initialSettings?.voting_open_at ?? null)
  );
  const [votingClose, setVotingClose] = useState(
    toDatetimeLocalUTC(initialSettings?.voting_close_at ?? null)
  );

  // Validation warnings
  const [warnings, setWarnings] = useState<string[]>([]);

  const fetchSettings = async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/settings");
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to load settings.");

      setSettings(result.data);
      setSubmissionOpen(toDatetimeLocalUTC(result.data.submission_open_at));
      setSubmissionClose(toDatetimeLocalUTC(result.data.submission_close_at));
      setVotingOpen(toDatetimeLocalUTC(result.data.voting_open_at));
      setVotingClose(toDatetimeLocalUTC(result.data.voting_close_at));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
    }
  };

  // Validate on field change
  useEffect(() => {
    const w: string[] = [];

    if (submissionOpen && submissionClose) {
      const open = new Date(submissionOpen).getTime();
      const close = new Date(submissionClose).getTime();
      if (open >= close) {
        w.push("Submission open date must be before close date.");
      }
    }

    if (votingOpen && votingClose) {
      const open = new Date(votingOpen).getTime();
      const close = new Date(votingClose).getTime();
      if (open >= close) {
        w.push("Voting open date must be before close date.");
      }
    }

    if (submissionClose && votingOpen) {
      const subClose = new Date(submissionClose).getTime();
      const voteOpen = new Date(votingOpen).getTime();
      if (voteOpen < subClose) {
        w.push("Voting window overlaps with submission window — is this intentional?");
      }
    }

    setWarnings(w);
  }, [submissionOpen, submissionClose, votingOpen, votingClose]);

  const handleSave = async () => {
    const hasHardError = warnings.some(
      (w) => w.includes("open date must be before close date")
    );
    if (hasHardError) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const body: Record<string, string | null> = {
        submission_open_at: fromDatetimeLocalUTC(submissionOpen),
        submission_close_at: fromDatetimeLocalUTC(submissionClose),
        voting_open_at: fromDatetimeLocalUTC(votingOpen),
        voting_close_at: fromDatetimeLocalUTC(votingClose),
      };

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to save settings.");

      setSuccess(true);
      await fetchSettings();

      setTimeout(() => setSuccess(false), 4000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Save failed.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const submissionPhase = getPhaseStatus(
    fromDatetimeLocalUTC(submissionOpen),
    fromDatetimeLocalUTC(submissionClose)
  );
  const votingPhase = getPhaseStatus(
    fromDatetimeLocalUTC(votingOpen),
    fromDatetimeLocalUTC(votingClose)
  );

  return (
    <div className="flex flex-col gap-6 text-left max-w-4xl mx-auto px-4 pb-16">
      {/* Title */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-gold uppercase tracking-wide">
          Settings
        </h1>
        <p className="font-sans text-xs text-brand-white/60 mt-1">
          Configure submission and voting window dates. All times are in UTC.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-brand-status-rejected/10 border border-brand-status-rejected/30 rounded-md p-4 flex items-center gap-3 text-brand-status-rejected">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="font-sans text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Success Banner */}
      {success && (
        <div className="bg-brand-status-approved/10 border border-brand-status-approved/30 rounded-md p-4 flex items-center gap-3 text-brand-status-approved animate-fadeIn">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <p className="font-sans text-sm font-medium">Settings saved successfully.</p>
        </div>
      )}

      {/* Current Phase Status Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-brand-surface p-4 rounded-md border border-brand-brown-deep shadow shadow-black/30 flex items-center gap-4">
          <div className="p-2.5 rounded-md bg-brand-bg border border-brand-brown-deep/50">
            <Inbox className="w-5 h-5 text-brand-gold" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-white/40 block">
              Submission Window
            </span>
            <span
              className={`inline-block mt-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${getStatusColor(submissionPhase.status)}`}
            >
              {submissionPhase.label}
            </span>
          </div>
        </div>

        <div className="bg-brand-surface p-4 rounded-md border border-brand-brown-deep shadow shadow-black/30 flex items-center gap-4">
          <div className="p-2.5 rounded-md bg-brand-bg border border-brand-brown-deep/50">
            <Vote className="w-5 h-5 text-brand-gold" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-white/40 block">
              Voting Window
            </span>
            <span
              className={`inline-block mt-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${getStatusColor(votingPhase.status)}`}
            >
              {votingPhase.label}
            </span>
          </div>
        </div>
      </div>

      {/* Date Editor Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submission Window */}
        <div className="bg-brand-surface rounded-md border border-brand-brown-deep shadow-lg shadow-black/40 overflow-hidden">
          <div className="p-4 border-b border-brand-brown-deep/50 bg-brand-bg flex items-center gap-3">
            <CalendarClock className="w-5 h-5 text-brand-gold" />
            <div>
              <h3 className="font-heading text-sm font-bold text-brand-white uppercase tracking-wider">
                Submission Window
              </h3>
              <p className="font-sans text-[10px] text-brand-white/40 mt-0.5">
                When artists can submit entries
              </p>
            </div>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <label className="block font-sans text-xs font-bold text-brand-white/60 uppercase tracking-wider mb-2">
                Opens At (UTC)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-brand-white/30" />
                <input
                  type="datetime-local"
                  value={submissionOpen}
                  onChange={(e) => setSubmissionOpen(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-brown-deep text-brand-white pl-10 pr-3 py-2.5 rounded focus:outline-none focus:border-brand-gold text-sm font-mono [color-scheme:dark]"
                />
              </div>
            </div>
            <div>
              <label className="block font-sans text-xs font-bold text-brand-white/60 uppercase tracking-wider mb-2">
                Closes At (UTC)
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 w-4 h-4 text-brand-white/30" />
                <input
                  type="datetime-local"
                  value={submissionClose}
                  onChange={(e) => setSubmissionClose(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-brown-deep text-brand-white pl-10 pr-3 py-2.5 rounded focus:outline-none focus:border-brand-gold text-sm font-mono [color-scheme:dark]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Voting Window */}
        <div className="bg-brand-surface rounded-md border border-brand-brown-deep shadow-lg shadow-black/40 overflow-hidden">
          <div className="p-4 border-b border-brand-brown-deep/50 bg-brand-bg flex items-center gap-3">
            <CalendarClock className="w-5 h-5 text-brand-gold" />
            <div>
              <h3 className="font-heading text-sm font-bold text-brand-white uppercase tracking-wider">
                Voting Window
              </h3>
              <p className="font-sans text-[10px] text-brand-white/40 mt-0.5">
                When the public can vote for nominees
              </p>
            </div>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <label className="block font-sans text-xs font-bold text-brand-white/60 uppercase tracking-wider mb-2">
                Opens At (UTC)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-brand-white/30" />
                <input
                  type="datetime-local"
                  value={votingOpen}
                  onChange={(e) => setVotingOpen(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-brown-deep text-brand-white pl-10 pr-3 py-2.5 rounded focus:outline-none focus:border-brand-gold text-sm font-mono [color-scheme:dark]"
                />
              </div>
            </div>
            <div>
              <label className="block font-sans text-xs font-bold text-brand-white/60 uppercase tracking-wider mb-2">
                Closes At (UTC)
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 w-4 h-4 text-brand-white/30" />
                <input
                  type="datetime-local"
                  value={votingClose}
                  onChange={(e) => setVotingClose(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-brown-deep text-brand-white pl-10 pr-3 py-2.5 rounded focus:outline-none focus:border-brand-gold text-sm font-mono [color-scheme:dark]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, idx) => {
            const isHardError = w.includes("open date must be before close date");
            return (
              <div
                key={idx}
                className={`rounded-md p-3 flex items-start gap-3 text-sm font-sans ${
                  isHardError
                    ? "bg-brand-status-rejected/10 border border-brand-status-rejected/30 text-brand-status-rejected"
                    : "bg-brand-status-pending/10 border border-brand-status-pending/30 text-brand-status-pending"
                }`}
              >
                {isHardError ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{w}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Save Button + Last Updated */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-brand-brown-deep/30 pt-5">
        <div className="text-[11px] text-brand-white/40 font-sans">
          {settings?.updated_at && (
            <span>
              Last updated:{" "}
              {new Date(settings.updated_at).toLocaleString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={
            saving ||
            warnings.some((w) => w.includes("open date must be before close date"))
          }
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-gold hover:bg-brand-gold/90 text-brand-bg font-heading text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
