import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { entrySchema } from "@/lib/validation/entry";
import { getCategorySlug } from "@/lib/constants/categories";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { sendEmail } from "@/lib/email";
import { getCachedSettings } from "@/lib/settings";

export async function POST(request: Request) {
  try {
    // 1. Check if the submission window is open
    const settings = await getCachedSettings();
    const now = new Date();
    const openTime = new Date(settings.submission_open_at);
    const closeTime = new Date(settings.submission_close_at);

    if (now < openTime || now > closeTime) {
      return NextResponse.json(
        { success: false, error: "Submissions are currently closed." },
        { status: 400 }
      );
    }

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

    const maxFileSize = 5.1 * 1024 * 1024; // 5.1MB allowance
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

    if (coverArt.size > maxFileSize || !allowedTypes.includes(coverArt.type)) {
      return NextResponse.json(
        { success: false, error: "Cover Art must be a JPG or PNG under 5MB." },
        { status: 400 }
      );
    }

    if (photo.size > maxFileSize || !allowedTypes.includes(photo.type)) {
      return NextResponse.json(
        { success: false, error: "Bold Front-View Photo must be a JPG or PNG under 5MB." },
        { status: 400 }
      );
    }

    // 4. Validate other fields via Zod
    // We pass temporary URLs for Zod validation since URLs are expected
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

    // 5. Database duplicate check — two safe parameterized queries
    //    (avoids unsafe string interpolation in .or() filters)
    const supabase = createAdminClient();

    const { data: emailDupe, error: emailDupeErr } = await supabase
      .from("submissions")
      .select("id")
      .eq("email", validatedData.email)
      .eq("category", categorySlug)
      .limit(1);

    if (emailDupeErr) {
      console.error("Email duplicate check error:", emailDupeErr);
      return NextResponse.json(
        { success: false, error: "Unable to verify submission details at this time. Please try again." },
        { status: 500 }
      );
    }

    if (emailDupe && emailDupe.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "An entry for this category already exists using this email or phone number. If you've lost your reference ID, contact bayelsamusiccontent@gmail.com or WhatsApp +234 904 359 9284 with the email/phone you used to submit, and we'll confirm your status.",
        },
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
        { success: false, error: "Unable to verify submission details at this time. Please try again." },
        { status: 500 }
      );
    }

    if (phoneDupe && phoneDupe.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "An entry for this category already exists using this email or phone number. If you've lost your reference ID, contact bayelsamusiccontent@gmail.com or WhatsApp +234 904 359 9284 with the email/phone you used to submit, and we'll confirm your status.",
        },
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

    // 8. Insert record (category stored as kebab-case slug per REQUIREMENTS.md §4.4)
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
      status: "pending",
    });

    if (insertError) {
      console.error("Insert submission error:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to save submission." },
        { status: 500 }
      );
    }

    // 9. Dispatch emails (non-blocking in background)
    sendEmail({
      to: validatedData.email,
      subject: `BMAA 2026 Entry Submitted — ${referenceId}`,
      html: `
        <h1>Submission Received!</h1>
        <p>Hi ${validatedData.stageName},</p>
        <p>Your entry for the <strong>${validatedData.category}</strong> category at BMAA 2026 has been successfully received.</p>
        <p>Your unique Reference ID is: <strong>${referenceId}</strong></p>
        <p>Please keep this ID safe. You will need it to track your status.</p>
      `,
    }).catch(err => console.error("Failed to send artist confirmation email:", err));

    sendEmail({
      to: "bayelsamusiccontent@gmail.com",
      subject: `New BMAA Submission: ${validatedData.stageName} - ${validatedData.category}`,
      html: `
        <h2>New Entry Submitted</h2>
        <p><strong>Stage Name:</strong> ${validatedData.stageName}</p>
        <p><strong>Category:</strong> ${validatedData.category}</p>
        <p><strong>Reference ID:</strong> ${referenceId}</p>
      `,
    }).catch(err => console.error("Failed to send admin notification email:", err));

    // 10. Return success details
    return NextResponse.json({
      success: true,
      referenceId,
    });
  } catch (err) {
    console.error("Unexpected submission error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}
