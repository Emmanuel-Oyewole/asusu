"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { LoanStatus, TransactionType } from "@/generated/prisma/client";
import { initiateBankTransfer } from "@/lib/nomba/transfer";

export async function approveLoan(loanId: string, confirmedTermMonths: number) {
  const admin = await requireAdmin();

  const loan = await prisma.loan.findUnique({ where: { id: loanId } });
  if (!loan || loan.status !== LoanStatus.PENDING) {
    throw new Error("This loan is no longer pending review.");
  }

  await prisma.$transaction([
    prisma.loan.update({
      where: { id: loanId },
      data: {
        status: LoanStatus.APPROVED,
        termMonths: confirmedTermMonths,
        approvedBy: admin.id,
        approvedAt: new Date(),
      },
    }),
    prisma.adminActionLog.create({
      data: {
        adminId: admin.id,
        action: "APPROVE_LOAN",
        targetType: "Loan",
        targetId: loanId,
        metadata: { termMonths: confirmedTermMonths },
      },
    }),
  ]);

  // TODO: push "Your loan has been approved"

  revalidatePath("/admin/loans");
  revalidatePath(`/admin/loans/${loanId}`);
  redirect("/admin/loans");
}

export async function rejectLoan(loanId: string, reason: string) {
  const admin = await requireAdmin();

  if (!reason.trim()) {
    throw new Error("A rejection reason is required.");
  }

  const loan = await prisma.loan.findUnique({ where: { id: loanId } });
  if (!loan || loan.status !== LoanStatus.PENDING) {
    throw new Error("This loan is no longer pending review.");
  }

  await prisma.$transaction([
    prisma.loan.update({
      where: { id: loanId },
      data: { status: LoanStatus.REJECTED, rejectionReason: reason },
    }),
    prisma.adminActionLog.create({
      data: {
        adminId: admin.id,
        action: "REJECT_LOAN",
        targetType: "Loan",
        targetId: loanId,
        metadata: { reason },
      },
    }),
  ]);

  // TODO: push "Your loan was rejected: <reason>"

  revalidatePath("/admin/loans");
  revalidatePath(`/admin/loans/${loanId}`);
  redirect("/admin/loans");
}

export async function disburseLoan(loanId: string) {
  const admin = await requireAdmin();

  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: { user: true },
  });

  if (!loan || loan.status !== LoanStatus.APPROVED) {
    throw new Error("This loan is not ready for disbursement.");
  }

  const { user } = loan;
  if (!user.bankAccountNumber || !user.bankCode || !user.bankAccountName) {
    throw new Error(
      "This member has not provided bank details. Ask them to complete their profile first.",
    );
  }

  const merchantTxRef = `disb_${loan.id}_${Date.now()}`;

  const transferResult = await initiateBankTransfer({
    amount: Number(loan.principalAmount),
    accountNumber: user.bankAccountNumber,
    accountName: user.bankAccountName,
    bankCode: user.bankCode,
    merchantTxRef,
    narration: `Loan disbursement — ${loan.purpose ?? "Cooperative loan"}`,
  });

  if (!transferResult.success) {
    throw new Error(
      "Transfer failed. Please check the member's bank details and try again.",
    );
  }

  // Split principal evenly across the term. Any remainder from division
  // (e.g. ₦10,000 / 3 months) is folded into the final installment so the
  // sum of installments always exactly equals the principal — never leaves
  // a stray kobo unaccounted for in the ledger.
  const termMonths = loan.termMonths;
  const baseAmount =
    Math.floor((Number(loan.principalAmount) / termMonths) * 100) / 100;
  const installmentsData = Array.from({ length: termMonths }, (_, i) => {
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + i + 1);
    const isLast = i === termMonths - 1;
    const roundingRemainder =
      Number(loan.principalAmount) - baseAmount * (termMonths - 1);
    return {
      installmentNo: i + 1,
      amountDue: isLast ? roundingRemainder : baseAmount,
      dueDate,
    };
  });

  await prisma.$transaction([
    prisma.loan.update({
      where: { id: loanId },
      data: {
        status: LoanStatus.ACTIVE,
        disbursedAt: new Date(),
        nombaTransferRef: transferResult.nombaTransferRef,
      },
    }),
    prisma.loanInstallment.createMany({
      data: installmentsData.map((inst) => ({ loanId, ...inst })),
    }),
    prisma.transaction.create({
      data: {
        type: TransactionType.DISBURSEMENT,
        userId: loan.userId,
        loanId: loan.id,
        amount: Number(loan.principalAmount),
        nombaReference: transferResult.nombaTransferRef,
      },
    }),
    prisma.adminActionLog.create({
      data: {
        adminId: admin.id,
        action: "DISBURSE_LOAN",
        targetType: "Loan",
        targetId: loanId,
        metadata: { nombaTransferRef: transferResult.nombaTransferRef },
      },
    }),
  ]);

  // TODO (Tier 3): push "Your loan has been disbursed"

  revalidatePath(`/admin/loans/${loanId}`);
  revalidatePath("/admin/loans");
}
