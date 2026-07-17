"use client";

import { useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { submitAdmissionLetter } from "@/lib/onboarding-actions";
import { Button } from "@/components/ui/button";

const MAX_SIZE_MB = 5;
const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export function AdmissionLetterUpload({ userId }: { userId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    setError(null);
    if (!selected) return;

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError("Please upload a PDF, JPG, or PNG file.");
      return;
    }
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_SIZE_MB}MB.`);
      return;
    }
    setFile(selected);
  }

  async function handleUpload() {
    if (!file) return;
    setIsUploading(true);
    setError(null);

    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${userId}/admission-letter.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("admission-letters")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError("Upload failed. Please try again.");
      setIsUploading(false);
      return;
    }

    await submitAdmissionLetter(path);
    setIsUploading(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <label
        htmlFor="admission-letter"
        className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/50 px-4 py-8 text-center hover:bg-muted"
      >
        {file ? (
          <>
            <FileText className="size-6 text-primary" />
            <span className="text-sm font-medium">{file.name}</span>
          </>
        ) : (
          <>
            <Upload className="size-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Tap to select your admission letter (PDF, JPG, or PNG, max{" "}
              {MAX_SIZE_MB}MB)
            </span>
          </>
        )}
        <input
          id="admission-letter"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={handleFileChange}
        />
      </label>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button onClick={handleUpload} disabled={!file || isUploading}>
        {isUploading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Uploading...
          </>
        ) : (
          "Submit for verification"
        )}
      </Button>
    </div>
  );
}
