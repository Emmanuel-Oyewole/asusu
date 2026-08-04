"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { NIGERIAN_BANKS } from "@/lib/nomba/banks";

export type ActionState = { error?: string } | undefined;

export async function updateBankDetails(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await getCurrentUserId();

  const bankCode = formData.get("bankCode") as string;
  const bankAccountNumber = formData.get("bankAccountNumber") as string;
  const bankAccountName = formData.get("bankAccountName") as string;

  const bank = NIGERIAN_BANKS.find((b) => b.code === bankCode);
  if (!bank) return { error: "Please select a valid bank." };
  if (!/^\d{10}$/.test(bankAccountNumber)) {
    return { error: "Account number must be 10 digits." };
  }
  if (!bankAccountName.trim()) {
    return { error: "Please enter the account holder name." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      bankCode,
      bankName: bank.name,
      bankAccountNumber,
      bankAccountName: bankAccountName.trim(),
    },
  });

  revalidatePath("/profile");
  return undefined;
}
