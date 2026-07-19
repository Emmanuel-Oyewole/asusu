import { getCurrentUserId } from "@/lib/auth";
import { checkLoanEligibility } from "@/utils/eligibility";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { LoanApplicationForm } from "@/components/forms/loan-application-form";
import { AlertTriangle, Landmark } from "lucide-react";
import { formatNaira } from "@/utils/finance";

export default async function LoanApplyPage() {
  const userId = await getCurrentUserId();
  const eligibility = await checkLoanEligibility(userId);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">Apply for a loan</h1>
        <p className="text-sm text-muted-foreground">
          Borrow up to {LOAN_MULTIPLIER_LABEL} your total contributions
        </p>
      </div>

      {/* Eligibility banner — always shown, even when blocked, so the reason is visible */}
      <Card
        className={
          !eligibility.eligible
            ? "border-destructive/30 bg-destructive/5"
            : undefined
        }
      >
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          {eligibility.eligible ? (
            <Landmark className="size-5 shrink-0 text-primary" />
          ) : (
            <AlertTriangle className="size-5 shrink-0 text-destructive" />
          )}
          <div>
            <CardTitle className="text-base">
              {eligibility.eligible
                ? `You can borrow up to ${formatNaira(eligibility.maxLoanAmount)}`
                : "You're not eligible to apply right now"}
            </CardTitle>
            <CardDescription>
              {eligibility.eligible
                ? `Based on ${formatNaira(eligibility.totalContributions)} in total contributions`
                : eligibility.reason}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      {eligibility.eligible && (
        <LoanApplicationForm maxLoanAmount={eligibility.maxLoanAmount} />
      )}
    </div>
  );
}

const LOAN_MULTIPLIER_LABEL = "3x";