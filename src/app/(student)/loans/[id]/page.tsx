import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { LoanStatus, InstallmentStatus } from "@/generated/prisma/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { LOAN_STATUS_META } from "@/lib/loan-status";
import { getLoanBalanceRemaining } from "@/utils/eligibility";
import { PayInstallmentButton } from "@/components/forms/pay-installment-button";
import { formatNaira } from "@/utils/finance";

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const loan = await prisma.loan.findUnique({
    where: { id },
    include: { installments: { orderBy: { installmentNo: "asc" } } },
  });

  // Ownership check — a student must never view another student's loan by guessing an id
  if (!loan || loan.userId !== userId) notFound();

  const meta = LOAN_STATUS_META[loan.status];
  const showInstallments =
    loan.status === LoanStatus.ACTIVE || loan.status === LoanStatus.COMPLETED;
  const balanceRemaining = showInstallments
    ? getLoanBalanceRemaining(loan)
    : Number(loan.principalAmount);
  const progressPct = showInstallments
    ? Math.round(
        ((Number(loan.principalAmount) - balanceRemaining) /
          Number(loan.principalAmount)) *
          100,
      )
    : 0;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tabular-nums">
            {formatNaira(Number(loan.principalAmount))}
          </h1>
          <p className="text-sm text-muted-foreground">
            {loan.purpose} · {loan.termMonths} months
          </p>
        </div>
        <StatusPill
          label={meta.label}
          variant={meta.variant}
          icon={meta.icon}
        />
      </div>

      {loan.status === LoanStatus.REJECTED && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base">Reason for rejection</CardTitle>
            <CardDescription>
              {loan.rejectionReason || "No reason provided."}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {loan.status === LoanStatus.PENDING && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Awaiting review</CardTitle>
            <CardDescription>
              An administrator will review your request. You&apos;ll be notified
              once a decision is made.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {loan.status === LoanStatus.APPROVED && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Approved</CardTitle>
            <CardDescription>
              Your loan has been approved and is awaiting disbursement. Funds
              will be sent to your account shortly.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {showInstallments && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Repayment progress</CardTitle>
              <CardDescription>
                Balance remaining: {formatNaira(balanceRemaining)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {progressPct}% repaid
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Installment schedule</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col divide-y divide-border">
              {loan.installments.map((inst) => (
                <div
                  key={inst.id}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      Installment {inst.installmentNo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due{" "}
                      {inst.dueDate.toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium tabular-nums">
                      {formatNaira(Number(inst.amountDue))}
                    </span>
                    {inst.status === InstallmentStatus.PAID ? (
                      <StatusPill label="Paid" variant="success" />
                    ) : inst.status === InstallmentStatus.OVERDUE ? (
                      <StatusPill label="Overdue" variant="destructive" />
                    ) : (
                      <PayInstallmentButton installmentId={inst.id} />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
