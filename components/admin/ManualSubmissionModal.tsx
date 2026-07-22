"use client";

import { useState, FormEvent, useRef } from "react";
import { X, Loader2, AlertCircle, CheckCircle, Upload, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORIES } from "@/lib/constants/categories";

interface ManualSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ManualSubmissionModal({
  isOpen,
  onClose,
  onSuccess,
}: ManualSubmissionModalProps) {
  // Input fields
  const [stageName, setStageName] = useState("");
  const [realName, setRealName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [mediaLink, setMediaLink] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [status, setStatus] = useState("approved"); // approved or pending

  // Social fields
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [youtube, setYoutube] = useState("");

  // Files
  const [coverArt, setCoverArt] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);

  // Status indicators
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdRefId, setCreatedRefId] = useState<string | null>(null);

  // File ref hooks for clearing uploads
  const coverArtRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setStageName("");
    setRealName("");
    setPhone("");
    setEmail("");
    setLocation("");
    setCategory("");
    setSongTitle("");
    setMediaLink("");
    setReleaseDate("");
    setStatus("approved");
    setInstagram("");
    setFacebook("");
    setTiktok("");
    setYoutube("");
    setCoverArt(null);
    setPhoto(null);
    setErrorMsg(null);
    setCreatedRefId(null);
    if (coverArtRef.current) coverArtRef.current.value = "";
    if (photoRef.current) photoRef.current.value = "";
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation checks
    if (!category) {
      setErrorMsg("Please select a category.");
      return;
    }

    // Nigerian Phone Check (exactly 11 digits starting with 0)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "").trim();
    if (!/^0\d{10}$/.test(cleanPhone)) {
      setErrorMsg("Phone number must be an 11-digit Nigerian number starting with 0 (e.g. 08012345678)");
      return;
    }

    if (!coverArt) {
      setErrorMsg("Cover Art file is required.");
      return;
    }

    if (!photo) {
      setErrorMsg("Artist Front-View Photo file is required.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("stageName", stageName.trim());
      payload.append("realName", realName.trim());
      payload.append("phone", cleanPhone);
      payload.append("email", email.trim().toLowerCase());
      payload.append("location", location.trim());
      payload.append("category", category);
      payload.append("songTitle", songTitle.trim());
      payload.append("mediaLink", mediaLink.trim());
      payload.append("releaseDate", releaseDate);
      payload.append("status", status);

      if (instagram.trim()) payload.append("instagram", instagram.trim());
      if (facebook.trim()) payload.append("facebook", facebook.trim());
      if (tiktok.trim()) payload.append("tiktok", tiktok.trim());
      if (youtube.trim()) payload.append("youtube", youtube.trim());

      payload.append("coverArt", coverArt);
      payload.append("photo", photo);

      const res = await fetch("/api/admin/submissions", {
        method: "POST",
        body: payload,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to create manual submission.");
      }

      setCreatedRefId(result.referenceId);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during submission.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-brand-surface border border-brand-brown-deep w-full max-w-2xl rounded-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-brand-brown-deep/50 bg-brand-bg text-left">
              <div>
                <h2 className="font-heading text-base font-bold text-brand-gold uppercase tracking-wider">
                  Manual Submission Creator
                </h2>
                <p className="font-sans text-[11px] text-brand-white/40 mt-0.5">
                  Submit candidate details on behalf of an artist manually.
                </p>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                disabled={submitting}
                className="p-1 rounded-full hover:bg-brand-brown-deep/20 text-brand-white/60 hover:text-brand-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success state */}
            {createdRefId ? (
              <div className="flex-1 overflow-y-auto p-8 text-center flex flex-col items-center justify-center gap-5">
                <CheckCircle className="w-16 h-16 text-brand-status-approved" />
                <div>
                  <h3 className="font-heading text-lg font-bold text-brand-white uppercase">
                    Entry Submitted Successfully!
                  </h3>
                  <p className="font-sans text-xs text-brand-white/60 mt-1 max-w-md mx-auto">
                    The entry has been successfully verified, uploaded, and inserted.
                  </p>
                </div>

                <div className="bg-brand-bg border border-brand-brown-deep p-4 rounded-md w-full max-w-sm flex flex-col gap-1 items-center">
                  <span className="text-[10px] text-brand-white/40 uppercase tracking-widest">Reference ID</span>
                  <span className="font-mono text-brand-gold text-lg font-bold tracking-wider">{createdRefId}</span>
                </div>

                <button
                  onClick={() => {
                    resetForm();
                    onClose();
                  }}
                  className="px-6 py-2 bg-brand-gold hover:bg-brand-gold/90 text-brand-bg font-heading text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition-colors"
                >
                  Close & Refresh List
                </button>
              </div>
            ) : (
              /* Modal Form */
              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto flex flex-col text-left">
                <div className="p-6 space-y-6">
                  {/* Alert Error Box */}
                  {errorMsg && (
                    <div className="p-4 rounded-md bg-brand-status-rejected/10 border border-brand-status-rejected/30 text-brand-status-rejected flex gap-3 items-start text-xs font-sans">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Form section 1: Artist Bio Info */}
                  <div className="space-y-4">
                    <h3 className="font-heading text-xs font-bold text-brand-gold uppercase tracking-wider border-b border-brand-brown-deep/20 pb-1">
                      1. Artiste Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-brand-white/50 uppercase tracking-wider font-semibold block mb-1">
                          Stage Name <span className="text-brand-gold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={stageName}
                          onChange={(e) => setStageName(e.target.value)}
                          placeholder="Artist's stage name"
                          className="w-full bg-brand-bg border border-brand-brown-deep text-brand-white px-3 py-2 rounded focus:outline-none focus:border-brand-gold text-xs font-sans placeholder:text-brand-white/20"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-brand-white/50 uppercase tracking-wider font-semibold block mb-1">
                          Real Name <span className="text-brand-gold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={realName}
                          onChange={(e) => setRealName(e.target.value)}
                          placeholder="Artist's legal name"
                          className="w-full bg-brand-bg border border-brand-brown-deep text-brand-white px-3 py-2 rounded focus:outline-none focus:border-brand-gold text-xs font-sans placeholder:text-brand-white/20"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-brand-white/50 uppercase tracking-wider font-semibold block mb-1">
                          Email Address <span className="text-brand-gold">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="artist@example.com"
                          className="w-full bg-brand-bg border border-brand-brown-deep text-brand-white px-3 py-2 rounded focus:outline-none focus:border-brand-gold text-xs font-sans placeholder:text-brand-white/20"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-brand-white/50 uppercase tracking-wider font-semibold block mb-1">
                          Phone / WhatsApp <span className="text-brand-gold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. 08012345678"
                          className="w-full bg-brand-bg border border-brand-brown-deep text-brand-white px-3 py-2 rounded focus:outline-none focus:border-brand-gold text-xs font-sans placeholder:text-brand-white/20"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-brand-white/50 uppercase tracking-wider font-semibold block mb-1">
                          Location <span className="text-brand-gold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. Yenagoa, Bayelsa"
                          className="w-full bg-brand-bg border border-brand-brown-deep text-brand-white px-3 py-2 rounded focus:outline-none focus:border-brand-gold text-xs font-sans placeholder:text-brand-white/20"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-brand-white/50 uppercase tracking-wider font-semibold block mb-1">
                          Category <span className="text-brand-gold">*</span>
                        </label>
                        <div className="relative">
                          <select
                            required
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-brand-bg border border-brand-brown-deep text-brand-white px-3 py-2 rounded focus:outline-none focus:border-brand-gold text-xs font-sans appearance-none cursor-pointer"
                          >
                            <option value="">Select Category</option>
                            {CATEGORIES.map((cat, idx) => (
                              <option key={idx} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                          <Plus className="absolute right-3 top-2.5 w-3.5 h-3.5 text-brand-white/30 pointer-events-none rotate-45" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form section 2: Release details */}
                  <div className="space-y-4">
                    <h3 className="font-heading text-xs font-bold text-brand-gold uppercase tracking-wider border-b border-brand-brown-deep/20 pb-1">
                      2. Release Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-brand-white/50 uppercase tracking-wider font-semibold block mb-1">
                          Song / Album Title <span className="text-brand-gold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={songTitle}
                          onChange={(e) => setSongTitle(e.target.value)}
                          placeholder="Title of submitted track or album"
                          className="w-full bg-brand-bg border border-brand-brown-deep text-brand-white px-3 py-2 rounded focus:outline-none focus:border-brand-gold text-xs font-sans placeholder:text-brand-white/20"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-brand-white/50 uppercase tracking-wider font-semibold block mb-1">
                          Release Date <span className="text-brand-gold">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={releaseDate}
                          onChange={(e) => setReleaseDate(e.target.value)}
                          className="w-full bg-brand-bg border border-brand-brown-deep text-brand-white px-3 py-2 rounded focus:outline-none focus:border-brand-gold text-xs font-sans"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-brand-white/50 uppercase tracking-wider font-semibold block mb-1">
                        Media / Streaming Link <span className="text-brand-gold">*</span>
                      </label>
                      <input
                        type="url"
                        required
                        value={mediaLink}
                        onChange={(e) => setMediaLink(e.target.value)}
                        placeholder="e.g. https://audiomack.com/... or https://youtube.com/..."
                        className="w-full bg-brand-bg border border-brand-brown-deep text-brand-white px-3 py-2 rounded focus:outline-none focus:border-brand-gold text-xs font-sans placeholder:text-brand-white/20"
                      />
                    </div>
                  </div>

                  {/* Form section 3: Social details */}
                  <div className="space-y-4">
                    <h3 className="font-heading text-xs font-bold text-brand-gold uppercase tracking-wider border-b border-brand-brown-deep/20 pb-1">
                      3. Social Handles (Optional)
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[9px] text-brand-white/40 block mb-0.5">Instagram</label>
                        <input
                          type="text"
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          placeholder="username"
                          className="w-full bg-brand-bg border border-brand-brown-deep/60 text-brand-white px-2 py-1.5 rounded focus:outline-none focus:border-brand-gold text-xs font-sans placeholder:text-brand-white/10"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-brand-white/40 block mb-0.5">TikTok</label>
                        <input
                          type="text"
                          value={tiktok}
                          onChange={(e) => setTiktok(e.target.value)}
                          placeholder="username"
                          className="w-full bg-brand-bg border border-brand-brown-deep/60 text-brand-white px-2 py-1.5 rounded focus:outline-none focus:border-brand-gold text-xs font-sans placeholder:text-brand-white/10"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-brand-white/40 block mb-0.5">Facebook</label>
                        <input
                          type="text"
                          value={facebook}
                          onChange={(e) => setFacebook(e.target.value)}
                          placeholder="profile name/URL"
                          className="w-full bg-brand-bg border border-brand-brown-deep/60 text-brand-white px-2 py-1.5 rounded focus:outline-none focus:border-brand-gold text-xs font-sans placeholder:text-brand-white/10"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-brand-white/40 block mb-0.5">YouTube</label>
                        <input
                          type="text"
                          value={youtube}
                          onChange={(e) => setYoutube(e.target.value)}
                          placeholder="channel link"
                          className="w-full bg-brand-bg border border-brand-brown-deep/60 text-brand-white px-2 py-1.5 rounded focus:outline-none focus:border-brand-gold text-xs font-sans placeholder:text-brand-white/10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form section 4: Media uploads */}
                  <div className="space-y-4">
                    <h3 className="font-heading text-xs font-bold text-brand-gold uppercase tracking-wider border-b border-brand-brown-deep/20 pb-1">
                      4. Media Assets
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Cover Art file upload */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-brand-white/50 uppercase tracking-wider font-semibold block">
                          Release Cover Art (JPG/PNG &lt; 5MB) <span className="text-brand-gold">*</span>
                        </label>
                        <div className="relative border border-dashed border-brand-brown-deep hover:border-brand-gold/50 rounded p-4 text-center cursor-pointer transition-colors bg-brand-bg/40">
                          <input
                            type="file"
                            required
                            accept="image/*"
                            ref={coverArtRef}
                            onChange={(e) => setCoverArt(e.target.files?.[0] || null)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <div className="flex flex-col items-center gap-1.5 text-xs text-brand-white/50">
                            <Upload className="w-5 h-5 text-brand-gold/60" />
                            <span>
                              {coverArt ? (
                                <span className="text-brand-white font-medium text-xs break-all">{coverArt.name}</span>
                              ) : (
                                "Choose cover art file"
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Artist Front Photo upload */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-brand-white/50 uppercase tracking-wider font-semibold block">
                          Artist Front Photo (JPG/PNG &lt; 5MB) <span className="text-brand-gold">*</span>
                        </label>
                        <div className="relative border border-dashed border-brand-brown-deep hover:border-brand-gold/50 rounded p-4 text-center cursor-pointer transition-colors bg-brand-bg/40">
                          <input
                            type="file"
                            required
                            accept="image/*"
                            ref={photoRef}
                            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <div className="flex flex-col items-center gap-1.5 text-xs text-brand-white/50">
                            <Upload className="w-5 h-5 text-brand-gold/60" />
                            <span>
                              {photo ? (
                                <span className="text-brand-white font-medium text-xs break-all">{photo.name}</span>
                              ) : (
                                "Choose artist photo file"
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form section 5: Set initial Status */}
                  <div className="space-y-4 border-t border-brand-brown-deep/20 pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-heading text-xs font-bold text-brand-white uppercase tracking-wider">
                          Final Submission Status
                        </h4>
                        <p className="font-sans text-[11px] text-brand-white/40 mt-0.5">
                          Immediately approve and list nominee, or save as pending for review.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {/* Status toggles */}
                        <button
                          type="button"
                          onClick={() => setStatus("approved")}
                          className={`px-4 py-2 text-xs font-heading font-bold uppercase tracking-wider rounded cursor-pointer transition-colors border ${
                            status === "approved"
                              ? "bg-brand-status-approved/15 text-brand-status-approved border-brand-status-approved"
                              : "border-brand-brown-deep text-brand-white/50 hover:text-brand-white"
                          }`}
                        >
                          Immediate Approval
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatus("pending")}
                          className={`px-4 py-2 text-xs font-heading font-bold uppercase tracking-wider rounded cursor-pointer transition-colors border ${
                            status === "pending"
                              ? "bg-brand-status-pending/15 text-brand-status-pending border-brand-status-pending"
                              : "border-brand-brown-deep text-brand-white/50 hover:text-brand-white"
                          }`}
                        >
                          Save as Pending
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-brand-brown-deep/50 bg-brand-bg flex justify-end gap-3">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      resetForm();
                      onClose();
                    }}
                    className="px-4 py-2 border border-brand-brown-deep hover:bg-brand-surface/40 text-brand-white text-xs font-heading font-bold uppercase tracking-wider rounded cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-brand-gold hover:bg-brand-gold/90 text-brand-bg font-heading text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition-colors"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading files...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Entry</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
