"use server";

import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

webpush.setVapidDetails(
  process.env.MAIL_TO_ADDRESS!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

type SerializedSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function subscribeUser(sub: SerializedSubscription) {
  const userId = await getCurrentUserId();

  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    update: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    create: {
      userId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
  });

  return { success: true };
}

export async function unsubscribeUser(endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  return { success: true };
}

export async function sendNotification(
  userId: string,
  title: string,
  body: string,
  url: string = "/",
) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({ title, body, url }),
      ),
    ),
  );

  // Clean up subscriptions that are no longer valid (410 Gone / 404)
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      const err = result.reason as { statusCode?: number };
      if (err.statusCode === 410 || err.statusCode === 404) {
        prisma.pushSubscription
          .delete({ where: { id: subs[i].id } })
          .catch(() => {});
      }
    }
  });

  return { success: true };
}