"use server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { createCheckoutOrder } from "@/lib/nomba/checkout";
import { ContributionStatus } from "@/generated/prisma/client";
import { currentPeriod } from "@/utils/time";
const MONTHLY_CONTRIBUTION_AMOUNT = Number(process.env.MONTHLY_CONTRIBUTION_AMOUNT);

export async function payContribution() {
  const userId = await getCurrentUserId();
  const period = currentPeriod();

  // Reuse an existing PENDING row for this period if one already exists
  // (e.g. student started a payment, abandoned it, and is retrying) rather
  // than creating a duplicate — the unique(userId, period) constraint would
  // reject a second row anyway, but we want a clean retry, not a DB error.
  let contribution = await prisma.contribution.findUnique({
    where: { userId_period: { userId, period } },
  });

  if (contribution?.status === ContributionStatus.PAID) {
    throw new Error("This month's contribution has already been paid.");
  }

  if (!contribution) {
    contribution = await prisma.contribution.create({
      data: { userId, period, amount: MONTHLY_CONTRIBUTION_AMOUNT },
    });
  }

  const orderReference = `contrib_${userId}_${period}`;
  const { data: user } = {
    data: await prisma.user.findUniqueOrThrow({ where: { id: userId } }),
  };

  const { checkoutLink } = await createCheckoutOrder({
    orderReference,
    amount: MONTHLY_CONTRIBUTION_AMOUNT,
    customerEmail: user.email,
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/contributions?paid=1`,
  });

  await prisma.contribution.update({
    where: { id: contribution.id },
    data: { nombaOrderReference: orderReference },
  });

  redirect(checkoutLink);
}