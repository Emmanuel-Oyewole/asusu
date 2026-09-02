"use client";

import { LogOut } from "lucide-react";
import { logoutUser } from "@/lib/auth-actions";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logoutUser}>
      <button
        type="submit"
        className={
          className ??
          "flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        }
      >
        <LogOut className="size-4" />
        Log out
      </button>
    </form>
  );
}
