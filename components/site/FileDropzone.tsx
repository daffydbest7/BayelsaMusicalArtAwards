"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, X, CheckCircle, AlertTriangle } from "lucide-react";
import imageCompression from "browser-image-compression";

interface FileDropzoneProps {
  label: string;
  description: string;
  onChange: (file: File | null) => void;
  error?: string;
}

export function FileDropzone({ label, description, onChange, error }: FileDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "compressing" | "success" | "error">("idle");
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (selectedFile: File) => {
    setStatus("idle");
    setValidationError(null);
    onChange(null);

    // 1. Raw size check (ceil at 25MB to catch obvious wrong files early)
    const rawSizeMB = selectedFile.size / (1024 * 1024);
    if (rawSizeMB > 25) {
      setStatus("error");
      setValidationError(`File is too large (${rawSizeMB.toFixed(1)}MB). Max raw size is 25MB.`);
      return;
    }

    // 2. MIME type check
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(selectedFile.type)) {
      setStatus("error");
      setValidationError("Invalid file type. Only JPG, JPEG, or PNG files are accepted.");
      return;
    }

    // 3. Compression
    setStatus("compressing");
    try {
      const options = {
        maxSizeMB: 4.8, // Ceil slightly under 5MB
        maxWidthOrHeight: 2048,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(selectedFile, options);

      // 4. Post-compression size check (must be under 5MB)
      const compressedSizeMB = compressedFile.size / (1024 * 1024);
      if (compressedSizeMB > 5) {
        setStatus("error");
        setValidationError(`Failed to compress under 5MB. Compressed size: ${compressedSizeMB.toFixed(1)}MB.`);
        return;
      }

      // Successful compression and validation
      setFile(compressedFile);
      setStatus("success");
      onChange(compressedFile);
    } catch (err) {
      console.error("Compression error:", err);
      setStatus("error");
      setValidationError("Error compressing image. Please try another image.");
    }
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setFile(null);
    setStatus("idle");
    setValidationError(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const activeError = error || validationError;

  return (
    <div className="flex flex-col gap-2 w-full text-left">
      <span className="font-sans text-sm font-medium text-brand-white">{label}</span>

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={status === "idle" || status === "error" ? onButtonClick : undefined}
        className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md bg-brand-surface text-center cursor-pointer transition-all duration-200 min-h-36 ${
          dragActive ? "border-brand-gold bg-brand-gold/5" : "border-brand-brown-deep/60 hover:border-brand-gold/80"
        } ${activeError ? "border-brand-status-rejected/60" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png"
          onChange={handleChange}
        />

        {status === "idle" && (
          <div className="flex flex-col items-center gap-2 pointer-events-none">
            <Upload className="w-8 h-8 text-brand-white/40" />
            <p className="font-sans text-xs text-brand-white/80">
              Drag & drop or <span className="text-brand-gold font-semibold">browse</span>
            </p>
            <p className="font-sans text-[10px] text-brand-white/40">{description}</p>
          </div>
        )}

        {status === "compressing" && (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
            <p className="font-sans text-xs text-brand-gold font-medium">Validating & compressing...</p>
          </div>
        )}

        {status === "success" && file && (
          <div className="flex flex-col items-center gap-2 w-full px-4">
            <CheckCircle className="w-8 h-8 text-brand-status-approved" />
            <p className="font-sans text-xs text-brand-white font-medium truncate max-w-xs">
              {file.name}
            </p>
            <p className="font-sans text-[10px] text-brand-status-approved font-semibold">
              Ready ({(file.size / (1024 * 1024)).toFixed(2)} MB)
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-brand-bg hover:bg-brand-brown-deep/40 text-brand-white/70 hover:text-brand-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-2 w-full px-4">
            <AlertTriangle className="w-8 h-8 text-brand-status-rejected" />
            <p className="font-sans text-xs text-brand-status-rejected font-semibold">
              Validation Failed
            </p>
            <p className="font-sans text-[10px] text-brand-white/60">
              {validationError}
            </p>
            <p className="font-sans text-[10px] text-brand-gold font-semibold underline mt-1">
              Try again
            </p>
          </div>
        )}
      </div>

      {activeError && status !== "error" && (
        <span className="font-sans text-[11px] text-brand-status-rejected font-medium pl-1">
          {activeError}
        </span>
      )}
    </div>
  );
}
