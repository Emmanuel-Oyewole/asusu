import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications/actions";
import { sendEmail } from "@/lib/notifications/email/brevo";
import { wrapEmailHtml } from "@/lib/notifications/email/wrapper";
import { NotificationType } from "@/generated/prisma/client";

export async function notifyUser(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  url: string = "/login",
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  await prisma.notification.create({
    data: { userId, type, title, body, url },
  });

  await sendNotification(userId, title, body, url);

  if (user) {
    await sendEmail({
      to: { email: user.email, name: user.name },
      subject: title,
      htmlContent: wrapEmailHtml(title, `<p>${body}</p>`, "View details", url),
    });
  }
}
