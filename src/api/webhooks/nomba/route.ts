import { NextRequest, NextResponse } from "next/server";
import { verifyNombaSignature } from "@/lib/nomba/webhook-verify";
import { processPaymentEvent } from "@/lib/nomba/process-payment-event";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("nomba-signature");

  if (!verifyNombaSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  await processPaymentEvent(JSON.parse(rawBody));
  return NextResponse.json({ received: true });
}