"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { LoanStatus } from "@/generated/prisma/client";

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
