"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileDropzone } from "./FileDropzone";
import { CategorySelect } from "./CategorySelect";
import { CATEGORIES } from "@/lib/constants/categories";
import { AlertCircle, CheckCircle2, Copy, AlertTriangle, X, Camera } from "lucide-react";
import { motion } from "framer-motion";

// Client-side schema (excludes coverArtUrl/photoUrl since those are server-side URLs)
const entryFormSchema = z.object({
  stageName: z.string().min(1, "Stage Name is required").trim(),
  realName: z.string().min(1, "Real Name is required").trim(),
  phone: z
    .string()
    .min(1, "Phone/WhatsApp is required")
    .transform((val) => val.replace(/[\s\-\(\)]/g, "").trim())
    .refine((val) => /^0\d{10}$/.test(val), {
      message: "Phone number must be an 11-digit Nigerian phone number starting with 0 (e.g. 08012345678)",
    }),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  location: z.string().min(1, "Location (City, LGA) is required").trim(),
  category: z.string().min(1, "Please select a category"),
  songTitle: z.string().min(1, "Song Title is required").trim(),
  mediaLink: z.string().url("Must be a valid link (e.g., YouTube, Audiomack, SoundCloud)"),
  releaseDate: z.string().min(1, "Release date is required"),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  tiktok: z.string().optional(),
  youtube: z.string().optional(),
});

type EntryFormValues = z.infer<typeof entryFormSchema>;

interface EntryFormProps {
  submissionOpenAt: string;
  submissionCloseAt: string;
}

export function EntryForm({ submissionOpenAt, submissionCloseAt }: EntryFormProps) {
  // File state (managed outside react-hook-form since they're File objects, not serializable text)
  const [coverArt, setCoverArt] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ referenceId: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    control,
    trigger,
    reset,
    formState: { errors },
  } = useForm<EntryFormValues>({
    resolver: zodResolver(entryFormSchema),
    defaultValues: {
      stageName: "",
      realName: "",
      phone: "",
      email: "",
      location: "",
      category: "",
      songTitle: "",
      mediaLink: "",
      releaseDate: "",
      instagram: "",
      facebook: "",
      tiktok: "",
      youtube: "",
    },
  });

  const watchedEmail = watch("email");
  const watchedReleaseDate = watch("releaseDate");

  // Soft date validation helper
  const getReleaseDateWarning = () => {
    if (!watchedReleaseDate) return null;
    const date = new Date(watchedReleaseDate);
    const minDate = new Date("2021-12-27");
    const maxDate = new Date("2026-04-27");
    if (date < minDate || date > maxDate) {
      return "Note: Release date falls outside the preferred eligibility window (Dec 27, 2021 - Apr 27, 2026). Submitting is allowed, but materials outside this window may receive lower priority review.";
    }
    return null;
  };

  const handleCopy = () => {
    if (successData?.referenceId) {
      navigator.clipboard.writeText(successData.referenceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const onSubmit = async (data: EntryFormValues) => {
    setServerError(null);

    // Validate file uploads (managed outside RHF)
    if (!coverArt) {
      setServerError("Please upload Cover Art.");
      return;
    }
    if (!photo) {
      setServerError("Please upload your Front-View Photo.");
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append("stageName", data.stageName);
    formData.append("realName", data.realName);
    formData.append("phone", data.phone);
    formData.append("email", data.email);
    formData.append("location", data.location);
    formData.append("category", data.category);
    formData.append("songTitle", data.songTitle);
    formData.append("mediaLink", data.mediaLink);
    formData.append("releaseDate", data.releaseDate);
    formData.append("coverArt", coverArt);
    formData.append("photo", photo);
    if (data.instagram) formData.append("instagram", data.instagram);
    if (data.facebook) formData.append("facebook", data.facebook);
    if (data.tiktok) formData.append("tiktok", data.tiktok);
    if (data.youtube) formData.append("youtube", data.youtube);

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong. Please check fields.");
      }

      setSuccessData({ referenceId: result.referenceId });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit entry. Please try again.";
      setServerError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const isWindowClosed = () => {
    const now = new Date();
    const closeTime = new Date(submissionCloseAt);
    const openTime = new Date(submissionOpenAt);
    return now < openTime || now > closeTime;
  };

  // ── Closed state ──────────────────────────────────────────────
  if (isWindowClosed()) {
    return (
      <section id="entry-form" className="py-16 px-4 max-w-xl mx-auto text-center">
        <div className="p-6 rounded-md bg-brand-surface border border-brand-brown-deep shadow-black/40">
          <AlertCircle className="w-12 h-12 text-brand-gold mx-auto mb-4 animate-pulse" />
          <h2 className="font-heading text-2xl font-bold text-brand-gold uppercase">Submissions Closed</h2>
          <p className="font-sans text-brand-white/70 text-sm mt-3 leading-relaxed">
            The entry submission window has closed. Late entries are not accepted.
          </p>
        </div>
      </section>
    );
  }

  const handleResetForm = () => {
    setSuccessData(null);
    reset();
    setCoverArt(null);
    setPhoto(null);
  };

  // ── Success state ─────────────────────────────────────────────
  if (successData) {
    return (
      <section className="py-16 px-4 max-w-xl mx-auto text-center">
        <div className="relative p-8 rounded-md bg-brand-surface border border-brand-brown-deep shadow-black/40 flex flex-col items-center gap-6">
          {/* X Close / Cancel Button */}
          <button
            type="button"
            onClick={handleResetForm}
            aria-label="Close success message and return to form"
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-brand-white/40 hover:text-brand-gold hover:bg-brand-brown-deep/40 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <CheckCircle2 className="w-16 h-16 text-brand-status-approved" />
          <h2 className="font-heading text-2xl font-bold text-brand-gold uppercase">Submission Success!</h2>
          <p className="font-sans text-brand-white/80 text-sm leading-relaxed">
            Your entry has been received. Save your unique reference ID to check review status later.
          </p>

          <div className="flex items-center gap-3 w-full bg-brand-bg border border-brand-brown-deep p-4 rounded-md justify-between">
            <span className="font-mono text-brand-gold text-xl font-bold tracking-wider">
              {successData.referenceId}
            </span>
            <button
              onClick={handleCopy}
              className="p-2 rounded bg-brand-surface hover:bg-brand-brown-deep/30 text-brand-white/80 transition-colors cursor-pointer"
            >
              {copied ? (
                <span className="font-sans text-xs text-brand-status-approved font-semibold">Copied!</span>
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>

          <p className="font-sans text-[11px] text-brand-white/40">
            A confirmation email was sent to {watchedEmail}. If you have questions, reach support at bayelsamusiccontent@gmail.com.
          </p>

          <button
            type="button"
            onClick={handleResetForm}
            className="mt-2 px-6 py-2.5 bg-brand-surface hover:bg-brand-brown-deep/40 border border-brand-brown-deep text-brand-gold font-heading text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition-colors"
          >
            Submit Another Entry
          </button>
        </div>
      </section>
    );
  }

  const dateWarning = getReleaseDateWarning();

  // Helper for rendering field errors
  const fieldError = (fieldName: keyof EntryFormValues) => {
    const error = errors[fieldName];
    return error ? (
      <span className="font-sans text-[11px] text-brand-status-rejected font-medium pl-0.5">{error.message}</span>
    ) : null;
  };

  // ── Form ──────────────────────────────────────────────────────
  return (
    <motion.section 
      id="entry-form" 
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6 }}
      className="py-16 px-4 max-w-2xl mx-auto border-t border-brand-brown-deep/20"
    >
      <div className="text-center mb-10">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-brand-gold uppercase tracking-wide">
          Submit Your Entry
        </h2>
        <p className="font-sans text-sm text-brand-white/60 mt-2">
          No sign-up required. Complete the details below.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 bg-brand-surface p-6 sm:p-8 rounded-md border border-brand-brown-deep shadow-black/40">
        {serverError && (
          <div className="p-4 rounded-md bg-brand-status-rejected/10 border border-brand-status-rejected text-brand-status-rejected flex gap-3 text-left">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-sans text-sm">{serverError}</span>
          </div>
        )}

        {/* Artiste Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 text-left">
            <label className="font-sans text-xs font-semibold text-brand-white/80">Stage Name *</label>
            <input
              {...register("stageName")}
              type="text"
              className="bg-brand-bg border border-brand-brown-deep text-brand-white px-3 py-2 rounded focus:outline-none focus:border-brand-gold text-sm font-sans"
              placeholder="e.g. Burna Boy"
            />
            {fieldError("stageName")}
          </div>

          <div className="flex flex-col gap-1 text-left">
            <label className="font-sans text-xs font-semibold text-brand-white/80">Real Name *</label>
            <input
              {...register("realName")}
              type="text"
              className="bg-brand-bg border border-brand-brown-deep text-brand-white px-3 py-2 rounded focus:outline-none focus:border-brand-gold text-sm font-sans"
              placeholder="e.g. Damini Ogulu"
            />
            {fieldError("realName")}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 text-left">
            <label className="font-sans text-xs font-semibold text-brand-white/80">Phone/WhatsApp *</label>
            <input
              {...register("phone")}
              type="tel"
              className="bg-brand-bg border border-brand-brown-deep text-brand-white px-3 py-2 rounded focus:outline-none focus:border-brand-gold text-sm font-sans"
              placeholder="e.g. 08012345678"
            />
            {fieldError("phone")}
          </div>

          <div className="flex flex-col gap-1 text-left">
            <label className="font-sans text-xs font-semibold text-brand-white/80">Email Address *</label>
            <input
              {...register("email")}
              type="email"
              className="bg-brand-bg border border-brand-brown-deep text-brand-white px-3 py-2 rounded focus:outline-none focus:border-brand-gold text-sm font-sans"
              placeholder="e.g. name@example.com"
            />
            {fieldError("email")}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 text-left">
            <label className="font-sans text-xs font-semibold text-brand-white/80">Artiste Location (City, LGA) *</label>
            <input
              {...register("location")}
              type="text"
              className="bg-brand-bg border border-brand-brown-deep text-brand-white px-3 py-2 rounded focus:outline-none focus:border-brand-gold text-sm font-sans"
              placeholder="e.g. Yenagoa, Southern Ijaw"
            />
            {fieldError("location")}
          </div>

          <div className="flex flex-col gap-1 text-left justify-end">
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <CategorySelect
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val);
                    trigger("category");
                  }}
                  error={!!errors.category}
                />
              )}
            />
            {fieldError("category")}
          </div>
        </div>

        {/* Submission Material */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 text-left">
            <label className="font-sans text-xs font-semibold text-brand-white/80">Song/Album Title *</label>
            <input
              {...register("songTitle")}
              type="text"
              className="bg-brand-bg border border-brand-brown-deep text-brand-white px-3 py-2 rounded focus:outline-none focus:border-brand-gold text-sm font-sans"
              placeholder="e.g. Last Last"
            />
            {fieldError("songTitle")}
          </div>

          <div className="flex flex-col gap-1 text-left">
            <label className="font-sans text-xs font-semibold text-brand-white/80">Audio/Video Streaming Link *</label>
            <input
              {...register("mediaLink")}
              type="url"
              className="bg-brand-bg border border-brand-brown-deep text-brand-white px-3 py-2 rounded focus:outline-none focus:border-brand-gold text-sm font-sans"
              placeholder="e.g. YouTube, Audiomack, SoundCloud Link"
            />
            {fieldError("mediaLink")}
          </div>
        </div>

        <div className="flex flex-col gap-1 text-left w-full sm:w-1/2">
          <label className="font-sans text-xs font-semibold text-brand-white/80">Material Release Date *</label>
          <input
            {...register("releaseDate")}
            type="date"
            className="bg-brand-bg border border-brand-brown-deep text-brand-white px-3 py-2 rounded focus:outline-none focus:border-brand-gold text-sm font-sans w-full"
          />
          {fieldError("releaseDate")}
          {dateWarning && (
            <div className="flex gap-2 text-brand-status-pending items-start mt-1.5 pl-0.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span className="font-sans text-[10px] leading-relaxed font-semibold">{dateWarning}</span>
            </div>
          )}
        </div>

        {/* File Upload Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <FileDropzone
            label="Cover Art *"
            description="JPG or PNG, max 5MB (Square 1:1 format)"
            onChange={(file) => setCoverArt(file)}
          />
          <div className="flex flex-col gap-2">
            <FileDropzone
              label="Bold Front-View Photo *"
              description="JPG or PNG, max 5MB (Portrait 3:4 format)"
              onChange={(file) => setPhoto(file)}
            />
            <div className="flex items-start gap-2 p-2.5 rounded bg-brand-gold/10 border border-brand-gold/25 text-brand-gold text-left">
              <Camera className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="font-sans text-[11px] leading-relaxed text-brand-white/80">
                <strong className="text-brand-gold">Voting Profile Photo:</strong> This photo will be visible to voters on the live voting portal. Ensure it is clear, high-quality, and easily recognizable by your fans.
              </p>
            </div>
          </div>
        </div>

        {/* Social Media Handles */}
        <div className="flex flex-col gap-3 mt-2 text-left">
          <span className="font-sans text-xs font-semibold text-brand-white/50 uppercase tracking-wider">Social Handles (Optional)</span>
          <div className="grid grid-cols-2 gap-3">
            <input
              {...register("instagram")}
              type="text"
              className="bg-brand-bg border border-brand-brown-deep text-brand-white px-3 py-2 rounded focus:outline-none focus:border-brand-gold text-sm font-sans"
              placeholder="Instagram @handle"
            />
            <input
              {...register("tiktok")}
              type="text"
              className="bg-brand-bg border border-brand-brown-deep text-brand-white px-3 py-2 rounded focus:outline-none focus:border-brand-gold text-sm font-sans"
              placeholder="TikTok @handle"
            />
            <input
              {...register("facebook")}
              type="text"
              className="bg-brand-bg border border-brand-brown-deep text-brand-white px-3 py-2 rounded focus:outline-none focus:border-brand-gold text-sm font-sans"
              placeholder="Facebook page url"
            />
            <input
              {...register("youtube")}
              type="text"
              className="bg-brand-bg border border-brand-brown-deep text-brand-white px-3 py-2 rounded focus:outline-none focus:border-brand-gold text-sm font-sans"
              placeholder="YouTube channel link"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="mt-4 px-8 py-3.5 bg-brand-gold disabled:bg-brand-surface disabled:text-brand-white/40 disabled:border-brand-brown-deep disabled:border text-brand-bg font-heading text-sm font-bold tracking-wider uppercase rounded-md glow-gold-hover hover:glow-gold transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-brand-bg border-t-transparent rounded-full animate-spin"></div>
              Submitting Entry...
            </>
          ) : (
            "Submit Entry"
          )}
        </button>
      </form>

      {/* Alternative Submission Block */}
      <div className="mt-8 p-4 rounded bg-brand-surface/40 border border-brand-brown-deep/30 text-center max-w-lg mx-auto">
        <p className="font-sans text-xs text-brand-white/60 leading-relaxed">
          Having trouble submitting the form? Send your materials directly via WhatsApp to{" "}
          <span className="text-brand-gold font-semibold">+234 904 359 9284</span> or email{" "}
          <span className="text-brand-gold font-semibold">bayelsamusiccontent@gmail.com</span>.
        </p>
      </div>
    </motion.section>
  );
}
