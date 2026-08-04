"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { createCheckoutOrder } from "@/lib/nomba/checkout";
import { InstallmentStatus } from "@/generated/prisma/client";

export async function payInstallment(installmentId: string) {
  const userId = await getCurrentUserId();

  const installment = await prisma.loanInstallment.findUnique({
    where: { id: installmentId },
    include: { loan: { include: { user: true } } },
  });

  // Ownership check — a student must never be able to pay (or probe the
  // existence of) another student's installment by guessing an id.
  if (!installment || installment.loan.userId !== userId) {
    throw new Error("Installment not found.");
  }

  if (installment.status === InstallmentStatus.PAID) {
    throw new Error("This installment has already been paid.");
  }

  // Reuse the existing order reference if the student already started this
  // payment once before (abandoned checkout, retry) — same idempotent-retry
  // pattern used in payContribution.
  const orderReference =
    installment.nombaOrderReference ?? `install_${installment.id}`;

  const { checkoutLink } = await createCheckoutOrder({
    orderReference,
    amount: Number(installment.amountDue),
    customerEmail: installment.loan.user.email,
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/loans/${installment.loanId}?paid=1`,
  });

  if (!installment.nombaOrderReference) {
    await prisma.loanInstallment.update({
      where: { id: installment.id },
      data: { nombaOrderReference: orderReference },
    });
  }

  redirect(checkoutLink);
}
