"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { approveLoan, rejectLoan } from "@/lib/admin-loan-actions";

const TERM_OPTIONS = [3, 6, 9, 12];

function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export function LoanReviewActions({
  loanId,
  requestedTermMonths,
}: {
  loanId: string;
  requestedTermMonths: number;
}) {
  const [mode, setMode] = useState<"idle" | "approve" | "reject">("idle");
  const [term, setTerm] = useState(requestedTermMonths);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch (err) {
        if (isRedirectError(err)) throw err;
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  if (mode === "approve") {
    return (
      <div className="flex flex-col gap-3">
        <label htmlFor="term" className="text-sm font-medium">
          Confirm repayment term
        </label>
        <select
          id="term"
          value={term}
          onChange={(e) => setTerm(Number(e.target.value))}
          className="h-10 rounded-md border border-input bg-input px-3 text-sm"
        >
          {TERM_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t} months
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button
            onClick={() => run(() => approveLoan(loanId, term))}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Confirm approval
          </Button>
          <Button
            variant="outline"
            onClick={() => setMode("idle")}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "reject") {
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
          className="rounded-md border border-input bg-input px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={() => run(() => rejectLoan(loanId, reason))}
            disabled={isPending || !reason.trim()}
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
            onClick={() => setMode("idle")}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button onClick={() => setMode("approve")}>
        <CheckCircle2 className="size-4" />
        Approve
      </Button>
      <Button variant="destructive" onClick={() => setMode("reject")}>
        <XCircle className="size-4" />
        Reject
      </Button>
    </div>
  );
}