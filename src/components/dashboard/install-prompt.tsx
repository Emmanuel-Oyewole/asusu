"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

    if (isStandalone) return null;

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
        </CardHeader>
      </Card>
    );
}
