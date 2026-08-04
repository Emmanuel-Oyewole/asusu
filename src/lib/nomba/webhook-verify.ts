import crypto from "crypto";

/**
 * Verifies Nomba's webhook signature.
 * Real headers per Nomba's docs: nomba-signature, nomba-signature-algorithm, nomba-timestamp.
 * NOMBA_SIGNATURE_KEY works identically whether it's a real dashboard-issued key
 * or a placeholder secret used for local mock testing (see scripts/simulate-nomba-webhook.ts).
 */
export function verifyNombaSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader) return false;

  const secret = process.env.NOMBA_SIGNATURE_KEY;
  if (!secret) {
    throw new Error("NOMBA_SIGNATURE_KEY is not set.");
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  const sigBuf = Buffer.from(signatureHeader, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");

  // Constant-time comparison — a plain === leaks timing information an attacker
  // could use to guess the signature byte-by-byte.
  if (sigBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}
