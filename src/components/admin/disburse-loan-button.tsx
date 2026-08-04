"use client";

import { useState, useTransition } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { disburseLoan } from "@/lib/admin-loan-actions";

export function DisburseLoanButton({
  loanId,
  disabled,
}: {
  loanId: string;
  disabled: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await disburseLoan(loanId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={handleClick} disabled={disabled || isPending}>
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
        Disburse Funds
      </Button>
    </div>
  );
}