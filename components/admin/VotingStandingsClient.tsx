"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Trophy,
  Vote,
  Users,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Eye,
  EyeOff,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react";
import {
  exportVotingStandingsToCSV,
  exportVotingStandingsToExcel,
  exportVotingStandingsToPDF,
} from "@/lib/export-voting";

export interface NomineeStanding {
  id: string;
  stage_name: string;
  song_title: string;
  photo_url: string;
  votes: number;
}

export interface CategoryStanding {
  category: string;
  totalVotes: number;
  nominees: NomineeStanding[];
}

export interface VelocityFlag {
  type: string;
  category: string;
  pattern: string;
  count: number;
  rawData?: Array<{ ip: string | null; fingerprint: string; timestamp: string }>;
}

export interface VotingData {
  standings: CategoryStanding[];
  totalVotes: number;
  uniqueVoters: number;
  velocityFlags: VelocityFlag[];
}

interface VotingStandingsClientProps {
  initialData: VotingData | null;
}

export function VotingStandingsClient({ initialData }: VotingStandingsClientProps) {
  const [data, setData] = useState<VotingData | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showRawData, setShowRawData] = useState<Set<number>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Export state
  const [exportingFormat, setExportingFormat] = useState<"csv" | "excel" | "pdf" | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    if (!data || !data.standings) return;
    setExportingFormat(format);
    setShowExportMenu(false);

    try {
      if (format === "csv") {
        exportVotingStandingsToCSV(data.standings, data.totalVotes, data.uniqueVoters);
      } else if (format === "excel") {
        exportVotingStandingsToExcel(data.standings, data.totalVotes, data.uniqueVoters);
      } else if (format === "pdf") {
        exportVotingStandingsToPDF(data.standings, data.totalVotes, data.uniqueVoters);
      }
    } catch (err: any) {
      alert(err.message || "Failed to generate export file.");
    } finally {
      setExportingFormat(null);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/voting");
      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Failed to load voting data.");
      setData(result.data);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (data) {
      setExpandedCategories(new Set(data.standings.map((s) => s.category)));
    }
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  const toggleRawData = (flagIndex: number) => {
    setShowRawData((prev) => {
      const next = new Set(prev);
      if (next.has(flagIndex)) {
        next.delete(flagIndex);
      } else {
        next.add(flagIndex);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6 text-left max-w-6xl mx-auto px-4 pb-16">
      {/* Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-gold uppercase tracking-wide">
            Live Voting
          </h1>
          <p className="font-sans text-xs text-brand-white/60 mt-1">
            Real-time vote standings and integrity monitoring.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Export Standings Button */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exportingFormat !== null || !data}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-surface hover:bg-brand-brown-deep/30 border border-brand-brown-deep text-brand-white rounded text-[10px] font-heading font-bold uppercase tracking-wider cursor-pointer transition-colors disabled:opacity-50"
            >
              {exportingFormat ? (
                <Loader2 className="w-3 h-3 animate-spin text-brand-gold" />
              ) : (
                <Download className="w-3 h-3 text-brand-gold" />
              )}
              <span>{exportingFormat ? `Exporting ${exportingFormat.toUpperCase()}...` : "Export Standings"}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-brand-surface border border-brand-brown-deep rounded shadow-xl z-30 py-1 font-sans text-xs">
                <button
                  onClick={() => handleExport("csv")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-brand-white hover:bg-brand-gold/10 hover:text-brand-gold transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-brand-gold" />
                  <span>Export as CSV (.csv)</span>
                </button>
                <button
                  onClick={() => handleExport("excel")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-brand-white hover:bg-brand-gold/10 hover:text-brand-gold transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-brand-gold" />
                  <span>Export as Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-brand-white hover:bg-brand-gold/10 hover:text-brand-gold transition-colors"
                >
                  <FileText className="w-4 h-4 text-brand-gold" />
                  <span>Export as PDF (.pdf)</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-heading font-bold uppercase tracking-wider border cursor-pointer transition-colors ${
              autoRefresh
                ? "bg-brand-status-approved/10 text-brand-status-approved border-brand-status-approved/30"
                : "bg-brand-surface text-brand-white/60 border-brand-brown-deep"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? "bg-brand-status-approved animate-pulse" : "bg-brand-white/30"}`} />
            {autoRefresh ? "Live" : "Paused"}
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-surface hover:bg-brand-brown-deep/30 border border-brand-brown-deep text-brand-white rounded text-[10px] font-heading font-bold uppercase tracking-wider cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-brand-status-rejected/10 border border-brand-status-rejected/30 rounded-md p-4 flex items-center gap-3 text-brand-status-rejected">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="font-sans text-sm font-medium">{error}</p>
        </div>
      )}

      {loading && !data ? (
        <div className="bg-brand-surface rounded-md border border-brand-brown-deep p-12 text-center shadow-black/40">
          <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-sans text-sm text-brand-white/60">Loading vote standings...</p>
        </div>
      ) : data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-brand-surface p-4 rounded-md border border-brand-brown-deep shadow shadow-black/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-brand-bg border border-brand-brown-deep/50">
                  <Vote className="w-5 h-5 text-brand-gold" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-white/40 block">
                    Total Votes
                  </span>
                  <span className="font-mono text-xl font-semibold text-brand-white">
                    {data.totalVotes.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-brand-surface p-4 rounded-md border border-brand-brown-deep shadow shadow-black/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-brand-bg border border-brand-brown-deep/50">
                  <Users className="w-5 h-5 text-brand-gold" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-white/40 block">
                    Unique Voters
                  </span>
                  <span className="font-mono text-xl font-semibold text-brand-white">
                    {data.uniqueVoters.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-brand-surface p-4 rounded-md border border-brand-brown-deep shadow shadow-black/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-brand-bg border border-brand-brown-deep/50">
                  <Trophy className="w-5 h-5 text-brand-gold" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-white/40 block">
                    Categories
                  </span>
                  <span className="font-mono text-xl font-semibold text-brand-white">
                    {data.standings.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Velocity Flags Section */}
          {data.velocityFlags.length > 0 && (
            <div className="bg-brand-status-pending/5 border border-brand-status-pending/20 rounded-md overflow-hidden">
              <div className="p-4 border-b border-brand-status-pending/15 flex items-center gap-3 bg-brand-status-pending/5">
                <ShieldAlert className="w-5 h-5 text-brand-status-pending" />
                <div>
                  <h3 className="font-heading text-sm font-bold text-brand-white uppercase tracking-wider">
                    Integrity Flags ({data.velocityFlags.length})
                  </h3>
                  <p className="font-sans text-[10px] text-brand-white/40 mt-0.5">
                    Unusual vote patterns detected — review manually, these are not auto-blocked.
                  </p>
                </div>
              </div>
              <div className="divide-y divide-brand-status-pending/10">
                {data.velocityFlags.map((flag, idx) => (
                  <div key={idx} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-status-pending/15 text-brand-status-pending border border-brand-status-pending/20 mr-2">
                          {flag.type === "high_volume_voter" ? "High Volume" : "IP Burst"}
                        </span>
                        <span className="font-sans text-xs text-brand-white/80">{flag.pattern}</span>
                        <span className="block font-sans text-[10px] text-brand-white/40 mt-1">
                          Categories: {flag.category}
                        </span>
                      </div>
                      <span className="font-mono text-sm font-semibold text-brand-status-pending shrink-0">
                        {flag.count}
                      </span>
                    </div>

                    {/* Raw data toggle — super_admin only (§6.1) */}
                    {flag.rawData && flag.rawData.length > 0 && (
                      <div>
                        <button
                          onClick={() => toggleRawData(idx)}
                          className="flex items-center gap-1.5 text-[10px] text-brand-white/40 hover:text-brand-white/70 transition-colors cursor-pointer"
                        >
                          {showRawData.has(idx) ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                          {showRawData.has(idx) ? "Hide" : "Show"} raw data
                        </button>
                        {showRawData.has(idx) && (
                          <div className="mt-2 overflow-x-auto">
                            <table className="w-full text-[10px] font-mono">
                              <thead>
                                <tr className="text-brand-white/40 text-left">
                                  <th className="pr-4 pb-1">IP</th>
                                  <th className="pr-4 pb-1">Fingerprint</th>
                                  <th className="pb-1">Time</th>
                                </tr>
                              </thead>
                              <tbody className="text-brand-white/60">
                                {flag.rawData.map((row, rIdx) => (
                                  <tr key={rIdx}>
                                    <td className="pr-4 py-0.5">{row.ip || "—"}</td>
                                    <td className="pr-4 py-0.5 truncate max-w-[120px]">
                                      {row.fingerprint.slice(0, 12)}…
                                    </td>
                                    <td className="py-0.5">
                                      {new Date(row.timestamp).toLocaleString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Standings */}
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-bold text-brand-white uppercase tracking-wider">
              Standings by Category
            </h2>
            <div className="flex gap-2">
              <button onClick={expandAll} className="text-[10px] text-brand-white/40 hover:text-brand-gold cursor-pointer transition-colors font-sans">
                Expand All
              </button>
              <span className="text-brand-white/20">|</span>
              <button onClick={collapseAll} className="text-[10px] text-brand-white/40 hover:text-brand-gold cursor-pointer transition-colors font-sans">
                Collapse All
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {data.standings.map((category) => {
              const isExpanded = expandedCategories.has(category.category);
              const leader = category.nominees[0];

              return (
                <div
                  key={category.category}
                  className="bg-brand-surface rounded-md border border-brand-brown-deep/60 shadow shadow-black/30 overflow-hidden"
                >
                  {/* Category Header — always visible */}
                  <button
                    onClick={() => toggleCategory(category.category)}
                    className="w-full flex items-center justify-between p-4 hover:bg-brand-surface/80 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-1 h-8 bg-brand-gold rounded-full shrink-0" />
                      <div className="min-w-0">
                        <h3 className="font-heading text-sm font-bold text-brand-white truncate">
                          {category.category}
                        </h3>
                        <span className="font-sans text-[10px] text-brand-white/40">
                          {category.nominees.length} nominees · {category.totalVotes} votes
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Quick leader preview */}
                      {leader && leader.votes > 0 && !isExpanded && (
                        <span className="hidden sm:block font-sans text-[10px] text-brand-gold truncate max-w-[150px]">
                          👑 {leader.stage_name} ({leader.votes})
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-brand-white/40" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-brand-white/40" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Nominee List */}
                  {isExpanded && (
                    <div className="border-t border-brand-brown-deep/30">
                      {category.nominees.length === 0 ? (
                        <div className="p-4 text-center">
                          <span className="font-sans text-xs text-brand-white/40">No nominees in this category.</span>
                        </div>
                      ) : (
                        <div className="divide-y divide-brand-brown-deep/15">
                          {category.nominees.map((nominee, nIdx) => {
                            const maxVotes = category.nominees[0]?.votes || 1;
                            const barWidth = maxVotes > 0 ? (nominee.votes / maxVotes) * 100 : 0;

                            return (
                              <div key={nominee.id} className="flex items-center gap-3 p-3 sm:p-4">
                                {/* Rank */}
                                <span className={`font-mono text-sm font-bold w-6 text-center shrink-0 ${
                                  nIdx === 0 && nominee.votes > 0 ? "text-brand-gold" : "text-brand-white/30"
                                }`}>
                                  {nIdx + 1}
                                </span>

                                {/* Photo */}
                                <div className="w-10 h-10 rounded overflow-hidden border border-brand-brown-deep/30 shrink-0 bg-brand-bg">
                                  <img
                                    src={nominee.photo_url}
                                    alt={nominee.stage_name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>

                                {/* Name + Bar */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className={`font-sans text-sm truncate ${
                                      nIdx === 0 && nominee.votes > 0 ? "text-brand-gold font-semibold" : "text-brand-white"
                                    }`}>
                                      {nominee.stage_name}
                                    </span>
                                    <span className="font-mono text-xs text-brand-white/60 shrink-0">
                                      {nominee.votes.toLocaleString()}
                                    </span>
                                  </div>
                                  {/* Vote bar */}
                                  <div className="mt-1 h-1.5 bg-brand-bg rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        nIdx === 0 && nominee.votes > 0
                                          ? "bg-brand-gold"
                                          : "bg-brand-white/20"
                                      }`}
                                      style={{ width: `${barWidth}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {data.standings.length === 0 && (
            <div className="bg-brand-surface rounded-md border border-brand-brown-deep p-12 text-center shadow-black/40">
              <p className="font-sans text-sm text-brand-white/60">
                No approved nominees yet. Approve submissions first to see voting standings.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
