"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { VerificationStatus } from "../generated/prisma/client";

export async function submitAdmissionLetter(storagePath: string) {
  const userId = await getCurrentUserId();

  await prisma.user.update({
    where: { id: userId },
    data: {
      admissionLetterPath: storagePath,
      verificationStatus: VerificationStatus.PENDING_REVIEW,
      rejectionReason: null, // clear any prior rejection reason on resubmission
    },
  });

  revalidatePath("/verify-pending");
}
