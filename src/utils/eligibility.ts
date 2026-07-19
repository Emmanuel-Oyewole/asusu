import { prisma } from "@/lib/prisma";
import {
  TransactionType,
  InstallmentStatus,
  Loan,
  LoanInstallment,
} from "@/generated/prisma/client";

export const LOAN_MULTIPLIER = 3;

export async function getTotalContributions(userId: string): Promise<number> {
  const sum = await prisma.transaction.aggregate({
    where: { userId, type: TransactionType.CONTRIBUTION },
    _sum: { amount: true },
  });
  return Number(sum._sum.amount ?? 0);
}

export function getMaxLoanAmount(totalContributions: number): number {
  return totalContributions * LOAN_MULTIPLIER;
}

export async function hasOverdueInstallment(userId: string): Promise<boolean> {
  const overdue = await prisma.loanInstallment.findFirst({
    where: {
      status: { in: [InstallmentStatus.PENDING, InstallmentStatus.OVERDUE] },
      dueDate: { lt: new Date() },
      loan: { userId },
    },
  });
  return overdue !== null;
}

export type EligibilityCheck = {
  eligible: boolean;
  reason?: string;
  totalContributions: number;
  maxLoanAmount: number;
};

/**
 * Single source of truth for "can this student borrow `requestedAmount` right now?"
 * Used by both the /loans/apply page (to show the banner) and the Server Action
 * (to actually validate before creating the Loan row). Never trust the client-side
 * number alone — always re-run this server-side at submission time too.
 */
export async function checkLoanEligibility(
  userId: string,
  requestedAmount?: number,
): Promise<EligibilityCheck> {
  const [totalContributions, hasOverdue] = await Promise.all([
    getTotalContributions(userId),
    hasOverdueInstallment(userId),
  ]);

  const maxLoanAmount = getMaxLoanAmount(totalContributions);

  if (hasOverdue) {
    return {
      eligible: false,
      reason:
        "You have an overdue installment on an existing loan. Please clear it before applying for a new loan.",
      totalContributions,
      maxLoanAmount,
    };
  }

  if (requestedAmount !== undefined && requestedAmount > maxLoanAmount) {
    return {
      eligible: false,
      reason: `Requested amount exceeds your limit of ${maxLoanAmount.toLocaleString("en-NG")}.`,
      totalContributions,
      maxLoanAmount,
    };
  }

  return { eligible: true, totalContributions, maxLoanAmount };
}


export type LoanWithInstallments = Loan & { installments: LoanInstallment[] };

export function getLoanBalanceRemaining(loan: LoanWithInstallments): number {
  const paidTotal = loan.installments
    .filter((i) => i.status === InstallmentStatus.PAID)
    .reduce((sum, i) => sum + Number(i.amountDue), 0);
  return Number(loan.principalAmount) - paidTotal;
}

export function getNextInstallment(
  loan: LoanWithInstallments,
): LoanInstallment | null {
  return (
    loan.installments.find((i) => i.status !== InstallmentStatus.PAID) ?? null
  );
}
