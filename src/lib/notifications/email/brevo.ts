import { BrevoClient, BrevoError } from "@getbrevo/brevo";

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY!,
  timeoutInSeconds: 15,
  maxRetries: 2,
});

type SendEmailInput = {
  to: { email: string; name?: string };
  subject: string;
  htmlContent: string;
};

export async function sendEmail(input: SendEmailInput): Promise<void> {
  if (!process.env.BREVO_API_KEY) {
    console.warn("BREVO_API_KEY not set — skipping email send.");
    return;
  }

  try {
    await brevo.transactionalEmails.sendTransacEmail({
      subject: input.subject,
      htmlContent: input.htmlContent,
      sender: {
        name: "ABU Cooperative",
        email: process.env.BREVO_SENDER_EMAIL!,
      },
      to: [input.to],
    });
  } catch (error) {
    // Deliberately swallowed — a failed email must never break the action
    // that triggered it (e.g. a loan disbursement succeeding). Logged for
    // visibility instead.
    if (error instanceof BrevoError) {
      console.error(
        `Brevo send failed (${error.statusCode}): ${error.message}`,
      );
    } else {
      console.error("Brevo send failed:", error);
    }
  }
}
