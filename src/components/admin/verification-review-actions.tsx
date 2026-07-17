"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { approveVerification, rejectVerification } from "@/lib/admin-actions";

function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export function VerificationReviewActions({ userId }: { userId: string }) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      try {
        await approveVerification(userId);
      } catch (err) {
        if (isRedirectError(err)) throw err; // let Next handle the redirect — don't swallow it
        setError("Something went wrong. Please try again.");
      }
    });
  }

  function handleReject() {
    if (!reason.trim()) {
      setError("Please provide a reason for rejection.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await rejectVerification(userId, reason);
      } catch (err) {
        if (isRedirectError(err)) throw err;
        setError("Something went wrong. Please try again.");
      }
    });
  }

  if (showRejectForm) {
    return (
      <div className="flex flex-col gap-3">
        <label htmlFor="reason" className="text-sm font-medium">
          Reason for rejection
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Document is blurry, please re-upload a clearer copy."
          className="rounded-md border border-input bg-input px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <XCircle className="size-4" />
            )}
            Confirm rejection
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowRejectForm(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={handleApprove} disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}
          Approve
        </Button>
        <Button
          variant="destructive"
          onClick={() => setShowRejectForm(true)}
          disabled={isPending}
        >
          <XCircle className="size-4" />
          Reject
        </Button>
      </div>
    </div>
  );
}
