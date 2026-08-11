"use client";

import { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  CartesianGrid 
} from "recharts";
import { 
  CheckCircle, 
  XCircle, 
  Vote, 
  Calendar,
  FileText
} from "lucide-react";
import { motion, Variants } from "framer-motion";

interface Stats {
  totalSubmissions: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalVotes: number;
}

interface CategoryChartItem {
  name: string;
  submissions: number;
}

interface TimeChartItem {
  date: string;
  count: number;
}

interface Settings {
  submission_open_at?: string | null;
  submission_close_at?: string | null;
  voting_open_at?: string | null;
  voting_close_at?: string | null;
}

interface DashboardClientProps {
  initialStats: Stats;
  initialCategoryData: CategoryChartItem[];
  initialTimeData: TimeChartItem[];
  initialVoteTimeData?: TimeChartItem[];
  initialSettings: Settings | null;
}

export function DashboardClient({
  initialStats,
  initialCategoryData,
  initialTimeData,
  initialVoteTimeData = [],
  initialSettings,
}: DashboardClientProps) {
  const [phaseText, setPhaseText] = useState("Status");
  const [countdownText, setCountdownText] = useState("00d : 00h : 00m");

  // Countdown timer logic based on settings phase dates
  useEffect(() => {
    if (!initialSettings) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const subOpen = initialSettings.submission_open_at ? new Date(initialSettings.submission_open_at).getTime() : 0;
      const subClose = initialSettings.submission_close_at ? new Date(initialSettings.submission_close_at).getTime() : 0;
      const voteOpen = initialSettings.voting_open_at ? new Date(initialSettings.voting_open_at).getTime() : 0;
      const voteClose = initialSettings.voting_close_at ? new Date(initialSettings.voting_close_at).getTime() : 0;

      let targetTime = 0;
      let label = "Status";

      if (subOpen && now < subOpen) {
        label = "Submissions Open In";
        targetTime = subOpen;
      } else if (subClose && now < subClose) {
        label = "Submissions Close In";
        targetTime = subClose;
      } else if (voteOpen && now < voteOpen) {
        label = "Voting Opens In";
        targetTime = voteOpen;
      } else if (voteClose && now < voteClose) {
        label = "Voting Closes In";
        targetTime = voteClose;
      } else {
        setPhaseText("Campaign State");
        setCountdownText("Active Campaign");
        clearInterval(timer);
        return;
      }

      setPhaseText(label);

      const diff = targetTime - now;
      if (diff <= 0) {
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdownText(
        `${String(days).padStart(2, "0")}d : ${String(hours).padStart(2, "0")}h : ${String(minutes).padStart(2, "0")}m : ${String(seconds).padStart(2, "0")}s`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [initialSettings]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: "easeOut" },
    },
  };

  return (
    <div className="flex flex-col gap-6 text-left max-w-6xl mx-auto px-4 pb-16">
      {/* Title */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-gold uppercase tracking-wide">
          Dashboard
        </h1>
        <p className="font-sans text-xs text-brand-white/60 mt-1">
          Realtime overview of BMAA 2026 submissions, votes, and active campaign state.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Total Submissions */}
        <motion.div variants={cardVariants} className="bg-brand-surface p-4 rounded-md border border-brand-brown-deep shadow-md shadow-black/30 border-t-2 border-t-brand-gold flex flex-col gap-2 hover:border-brand-gold/60 transition-colors">
          <div className="flex justify-between items-center text-brand-white/40">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Submissions</span>
            <FileText className="w-4 h-4 text-brand-gold/70" />
          </div>
          <span className="font-mono text-2xl sm:text-3xl text-brand-gold font-bold">
            {initialStats.totalSubmissions || 0}
          </span>
          <span className="text-[10px] text-brand-white/40 block mt-1">
            Total entries received
          </span>
        </motion.div>

        {/* Total Votes */}
        <motion.div variants={cardVariants} className="bg-brand-surface p-4 rounded-md border border-brand-brown-deep shadow-md shadow-black/30 border-t-2 border-t-brand-status-live flex flex-col gap-2 hover:border-brand-status-live/60 transition-colors">
          <div className="flex justify-between items-center text-brand-white/40">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Total Votes</span>
            <Vote className="w-4 h-4 text-brand-status-live/70" />
          </div>
          <span className="font-mono text-2xl sm:text-3xl text-brand-status-live font-bold">
            {initialStats.totalVotes || 0}
          </span>
          <span className="text-[10px] text-brand-white/40 block mt-1">
            Cast by unique fingerprints
          </span>
        </motion.div>

        {/* Review Status Queue */}
        <motion.div variants={cardVariants} className="bg-brand-surface p-4 rounded-md border border-brand-brown-deep shadow-md shadow-black/30 flex flex-col gap-2 hover:border-brand-gold/40 transition-colors">
          <div className="flex justify-between items-center text-brand-white/40">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Review Status</span>
            <div className="flex gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-brand-status-approved" />
              <XCircle className="w-3.5 h-3.5 text-brand-status-rejected" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-base text-brand-status-pending font-bold">
              {initialStats.pendingCount || 0} pnd
            </span>
            <span className="text-brand-white/30 text-xs">/</span>
            <span className="font-mono text-base text-brand-status-approved font-bold">
              {initialStats.approvedCount || 0} app
            </span>
          </div>
          <div className="w-full bg-brand-bg rounded-full h-1.5 mt-2 overflow-hidden flex">
            {initialStats.totalSubmissions > 0 ? (
              <>
                <div 
                  style={{ width: `${(initialStats.pendingCount / initialStats.totalSubmissions) * 100}%` }}
                  className="bg-brand-status-pending h-full"
                />
                <div 
                  style={{ width: `${(initialStats.approvedCount / initialStats.totalSubmissions) * 100}%` }}
                  className="bg-brand-status-approved h-full"
                />
                <div 
                  style={{ width: `${(initialStats.rejectedCount / initialStats.totalSubmissions) * 100}%` }}
                  className="bg-brand-status-rejected h-full"
                />
              </>
            ) : (
              <div className="w-full bg-brand-brown-deep/20 h-full" />
            )}
          </div>
        </motion.div>

        {/* Dynamic Phase Countdown */}
        <motion.div variants={cardVariants} className="bg-brand-surface p-4 rounded-md border border-brand-brown-deep shadow-md shadow-black/30 border-t-2 border-t-brand-gold flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-brand-white/40 mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">{phaseText}</span>
              <Calendar className="w-4 h-4 text-brand-gold/70" />
            </div>
            <span className="font-mono text-sm sm:text-base text-brand-gold font-bold block mt-1">
              {countdownText}
            </span>
          </div>
          <span className="text-[10px] text-brand-white/40 block mt-2">
            Dynamic phase timer
          </span>
        </motion.div>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
        {/* Submissions Rate Line Chart */}
        <div className="bg-brand-surface p-6 rounded-md border border-brand-brown-deep shadow-lg shadow-black/40 flex flex-col gap-4">
          <div>
            <h3 className="font-heading text-base font-bold text-brand-white uppercase">Submissions Over Time</h3>
            <p className="font-sans text-[11px] text-brand-white/40">Daily volume of candidate submissions</p>
          </div>
          <div className="h-72 w-full">
            {initialTimeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={initialTimeData}
                  margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#25160d" />
                  <XAxis dataKey="date" stroke="#f5f1eb" fontSize={10} />
                  <YAxis stroke="#f5f1eb" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a120c",
                      borderColor: "#6c3c0a",
                      borderRadius: "6px",
                      color: "#f5f1eb",
                      fontFamily: "var(--font-inter)",
                      fontSize: "12px",
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    name="Submissions"
                    stroke="#d2942e" 
                    strokeWidth={2.5} 
                    dot={{ fill: "#6c3c0a", stroke: "#d2942e", strokeWidth: 1.5 }}
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-brand-white/30 font-sans">
                No daily submission history to display yet.
              </div>
            )}
          </div>
        </div>

        {/* Categories Bar Chart */}
        <div className="bg-brand-surface p-6 rounded-md border border-brand-brown-deep shadow-lg shadow-black/40 flex flex-col gap-4 lg:col-span-2">
          <div>
            <h3 className="font-heading text-base font-bold text-brand-white uppercase">Submissions by Category</h3>
            <p className="font-sans text-[11px] text-brand-white/40">Which categories have the most traction</p>
          </div>
          <div className="h-72 w-full">
            {initialCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={initialCategoryData.slice(0, 7)}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#25160d" />
                  <XAxis type="number" stroke="#f5f1eb" fontSize={10} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="#f5f1eb" 
                    fontSize={10} 
                    width={100}
                    tickFormatter={(val) => val.length > 15 ? `${val.substring(0, 15)}...` : val}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a120c",
                      borderColor: "#6c3c0a",
                      borderRadius: "6px",
                      color: "#f5f1eb",
                      fontFamily: "var(--font-inter)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="submissions" name="Submissions" fill="#d2942e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-brand-white/30 font-sans">
                No category submissions to display yet.
              </div>
            )}
          </div>
        </div>

        {/* Voting Rate Line Chart */}
        <div className="bg-brand-surface p-6 rounded-md border border-brand-brown-deep shadow-lg shadow-black/40 flex flex-col gap-4">
          <div>
            <h3 className="font-heading text-base font-bold text-brand-white uppercase">Voting Over Time</h3>
            <p className="font-sans text-[11px] text-brand-white/40">Daily volume of cast votes</p>
          </div>
          <div className="h-72 w-full">
            {initialVoteTimeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={initialVoteTimeData}
                  margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#25160d" />
                  <XAxis dataKey="date" stroke="#f5f1eb" fontSize={10} />
                  <YAxis stroke="#f5f1eb" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a120c",
                      borderColor: "#6c3c0a",
                      borderRadius: "6px",
                      color: "#f5f1eb",
                      fontFamily: "var(--font-inter)",
                      fontSize: "12px",
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    name="Votes"
                    stroke="#22c55e" 
                    strokeWidth={2.5} 
                    dot={{ fill: "#6c3c0a", stroke: "#22c55e", strokeWidth: 1.5 }}
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-brand-white/30 font-sans">
                No daily voting history to display yet.
              </div>
            )}
          </div>
        </div>

        
      </div>
    </div>
  );
}
