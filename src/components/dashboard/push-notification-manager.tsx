"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { subscribeUser, unsubscribeUser } from "@/lib/notifications/actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((reg) => reg.pushManager.getSubscription())
        .then(setSubscription)
        .catch(() => {
          // Service worker registered fine, but reading an existing
          // subscription failed — treat as "not subscribed" rather than crash.
          setSubscription(null);
        });
    }
  }, []);

  async function subscribeToPush() {
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ),
      });
      setSubscription(sub);
      await subscribeUser(JSON.parse(JSON.stringify(sub)));
    } catch {
      setError(
        "Push notifications aren't available in this browser right now. Try a different browser, or check that push services aren't blocked on your network.",
      );
    }
  }

  async function unsubscribeFromPush() {
    setError(null);
    const endpoint = subscription?.endpoint;
    try {
      await subscription?.unsubscribe();
      setSubscription(null);
      if (endpoint) await unsubscribeUser(endpoint);
    } catch {
      setError("Couldn't disable notifications. Please try again.");
    }
  }

  if (!isSupported) return null;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          {subscription ? (
            <Bell className="size-5 text-primary" />
          ) : (
            <BellOff className="size-5 text-muted-foreground" />
          )}
          <div>
            <CardTitle>Push Notifications</CardTitle>
            <CardDescription>
              {subscription
                ? "You'll be reminded before repayments are due."
                : (error ??
                  "Enable reminders for contributions and repayments.")}
            </CardDescription>
          </div>
        </div>
        <Button
          size="sm"
          variant={subscription ? "outline" : "default"}
          onClick={subscription ? unsubscribeFromPush : subscribeToPush}
        >
          {subscription ? "Disable" : "Enable"}
        </Button>
      </CardHeader>
    </Card>
  );
}
