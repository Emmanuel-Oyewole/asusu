"use client";

import { Check, X } from "lucide-react";
import { PASSWORD_REQUIREMENTS } from "@/lib/password";
import { cn } from "@/lib/utils";

export function PasswordRequirements({ password }: { password: string }) {
  return (
    <ul className="flex flex-col gap-1 rounded-md bg-muted/50 p-3 text-xs">
      {PASSWORD_REQUIREMENTS.map((req) => {
        const passed = req.test(password);
        return (
          <li
            key={req.id}
            className={cn(
              "flex items-center gap-1.5",
              passed ? "text-success" : "text-muted-foreground",
            )}
          >
            {passed ? (
              <Check className="size-3.5" />
            ) : (
              <X className="size-3.5" />
            )}
            {req.label}
          </li>
        );
      })}
    </ul>
  );
}
