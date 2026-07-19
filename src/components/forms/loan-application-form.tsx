"use client";

import { useActionState, useState } from "react";
import { applyForLoan, type ActionState } from "@/lib/loan-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const TERM_OPTIONS = [3, 6, 9, 12];
const PURPOSE_OPTIONS = ["Tuition", "Health", "Personal", "Business", "Other"];

export function LoanApplicationForm({
  maxLoanAmount,
}: {
  maxLoanAmount: number;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    applyForLoan,
    undefined,
  );
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");

  const amountNumber = Number(amount);
  const overCap =
    amount !== "" &&
    !Number.isNaN(amountNumber) &&
    amountNumber > maxLoanAmount;

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="amount" className="text-sm font-medium">
              Amount Requested (₦)
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              min="1"
              max={maxLoanAmount}
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-10 rounded-md border border-input bg-input px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {overCap && (
              <p className="text-xs text-destructive">
                Exceeds your limit of ₦{maxLoanAmount.toLocaleString("en-NG")}.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="purpose" className="text-sm font-medium">
              Purpose
            </label>
            <select
              id="purpose"
              name="purpose"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="h-10 rounded-md border border-input bg-input px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="" disabled>
                Select a purpose
              </option>
              {PURPOSE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {purpose === "Other" && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="purposeOther" className="text-sm font-medium">
                Please describe
              </label>
              <input
                id="purposeOther"
                name="purposeOther"
                type="text"
                required
                className="h-10 rounded-md border border-input bg-input px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="termMonths" className="text-sm font-medium">
              Preferred Term
            </label>
            <select
              id="termMonths"
              name="termMonths"
              required
              defaultValue=""
              className="h-10 rounded-md border border-input bg-input px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="" disabled>
                Select a term
              </option>
              {TERM_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t} months
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="acknowledged"
              className="mt-0.5"
              required
            />
            <span>
              I agree to repay this loan according to the selected installment
              schedule.
            </span>
          </label>

          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isPending || overCap}
            className="mt-2"
          >
            {isPending ? "Submitting..." : "Submit application"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
