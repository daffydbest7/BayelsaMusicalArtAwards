/**
 * Cloudinary image upload helper.
 * Uploads a file (provided as a Buffer or Blob/File) to Cloudinary.
 * Relies on the configured cloud name and unsigned upload preset.
 */
export async function uploadToCloudinary(file: File | Blob, folderName: string = "submissions"): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "bmaa_unsigned";

  if (!cloudName) {
    throw new Error("Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in environment configuration.");
  }

  // Build multipart form data
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folderName);

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errResponse = await response.text();
      console.error("Cloudinary Upload API Error:", errResponse);
      throw new Error(`Cloudinary upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.secure_url) {
      throw new Error("Invalid Cloudinary upload response: secure_url missing.");
    }

    return data.secure_url;
  } catch (err) {
    console.error("Cloudinary upload exception:", err);
    throw err;
  }
}
