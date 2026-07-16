"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginUser } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginUser, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Log in to your cooperative account</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="h-10 rounded-md border border-input bg-input px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="h-10 rounded-md border border-input bg-input px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {state?.error && (
              <p className="text-sm text-destructive" role="alert">
                {state.error}
              </p>
            )}

            <Button type="submit" disabled={isPending} className="mt-2">
              {isPending ? "Logging in..." : "Log in"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-primary underline underline-offset-4"
            >
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
