"use client";

import { useState, useTransition } from "react";
import { ShieldPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { promoteToAdmin } from "@/lib/admin-member-actions";

export function PromoteAdminButton({ userId }: { userId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      try {
        await promoteToAdmin(userId);
        setConfirming(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-destructive">
          This grants full admin access, including approving loans and
          disbursing funds. Are you sure?
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ShieldPlus className="size-3.5" />
            )}
            Confirm promotion
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirming(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
      <ShieldPlus className="size-3.5" />
      Grant Admin Access
    </Button>
  );
}
