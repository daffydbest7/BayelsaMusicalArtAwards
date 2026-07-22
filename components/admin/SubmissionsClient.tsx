"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Check, 
  X, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  MapPin, 
  ExternalLink,
  ChevronDown,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Lock,
  RefreshCw,
  Plus
} from "lucide-react";
import { CATEGORIES, getCategoryNameFromSlug } from "@/lib/constants/categories";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate, formatDateLong } from "@/lib/utils";
import { ManualSubmissionModal } from "./ManualSubmissionModal";
import {
  exportSubmissionsToCSV,
  exportSubmissionsToExcel,
  exportSubmissionsToPDF,
} from "@/lib/export-submissions";

export interface Submission {
  id: string;
  reference_id: string;
  stage_name: string;
  real_name: string;
  phone: string;
  email: string;
  location: string;
  category: string;
  song_title: string;
  media_link: string;
  release_date: string;
  cover_art_url: string;
  photo_url: string;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  youtube: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  submitted_at: string;
}

interface SubmissionsClientProps {
  initialSubmissions: Submission[];
  initialTotal: number;
  initialTotalPages: number;
  adminRole?: "super_admin" | "site_manager";
}

export function SubmissionsClient({
  initialSubmissions,
  initialTotal,
  initialTotalPages,
  adminRole = "site_manager",
}: SubmissionsClientProps) {
  // Query parameters state
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("pending");
  const [sortBy, setSortBy] = useState("submitted_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  
  // Data state
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal / Detail state
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Action Confirmation state
  const [confirmModal, setConfirmModal] = useState<{
    actionStatus: "approved" | "rejected" | "pending";
    subId: string;
    stageName: string;
  } | null>(null);

  // Manual Submission state
  const [isManualOpen, setIsManualOpen] = useState(false);

  // Export state
  const [exportingFormat, setExportingFormat] = useState<"csv" | "excel" | "pdf" | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExport = async (format: "csv" | "excel" | "pdf") => {
    setExportingFormat(format);
    setShowExportMenu(false);
    try {
      const params = new URLSearchParams({
        export: "true",
        sortBy,
        sortOrder,
      });
      if (search) params.append("search", search);
      if (category) params.append("category", category);
      if (status) params.append("status", status);

      const res = await fetch(`/api/admin/submissions?${params.toString()}`);
      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Export data fetch failed.");

      const exportData = result.data || [];
      const filterCtx = {
        statusFilter: status || "all",
        categoryFilter: category || undefined,
        searchTerm: search || undefined,
      };

      if (format === "csv") {
        exportSubmissionsToCSV(exportData, filterCtx);
      } else if (format === "excel") {
        exportSubmissionsToExcel(exportData, filterCtx);
      } else if (format === "pdf") {
        exportSubmissionsToPDF(exportData, filterCtx);
      }
    } catch (err: any) {
      alert(err.message || "Failed to generate export file.");
    } finally {
      setExportingFormat(null);
    }
  };

  // Dynamic filter refetching
  const fetchSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        sortBy,
        sortOrder,
      });
      if (search) params.append("search", search);
      if (category) params.append("category", category);
      if (status) params.append("status", status);

      const res = await fetch(`/api/admin/submissions?${params.toString()}`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to load submissions.");
      }

      setSubmissions(result.data);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Only trigger fetch when filter states change after initial mount
  const [isInitialMount, setIsInitialMount] = useState(true);
  useEffect(() => {
    if (isInitialMount) {
      setIsInitialMount(false);
      return;
    }
    fetchSubmissions();
  }, [page, status, category, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSubmissions();
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    setPage(1);
  };

  const handleAction = async (subId: string, actionStatus: "approved" | "rejected" | "pending") => {
    setActionLoading(true);
    try {
      const body: Record<string, any> = { id: subId, status: actionStatus };
      if (actionStatus === "rejected") {
        body.rejectionReason = rejectionReason;
      }

      const res = await fetch("/api/admin/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Action failed.");
      }

      setSelectedSub(null);
      setShowRejectForm(false);
      setRejectionReason("");
      setConfirmModal(null);
      fetchSubmissions();
    } catch (err: any) {
      alert(err.message || "Action failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (subStatus: string) => {
    switch (subStatus) {
      case "approved":
        return (
          <span className="px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full bg-brand-status-approved/15 text-brand-status-approved border border-brand-status-approved/30">
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full bg-brand-status-rejected/15 text-brand-status-rejected border border-brand-status-rejected/30">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full bg-brand-status-pending/15 text-brand-status-pending border border-brand-status-pending/30">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left max-w-6xl mx-auto px-4 pb-16">
      {/* Title + Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-gold uppercase tracking-wide">
            Submissions Queue
          </h1>
          <p className="font-sans text-xs text-brand-white/60 mt-1">
            Review, approve, or reject candidate artist submissions for BMAA 2026.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Manual Entry Button */}
          <button
            onClick={() => setIsManualOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-gold hover:bg-brand-gold/90 text-brand-bg font-heading text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Submission</span>
          </button>

          {/* Export Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exportingFormat !== null}
              className="flex items-center gap-2 px-4 py-2 bg-brand-surface hover:bg-brand-brown-deep/40 border border-brand-brown-deep text-brand-white font-heading text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition-colors disabled:opacity-50"
            >
              {exportingFormat ? (
                <Loader2 className="w-4 h-4 animate-spin text-brand-gold" />
              ) : (
                <Download className="w-4 h-4 text-brand-gold" />
              )}
              <span>{exportingFormat ? `Exporting ${exportingFormat.toUpperCase()}...` : "Export Data"}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>

            {/* Export Options Dropdown Menu */}
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
        </div>
      </div>

      {/* Tabs / Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-brand-brown-deep/30 pb-4">
        {/* Status Filters */}
        <div className="flex gap-2 bg-brand-surface p-1 rounded border border-brand-brown-deep/45 w-full md:w-auto">
          {["pending", "approved", "rejected", ""].map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded text-xs font-heading font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                status === s
                  ? "bg-brand-gold text-brand-bg shadow"
                  : "text-brand-white/60 hover:text-brand-white hover:bg-brand-bg/50"
              }`}
            >
              {s === "" ? "All" : s}
            </button>
          ))}
        </div>

        {/* Category & Search Filter */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Category Dropdown Filter */}
          <div className="relative">
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full sm:w-48 bg-brand-surface border border-brand-brown-deep text-brand-white px-3 py-2 rounded focus:outline-none focus:border-brand-gold text-xs font-sans appearance-none pr-8 cursor-pointer"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-brand-white/40 pointer-events-none" />
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-brand-white/30" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Stage Name / Email / ID..."
                className="w-full sm:w-64 bg-brand-surface border border-brand-brown-deep text-brand-white pl-9 pr-3 py-2 rounded focus:outline-none focus:border-brand-gold text-xs font-sans placeholder:text-brand-white/20"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-gold hover:bg-brand-gold/90 text-brand-bg font-heading text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-brand-surface rounded-md border border-brand-brown-deep p-12 text-center shadow-black/40">
          <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-sans text-sm text-brand-white/60">Loading submissions queue...</p>
        </div>
      ) : error ? (
        <div className="bg-brand-status-rejected/10 border border-brand-status-rejected/30 rounded-md p-6 text-center text-brand-status-rejected flex items-center justify-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="font-sans text-sm font-medium">{error}</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-brand-surface rounded-md border border-brand-brown-deep p-12 text-center shadow-black/40">
          <p className="font-sans text-sm text-brand-white/60">No submissions found matching criteria.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-md border border-brand-brown-deep/60 bg-brand-surface/40 shadow-black/60 shadow-lg">
            <table className="w-full border-collapse text-left font-sans text-sm">
              <thead>
                <tr className="border-b border-brand-brown-deep bg-brand-surface text-brand-white/60 uppercase tracking-wider text-[11px] font-bold">
                  <th className="p-4">Reference ID</th>
                  <th className="p-4">Stage Name</th>
                  <th className="p-4">Song/Album Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Submitted At</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-brown-deep/20">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-brand-surface/20 transition-colors">
                    <td className="p-4 font-mono text-xs text-brand-gold font-bold">
                      {sub.reference_id}
                    </td>
                    <td className="p-4 font-medium text-brand-white">{sub.stage_name}</td>
                    <td className="p-4 text-brand-white/80">{sub.song_title}</td>
                    <td className="p-4 text-brand-white/70 max-w-[200px] truncate">
                      {getCategoryNameFromSlug(sub.category) || sub.category}
                    </td>
                    <td className="p-4 text-brand-white/60 text-xs">
                      {formatDate(sub.submitted_at)}
                    </td>
                    <td className="p-4">{getStatusBadge(sub.status)}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedSub(sub)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-surface hover:bg-brand-brown-deep/30 border border-brand-brown-deep text-brand-white rounded text-xs font-semibold cursor-pointer transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="bg-brand-surface p-4 rounded-md border border-brand-brown-deep shadow shadow-black/40 flex flex-col gap-3"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="font-mono text-xs text-brand-gold font-bold">{sub.reference_id}</span>
                    <h3 className="font-heading text-base font-bold text-brand-white mt-0.5">{sub.stage_name}</h3>
                  </div>
                  {getStatusBadge(sub.status)}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-brand-white/70 border-t border-b border-brand-brown-deep/20 py-2">
                  <div>
                    <span className="text-[10px] text-brand-white/40 block uppercase tracking-wider">Song Title</span>
                    <span className="font-medium text-brand-white/90">{sub.song_title}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-brand-white/40 block uppercase tracking-wider">Category</span>
                    <span className="font-medium text-brand-white/90 truncate block">
                      {getCategoryNameFromSlug(sub.category) || sub.category}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] text-brand-white/40">
                    {formatDate(sub.submitted_at)}
                  </span>
                  <button
                    onClick={() => setSelectedSub(sub)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-bg border border-brand-brown-deep text-brand-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-brand-brown-deep/20 pt-4">
              <span className="font-sans text-xs text-brand-white/50">
                Showing page {page} of {totalPages} ({total} items)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="p-1.5 rounded border border-brand-brown-deep hover:bg-brand-surface/40 text-brand-white/80 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-1.5 rounded border border-brand-brown-deep hover:bg-brand-surface/40 text-brand-white/80 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submission Detail Modal/Drawer */}
      <AnimatePresence>
        {selectedSub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-brand-surface border border-brand-brown-deep w-full max-w-3xl rounded-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-brand-brown-deep/50 bg-brand-bg">
                <div>
                  <span className="font-mono text-xs text-brand-gold font-bold">{selectedSub.reference_id}</span>
                  <h2 className="font-heading text-lg font-bold text-brand-white">Review Submission</h2>
                </div>
                <button
                  onClick={() => {
                    setSelectedSub(null);
                    setShowRejectForm(false);
                    setRejectionReason("");
                  }}
                  className="p-1 rounded-full hover:bg-brand-brown-deep/20 text-brand-white/60 hover:text-brand-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Images Display */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Front-View Photo */}
                  <div className="flex flex-col gap-2">
                    <span className="font-sans text-[10px] text-brand-white/40 uppercase tracking-wider font-semibold">Artist Front-View Photo</span>
                    <div className="relative aspect-[3/4] w-full rounded border border-brand-brown-deep/50 overflow-hidden bg-brand-bg">
                      <img
                        src={selectedSub.photo_url}
                        alt={`${selectedSub.stage_name} front-view`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </div>

                  {/* Cover Art */}
                  <div className="flex flex-col gap-2">
                    <span className="font-sans text-[10px] text-brand-white/40 uppercase tracking-wider font-semibold">Release Cover Art</span>
                    <div className="relative aspect-[1/1] w-full rounded border border-brand-brown-deep/50 overflow-hidden bg-brand-bg">
                      <img
                        src={selectedSub.cover_art_url}
                        alt={`${selectedSub.song_title} cover art`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Candidate Info Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[10px] text-brand-white/40 block uppercase tracking-wider">Stage Name</span>
                    <span className="text-brand-white font-semibold">{selectedSub.stage_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-brand-white/40 block uppercase tracking-wider">Real Name</span>
                    <span className="text-brand-white font-semibold">{selectedSub.real_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-brand-white/40 block uppercase tracking-wider">Email Address</span>
                    <a href={`mailto:${selectedSub.email}`} className="text-brand-gold hover:underline font-medium break-all">
                      {selectedSub.email}
                    </a>
                  </div>
                  <div>
                    <span className="text-[10px] text-brand-white/40 block uppercase tracking-wider">Phone / WhatsApp</span>
                    <a href={`tel:${selectedSub.phone}`} className="text-brand-gold hover:underline font-medium">
                      {selectedSub.phone}
                    </a>
                  </div>
                  <div>
                    <span className="text-[10px] text-brand-white/40 block uppercase tracking-wider">Location</span>
                    <span className="text-brand-white flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-brand-gold/60" />
                      {selectedSub.location}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-brand-white/40 block uppercase tracking-wider">Category</span>
                    <span className="text-brand-gold font-bold">{getCategoryNameFromSlug(selectedSub.category) || selectedSub.category}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-brand-white/40 block uppercase tracking-wider">Release Date</span>
                    <span className="text-brand-white flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-brand-gold/60" />
                      {formatDateLong(selectedSub.release_date)}
                    </span>
                  </div>
                </div>

                {/* Media Link */}
                <div className="border-t border-brand-brown-deep/20 pt-4">
                  <span className="text-[10px] text-brand-white/40 block uppercase tracking-wider">Submission Material Link</span>
                  <div className="flex justify-between items-center mt-1 p-3 rounded bg-brand-bg border border-brand-brown-deep/45">
                    <span className="font-semibold text-brand-white truncate max-w-[80%]">{selectedSub.song_title}</span>
                    <a
                      href={selectedSub.media_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-brand-gold hover:underline font-bold uppercase tracking-wider"
                    >
                      Listen
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Social Handles */}
                <div className="border-t border-brand-brown-deep/20 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {selectedSub.instagram && (
                    <div>
                      <span className="text-[9px] text-brand-white/40 block uppercase">Instagram</span>
                      <span className="text-brand-white font-medium">@{selectedSub.instagram}</span>
                    </div>
                  )}
                  {selectedSub.tiktok && (
                    <div>
                      <span className="text-[9px] text-brand-white/40 block uppercase">TikTok</span>
                      <span className="text-brand-white font-medium">@{selectedSub.tiktok}</span>
                    </div>
                  )}
                  {selectedSub.facebook && (
                    <div>
                      <span className="text-[9px] text-brand-white/40 block uppercase">Facebook</span>
                      <span className="text-brand-white font-medium truncate block">{selectedSub.facebook}</span>
                    </div>
                  )}
                  {selectedSub.youtube && (
                    <div>
                      <span className="text-[9px] text-brand-white/40 block uppercase">YouTube</span>
                      <span className="text-brand-white font-medium truncate block">{selectedSub.youtube}</span>
                    </div>
                  )}
                </div>

                {/* Rejection Form Input */}
                {showRejectForm && (
                  <div className="p-4 rounded border border-brand-status-rejected/30 bg-brand-status-rejected/5 space-y-3 animate-fadeIn">
                    <label className="font-sans text-xs font-bold text-brand-status-rejected block uppercase tracking-wider">
                      Specify Rejection Reason
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain details why submission is rejected..."
                      className="w-full bg-brand-bg border border-brand-brown-deep text-brand-white px-3 py-2 rounded focus:outline-none focus:border-brand-gold text-xs sm:text-sm font-sans min-h-[80px]"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Modal Footer (Action Buttons) */}
              <div className="p-4 border-t border-brand-brown-deep/50 bg-brand-bg flex items-center justify-between">
                <div>
                  <span className="text-xs text-brand-white/40">Current Status:</span>
                  <div className="mt-1">{getStatusBadge(selectedSub.status)}</div>
                </div>

                <div className="flex gap-2">
                  {selectedSub.status === "pending" ? (
                    <>
                      {showRejectForm ? (
                        <>
                          <button
                            disabled={actionLoading}
                            onClick={() => setShowRejectForm(false)}
                            className="px-4 py-2 border border-brand-brown-deep hover:bg-brand-surface/40 text-brand-white text-xs font-heading font-bold uppercase tracking-wider rounded cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            disabled={actionLoading || !rejectionReason.trim()}
                            onClick={() =>
                              setConfirmModal({
                                actionStatus: "rejected",
                                subId: selectedSub.id,
                                stageName: selectedSub.stage_name,
                              })
                            }
                            className="px-4 py-2 bg-brand-status-rejected hover:bg-brand-status-rejected/90 text-brand-white text-xs font-heading font-bold uppercase tracking-wider rounded cursor-pointer disabled:opacity-40"
                          >
                            Confirm Reject
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            disabled={actionLoading}
                            onClick={() => setShowRejectForm(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-transparent border border-brand-status-rejected text-brand-status-rejected hover:bg-brand-status-rejected/10 text-xs font-heading font-bold uppercase tracking-wider rounded cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </button>
                          <button
                            disabled={actionLoading}
                            onClick={() =>
                              setConfirmModal({
                                actionStatus: "approved",
                                subId: selectedSub.id,
                                stageName: selectedSub.stage_name,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-status-approved hover:bg-brand-status-approved/95 text-brand-white text-xs font-heading font-bold uppercase tracking-wider rounded cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            Approve
                          </button>
                        </>
                      )}
                    </>
                  ) : adminRole === "super_admin" ? (
                    /* ONLY Super Admin can undo/modify non-pending submissions */
                    <div className="flex items-center gap-2">
                      <button
                        disabled={actionLoading}
                        onClick={() =>
                          setConfirmModal({
                            actionStatus: "pending",
                            subId: selectedSub.id,
                            stageName: selectedSub.stage_name,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-2 border border-brand-brown-deep hover:bg-brand-surface/40 text-brand-gold text-xs font-heading font-bold uppercase tracking-wider rounded cursor-pointer"
                        title="Revert submission back to pending queue"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Revert to Pending
                      </button>

                      {selectedSub.status === "approved" ? (
                        <>
                          {showRejectForm ? (
                            <>
                              <button
                                disabled={actionLoading}
                                onClick={() => setShowRejectForm(false)}
                                className="px-3 py-2 border border-brand-brown-deep hover:bg-brand-surface/40 text-brand-white text-xs font-heading font-bold uppercase tracking-wider rounded cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                disabled={actionLoading || !rejectionReason.trim()}
                                onClick={() =>
                                  setConfirmModal({
                                    actionStatus: "rejected",
                                    subId: selectedSub.id,
                                    stageName: selectedSub.stage_name,
                                  })
                                }
                                className="px-3 py-2 bg-brand-status-rejected hover:bg-brand-status-rejected/90 text-brand-white text-xs font-heading font-bold uppercase tracking-wider rounded cursor-pointer disabled:opacity-40"
                              >
                                Confirm Reject
                              </button>
                            </>
                          ) : (
                            <button
                              disabled={actionLoading}
                              onClick={() => setShowRejectForm(true)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 border border-brand-status-rejected text-brand-status-rejected hover:bg-brand-status-rejected/10 text-xs font-heading font-bold uppercase tracking-wider rounded cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              Change to Reject
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          disabled={actionLoading}
                          onClick={() =>
                            setConfirmModal({
                              actionStatus: "approved",
                              subId: selectedSub.id,
                              stageName: selectedSub.stage_name,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-status-approved hover:bg-brand-status-approved/95 text-brand-white text-xs font-heading font-bold uppercase tracking-wider rounded cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Change to Approve
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Site Managers see a locked status notice */
                    <div className="flex items-center gap-1.5 text-xs text-brand-white/40 font-sans italic">
                      <Lock className="w-3.5 h-3.5" />
                      Status finalized. Only Super Admin can undo.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Action Confirmation Popup Modal */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-brand-surface border border-brand-brown-deep w-full max-w-md rounded-md shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-brand-brown-deep/50 bg-brand-bg">
                <h3 className="font-heading text-sm font-bold text-brand-white uppercase tracking-wider">
                  {confirmModal.actionStatus === "approved"
                    ? "Confirm Approval"
                    : confirmModal.actionStatus === "rejected"
                    ? "Confirm Rejection"
                    : "Confirm Status Reset"}
                </h3>
                <button
                  onClick={() => setConfirmModal(null)}
                  disabled={actionLoading}
                  className="p-1 rounded-full hover:bg-brand-brown-deep/20 text-brand-white/60 hover:text-brand-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {confirmModal.actionStatus === "approved" ? (
                  <div className="flex items-start gap-3 p-3.5 rounded bg-brand-status-approved/10 border border-brand-status-approved/30 text-brand-status-approved">
                    <Check className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="text-xs font-sans space-y-1">
                      <p className="font-bold text-brand-white text-sm">
                        Approve entry for {confirmModal.stageName}?
                      </p>
                      <p className="text-brand-white/70">
                        This submission will be marked as approved and the nominee will be listed on the live public voting page.
                      </p>
                    </div>
                  </div>
                ) : confirmModal.actionStatus === "rejected" ? (
                  <div className="flex items-start gap-3 p-3.5 rounded bg-brand-status-rejected/10 border border-brand-status-rejected/30 text-brand-status-rejected">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="text-xs font-sans space-y-1">
                      <p className="font-bold text-brand-white text-sm">
                        Reject entry for {confirmModal.stageName}?
                      </p>
                      {rejectionReason && (
                        <p className="text-brand-white/80 font-medium">
                          Reason: <span className="text-brand-status-rejected">{rejectionReason}</span>
                        </p>
                      )}
                      <p className="text-brand-white/50 text-[11px] pt-1">
                        This submission will be marked as rejected and excluded from public voting.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-3.5 rounded bg-brand-gold/10 border border-brand-gold/30 text-brand-gold">
                    <RefreshCw className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="text-xs font-sans space-y-1">
                      <p className="font-bold text-brand-white text-sm">
                        Revert entry for {confirmModal.stageName} back to Pending?
                      </p>
                      <p className="text-brand-white/70">
                        This will undo its current status and return this submission to the pending review queue.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-brand-brown-deep/50 bg-brand-bg flex justify-end gap-3">
                <button
                  disabled={actionLoading}
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 border border-brand-brown-deep hover:bg-brand-surface/40 text-brand-white text-xs font-heading font-bold uppercase tracking-wider rounded cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => handleAction(confirmModal.subId, confirmModal.actionStatus)}
                  className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-heading font-bold uppercase tracking-wider rounded cursor-pointer transition-colors disabled:opacity-40 ${
                    confirmModal.actionStatus === "approved"
                      ? "bg-brand-status-approved hover:bg-brand-status-approved/90 text-brand-white shadow-md shadow-brand-status-approved/20"
                      : confirmModal.actionStatus === "rejected"
                      ? "bg-brand-status-rejected hover:bg-brand-status-rejected/90 text-brand-white shadow-md shadow-brand-status-rejected/20"
                      : "bg-brand-gold hover:bg-brand-gold/90 text-brand-bg shadow-md shadow-brand-gold/20"
                  }`}
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {confirmModal.actionStatus === "approved"
                    ? "Yes, Approve Entry"
                    : confirmModal.actionStatus === "rejected"
                    ? "Yes, Reject Entry"
                    : "Yes, Revert to Pending"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Submission Creator Modal */}
      <ManualSubmissionModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        onSuccess={fetchSubmissions}
      />
    </div>
  );
}
