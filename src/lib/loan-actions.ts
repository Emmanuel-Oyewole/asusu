"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth";
import { checkLoanEligibility } from "@/utils/eligibility";
export type ActionState = { error?: string } | undefined;
const ALLOWED_TERMS = [3, 6, 9, 12];
const PURPOSE_OPTIONS = [
  "Tuition",
  "Health",
  "Personal",
  "Business",
  "Other",
] as const;

export async function applyForLoan(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Re-checks role AND verification status server-side — Server Actions are
  // their own endpoint and are NOT protected by the (student) layout guard,
  // same principle we applied to the admin actions earlier.
  const profile = await requireStudent();

  const amountRaw = formData.get("amount") as string;
  const purposeSelect = formData.get("purpose") as string;
  const purposeOther = (formData.get("purposeOther") as string | null)?.trim();
  const termRaw = formData.get("termMonths") as string;
  const acknowledged = formData.get("acknowledged") === "on";

  const amount = Number(amountRaw);
  const termMonths = Number(termRaw);

  if (!amountRaw || Number.isNaN(amount) || amount <= 0) {
    return { error: "Please enter a valid loan amount." };
  }
  if (!ALLOWED_TERMS.includes(termMonths)) {
    return { error: "Please select a valid repayment term." };
  }
  if (
    !PURPOSE_OPTIONS.includes(purposeSelect as (typeof PURPOSE_OPTIONS)[number])
  ) {
    return { error: "Please select a purpose." };
  }
  if (purposeSelect === "Other" && !purposeOther) {
    return { error: "Please describe the purpose of the loan." };
  }
  if (!acknowledged) {
    return { error: "You must agree to the repayment schedule to continue." };
  }

  // The authoritative check — client-side display in the previous step is UX only.
  const eligibility = await checkLoanEligibility(profile.id, amount);
  if (!eligibility.eligible) {
    return {
      error: eligibility.reason ?? "You are not eligible for this loan amount.",
    };
  }

  const finalPurpose =
    purposeSelect === "Other" ? purposeOther! : purposeSelect;

  const loan = await prisma.loan.create({
    data: {
      userId: profile.id,
      principalAmount: amount,
      termMonths,
      purpose: finalPurpose,
      // status defaults to PENDING per schema
    },
  });

  revalidatePath("/loans");
  redirect(`/loans/${loan.id}`);
}
