import { NextResponse, NextRequest } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/roles";
import { entrySchema } from "@/lib/validation/entry";
import { getCategorySlug } from "@/lib/constants/categories";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { Database } from "@/types/supabase";

/**
 * GET /api/admin/submissions
 * List submissions with filters, sorting, and pagination.
 * Both super_admin and site_manager can access.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const sortBy = searchParams.get("sortBy") || "submitted_at";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? true : false;
    const isExport = searchParams.get("export") === "true";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = isExport ? 10000 : parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search");

    const supabase = createAdminClient();
    let query = supabase
      .from("submissions")
      .select("*", { count: "exact" });

    // Apply filters
    if (category) {
      const catSlug = getCategorySlug(category);
      query = query.eq("category", catSlug);
    }
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query = query.eq("status", status as "pending" | "approved" | "rejected");
    }
    if (search) {
      query = query.or(
        `stage_name.ilike.%${search}%,reference_id.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    // Apply sort
    const validSortFields = ["submitted_at", "stage_name", "category", "status"];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : "submitted_at";
    query = query.order(safeSortBy, { ascending: sortOrder });

    // Apply pagination (or export range)
    const from = isExport ? 0 : (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Submissions fetch error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch submissions." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      adminRole: admin.role,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message.includes("Unauthorized") ? 401 : message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

/**
 * PATCH /api/admin/submissions
 * Update submission status (approve/reject/pending).
 * site_manager can only review 'pending' submissions once.
 * ONLY super_admin has privilege to undo or change a non-pending status.
 */
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    const body = await request.json();
    const { id, status, rejectionReason } = body;

    if (!id || !status || !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid request: id and valid status (pending|approved|rejected) required." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Fetch current submission to check its existing status
    const { data: existingSub, error: fetchErr } = await supabase
      .from("submissions")
      .select("id, status")
      .eq("id", id)
      .single();

    if (fetchErr || !existingSub) {
      return NextResponse.json(
        { success: false, error: "Submission not found." },
        { status: 404 }
      );
    }

    // 2. Strict Privilege Rule:
    // Only super_admin can undo or change status if existingSub.status !== 'pending'
    if (existingSub.status !== "pending" && admin.role !== "super_admin") {
      return NextResponse.json(
        { 
          success: false, 
          error: "Permission Denied: Only Super Administrators have privilege to undo or modify previously reviewed submission status." 
        },
        { status: 403 }
      );
    }

    // 3. Perform update
    const updateData: Database["public"]["Tables"]["submissions"]["Update"] = {
      status: status as "pending" | "approved" | "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
    };

    if (status === "rejected") {
      updateData.rejection_reason = rejectionReason || null;
    } else {
      updateData.rejection_reason = null;
    }

    const { error: updateError } = await supabase
      .from("submissions")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      console.error("Submission update error:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update submission." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message.includes("Unauthorized") ? 401 : message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

/**
 * POST /api/admin/submissions
 * Manually create a submission on behalf of an artist.
 * Both super_admin and site_manager can access.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Enforce Server-Side Auth Guard
    const admin = await requireAdmin();

    // 2. Parse form data
    const formData = await request.formData();
    
    const stageName = formData.get("stageName") as string;
    const realName = formData.get("realName") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const location = formData.get("location") as string;
    const category = formData.get("category") as string;
    const songTitle = formData.get("songTitle") as string;
    const mediaLink = formData.get("mediaLink") as string;
    const releaseDate = formData.get("releaseDate") as string;
    const status = (formData.get("status") as string) || "approved"; // default to approved for admin manual entry

    // Optional social links
    const instagram = (formData.get("instagram") as string) || undefined;
    const facebook = (formData.get("facebook") as string) || undefined;
    const tiktok = (formData.get("tiktok") as string) || undefined;
    const youtube = (formData.get("youtube") as string) || undefined;

    // Files
    const coverArt = formData.get("coverArt") as File | null;
    const photo = formData.get("photo") as File | null;

    // 3. Validation - Server-side file check
    if (!coverArt || !photo) {
      return NextResponse.json(
        { success: false, error: "Both Cover Art and Front-View Photo are required." },
        { status: 400 }
      );
    }

    const maxFileSize = 5.1 * 1024 * 1024; // 5.1MB
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

    if (coverArt.size > maxFileSize || !allowedTypes.includes(coverArt.type)) {
      return NextResponse.json(
        { success: false, error: "Cover Art must be a JPG or PNG under 5MB." },
        { status: 400 }
      );
    }

    if (photo.size > maxFileSize || !allowedTypes.includes(photo.type)) {
      return NextResponse.json(
        { success: false, error: "Front-View Photo must be a JPG or PNG under 5MB." },
        { status: 400 }
      );
    }

    // 4. Validate fields via Zod
    const zodResult = entrySchema.safeParse({
      stageName,
      realName,
      phone,
      email,
      location,
      category,
      songTitle,
      mediaLink,
      releaseDate,
      coverArtUrl: "https://temporary-validation-url.com/image.jpg",
      photoUrl: "https://temporary-validation-url.com/image.jpg",
      instagram,
      facebook,
      tiktok,
      youtube,
    });

    if (!zodResult.success) {
      return NextResponse.json(
        { success: false, error: zodResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const validatedData = zodResult.data;
    const categorySlug = getCategorySlug(validatedData.category);

    const supabase = createAdminClient();

    // 5. Duplicate Check
    const { data: emailDupe, error: emailDupeErr } = await supabase
      .from("submissions")
      .select("id")
      .eq("email", validatedData.email)
      .eq("category", categorySlug)
      .limit(1);

    if (emailDupeErr) {
      console.error("Email duplicate check error:", emailDupeErr);
      return NextResponse.json(
        { success: false, error: "Unable to verify duplicate email status." },
        { status: 500 }
      );
    }

    if (emailDupe && emailDupe.length > 0) {
      return NextResponse.json(
        { success: false, error: "A submission with this email already exists in this category." },
        { status: 409 }
      );
    }

    const { data: phoneDupe, error: phoneDupeErr } = await supabase
      .from("submissions")
      .select("id")
      .eq("phone", validatedData.phone)
      .eq("category", categorySlug)
      .limit(1);

    if (phoneDupeErr) {
      console.error("Phone duplicate check error:", phoneDupeErr);
      return NextResponse.json(
        { success: false, error: "Unable to verify duplicate phone status." },
        { status: 500 }
      );
    }

    if (phoneDupe && phoneDupe.length > 0) {
      return NextResponse.json(
        { success: false, error: "A submission with this phone number already exists in this category." },
        { status: 409 }
      );
    }

    // 6. Upload files to Cloudinary
    let coverArtUrl: string;
    let photoUrl: string;

    try {
      coverArtUrl = await uploadToCloudinary(coverArt, "cover_arts");
      photoUrl = await uploadToCloudinary(photo, "nominee_photos");
    } catch (uploadErr) {
      console.error("Cloudinary upload failed:", uploadErr);
      return NextResponse.json(
        { success: false, error: "Image hosting upload failed. Please try again." },
        { status: 500 }
      );
    }

    // 7. Generate reference ID
    const randomSegment = crypto.randomBytes(3).toString("hex").toUpperCase();
    const referenceId = `BMAA-2026-${randomSegment}`;

    // 8. Insert record
    const { error: insertError } = await supabase.from("submissions").insert({
      reference_id: referenceId,
      stage_name: validatedData.stageName,
      real_name: validatedData.realName,
      phone: validatedData.phone,
      email: validatedData.email,
      location: validatedData.location,
      category: categorySlug,
      song_title: validatedData.songTitle,
      media_link: validatedData.mediaLink,
      release_date: validatedData.releaseDate,
      cover_art_url: coverArtUrl,
      photo_url: photoUrl,
      instagram: validatedData.instagram || null,
      facebook: validatedData.facebook || null,
      tiktok: validatedData.tiktok || null,
      youtube: validatedData.youtube || null,
      status: (status === "pending" ? "pending" : "approved") as "pending" | "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
    });

    if (insertError) {
      console.error("Insert submission error:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to save submission." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      referenceId,
    });
  } catch (err) {
    console.error("Unexpected manual submission error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}
