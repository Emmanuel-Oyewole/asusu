"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "install-prompt-dismissed";

export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
    setDismissed(localStorage.getItem(DISMISS_KEY) === "true");
  }, []);

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  }

  if (isStandalone || dismissed) return null;

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <Download className="size-5 text-primary shrink-0" />
        <div>
          <CardTitle>Install the app</CardTitle>
          <CardDescription>
            {isIOS
              ? 'Tap the Share button, then "Add to Home Screen."'
              : "Use your browser menu to add this app to your home screen."}
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 -mt-1 -mr-1"
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
        >
          <X className="size-4" />
        </Button>
      </CardHeader>
    </Card>
  );
}
