"use client";

import { useActionState } from "react";
import { AlertTriangle } from "lucide-react";
import { updateBankDetails, type ActionState } from "@/lib/profile-actions";
import { NIGERIAN_BANKS } from "@/lib/nomba/banks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export function BankDetailsForm({
  defaults,
}: {
  defaults: {
    bankCode?: string | null;
    bankAccountNumber?: string | null;
    bankAccountName?: string | null;
  };
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateBankDetails,
    undefined,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bank details</CardTitle>
        <CardDescription>
          Required before a loan can be disbursed to you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-start gap-2 rounded-md bg-warning/10 p-3 text-xs text-warning">
          <AlertTriangle className="size-4 shrink-0" />
          <span>
            We can't verify account ownership in the current testing environment
            — please double-check these details are correct before submitting.
          </span>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bankCode" className="text-sm font-medium">
              Bank
            </label>
            <select
              id="bankCode"
              name="bankCode"
              required
              defaultValue={defaults.bankCode ?? ""}
              className="h-10 rounded-md border border-input bg-input px-3 text-sm"
            >
              <option value="" disabled>
                Select your bank
              </option>
              {NIGERIAN_BANKS.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="bankAccountNumber" className="text-sm font-medium">
              Account Number
            </label>
            <input
              id="bankAccountNumber"
              name="bankAccountNumber"
              type="text"
              inputMode="numeric"
              pattern="\d{10}"
              maxLength={10}
              required
              defaultValue={defaults.bankAccountNumber ?? ""}
              className="h-10 rounded-md border border-input bg-input px-3 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="bankAccountName" className="text-sm font-medium">
              Account Holder Name
            </label>
            <input
              id="bankAccountName"
              name="bankAccountName"
              type="text"
              required
              defaultValue={defaults.bankAccountName ?? ""}
              placeholder="As it appears on your bank account"
              className="h-10 rounded-md border border-input bg-input px-3 text-sm"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save bank details"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}