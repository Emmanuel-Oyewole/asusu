"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { Role, VerificationStatus } from "@/generated/prisma/client";

export async function promoteToAdmin(userId: string) {
  const admin = await requireAdmin();

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("Member not found.");
  if (target.role === Role.ADMIN)
    throw new Error("This member is already an admin.");
  if (target.verificationStatus !== VerificationStatus.VERIFIED) {
    throw new Error("Only verified members can be promoted to admin.");
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { role: Role.ADMIN } }),
    prisma.adminActionLog.create({
      data: {
        adminId: admin.id,
        action: "PROMOTE_TO_ADMIN",
        targetType: "User",
        targetId: userId,
      },
    }),
  ]);

  revalidatePath(`/admin/members/${userId}`);
}
