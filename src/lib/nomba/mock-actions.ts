"use server";

import { redirect } from "next/navigation";
import crypto from "crypto";
import { isNombaMockMode } from "@/lib/nomba/mock-mode";
import { processPaymentEvent } from "@/lib/nomba/process-payment-event";

export async function simulateMockPayment(
  orderReference: string,
  amount: number,
  callbackUrl: string,
) {
  if (!isNombaMockMode()) {
    throw new Error(
      "Mock payments are disabled — real Nomba credentials are configured.",
    );
  }

  await processPaymentEvent({
    event_type: "payment_success",
    requestId: crypto.randomUUID(),
    data: {
      transaction: {
        transactionId: `MOCK-${crypto.randomUUID()}`,
        transactionAmount: amount,
        time: new Date().toISOString(),
      },
      order: { orderReference, amount },
    },
  });

  redirect(callbackUrl);
}