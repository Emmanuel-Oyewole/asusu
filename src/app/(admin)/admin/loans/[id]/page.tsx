import { notFound } from "next/navigation";
import { Landmark } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { LoanStatus } from "@/generated/prisma/client";
import { checkLoanEligibility } from "@/utils/eligibility";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { LOAN_STATUS_META } from "@/lib/loan-status";
import { LoanReviewActions } from "@/components/admin/loan-review-actions";
import { formatNaira } from "@/utils/finance";
import { DisburseLoanButton } from "@/components/admin/disburse-loan-button";

export default async function AdminLoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const loan = await prisma.loan.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!loan) notFound();

  const eligibility = await checkLoanEligibility(loan.userId);
  const meta = LOAN_STATUS_META[loan.status];
  const requestExceedsCurrentCap =
    Number(loan.principalAmount) > eligibility.maxLoanAmount;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{loan.user.name}</h1>
          <p className="text-sm text-muted-foreground">{loan.user.matricNo}</p>
        </div>
        <StatusPill
          label={meta.label}
          variant={meta.variant}
          icon={meta.icon}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Request details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Row
              label="Amount requested"
              value={formatNaira(Number(loan.principalAmount))}
            />
            <Row label="Purpose" value={loan.purpose ?? "—"} />
            <Row label="Requested term" value={`${loan.termMonths} months`} />
            <Row
              label="Submitted"
              value={loan.createdAt.toLocaleDateString("en-NG", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            />
          </CardContent>
        </Card>

        <Card
          className={
            requestExceedsCurrentCap
              ? "border-destructive/30 bg-destructive/5"
              : undefined
          }
        >
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <Landmark className="size-5 shrink-0 text-primary" />
            <CardTitle className="text-base">Eligibility context</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Row
              label="Total contributions"
              value={formatNaira(eligibility.totalContributions)}
            />
            <Row
              label="Current max eligible (3x)"
              value={formatNaira(eligibility.maxLoanAmount)}
            />
            {requestExceedsCurrentCap && (
              <p className="mt-1 text-xs text-destructive">
                ⚠ This request now exceeds the member&apos;s current limit —
                their contributions may have changed since applying. Review
                before approving.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {loan.status === LoanStatus.PENDING && (
        <Card>
          <CardHeader>
            <CardTitle>Decision</CardTitle>
          </CardHeader>
          <CardContent>
            <LoanReviewActions
              loanId={loan.id}
              requestedTermMonths={loan.termMonths}
            />
          </CardContent>
        </Card>
      )}
      {loan.status === LoanStatus.APPROVED && (
        <Card>
          <CardHeader>
            <CardTitle>Ready for disbursement</CardTitle>
            <CardDescription>
              {loan.user.bankAccountNumber
                ? `Funds will be sent to ${loan.user.bankName} — ${loan.user.bankAccountNumber}`
                : "⚠ This member has not added bank details yet — disbursement is blocked."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DisburseLoanButton
              loanId={loan.id}
              disabled={!loan.user.bankAccountNumber}
            />
          </CardContent>
        </Card>
      )}

      {loan.status === LoanStatus.REJECTED && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base">Rejection reason</CardTitle>
            <CardDescription>{loan.rejectionReason}</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
