import { z } from "zod";
import { CATEGORIES } from "../constants/categories";

export const entrySchema = z.object({
  stageName: z.string().min(1, "Stage Name is required").trim(),
  realName: z.string().min(1, "Real Name is required").trim(),
  phone: z
    .string()
    .min(1, "Phone/WhatsApp is required")
    .transform((val) => val.replace(/[\s\-\(\)]/g, "").trim())
    .refine((val) => /^0\d{10}$/.test(val), {
      message: "Phone number must be an 11-digit Nigerian phone number starting with 0 (e.g. 08012345678)",
    }),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .toLowerCase()
    .trim(),
  location: z.string().min(1, "Location (City, LGA) is required").trim(),
  category: z.enum(CATEGORIES, {
    message: "Please select a valid category",
  }),
  songTitle: z.string().min(1, "Song Title is required").trim(),
  mediaLink: z.string().url("Must be a valid link (e.g., YouTube, Audiomack, SoundCloud)"),
  releaseDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Valid release date is required",
  }),
  coverArtUrl: z.string().url("Cover Art image is required"),
  photoUrl: z.string().url("Front-View Photo is required"),
  instagram: z.string().optional().transform(val => val?.trim()),
  facebook: z.string().optional().transform(val => val?.trim()),
  tiktok: z.string().optional().transform(val => val?.trim()),
  youtube: z.string().optional().transform(val => val?.trim()),
});

export type EntryInput = z.input<typeof entrySchema>;
export type EntryOutput = z.output<typeof entrySchema>;
