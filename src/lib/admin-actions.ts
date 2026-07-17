"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { VerificationStatus } from "../generated/prisma/client";

export async function approveVerification(userId: string) {
  const admin = await requireAdmin(); // re-checked here, not just relied on from the layout —
  // Server Actions are their own endpoint, layouts don't guard them

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus: VerificationStatus.VERIFIED,
        rejectionReason: null,
      },
    }),
    prisma.adminActionLog.create({
      data: {
        adminId: admin.id,
        action: "APPROVE_VERIFICATION",
        targetType: "User",
        targetId: userId,
      },
    }),
  ]);

  // TODO: push/email "Your account has been verified"

  revalidatePath("/admin/verifications");
  redirect("/admin/verifications");
}

export async function rejectVerification(userId: string, reason: string) {
  const admin = await requireAdmin();

  if (!reason.trim()) {
    throw new Error("A rejection reason is required.");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus: VerificationStatus.REJECTED,
        rejectionReason: reason,
      },
    }),
    prisma.adminActionLog.create({
      data: {
        adminId: admin.id,
        action: "REJECT_VERIFICATION",
        targetType: "User",
        targetId: userId,
        metadata: { reason },
      },
    }),
  ]);

  // TODO: push/email "Your account was rejected: <reason>"

  revalidatePath("/admin/verifications");
  redirect("/admin/verifications");
}
