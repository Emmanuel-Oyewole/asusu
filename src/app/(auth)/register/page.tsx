"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerStudent } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { PasswordRequirements } from "@/components/forms/password-requirements";
import { StickyFormFooter } from "@/components/forms/sticky-form-footer";
import { validatePassword } from "@/lib/password";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(
    registerStudent,
    undefined,
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { valid: passwordValid } = validatePassword(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <h1 className="text-xl font-bold">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Join the ABU Cooperative
          </p>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <Field label="Full Name" name="name" required />
          <Field label="Matric Number" name="matricNo" required />
          <Field label="Email" name="email" type="email" required />
          <Field label="Phone Number" name="phone" type="tel" required />
          <Field label="Department" name="department" required />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 rounded-md border border-input bg-input px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {password.length > 0 && (
              <PasswordRequirements password={password} />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-10 rounded-md border border-input bg-input px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-xs text-destructive">
                Passwords do not match.
              </p>
            )}
          </div>

          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary underline underline-offset-4"
            >
              Log in
            </Link>
          </p>

          <StickyFormFooter>
            <Button
              type="submit"
              disabled={isPending || !passwordValid || !passwordsMatch}
              className="w-full"
            >
              {isPending ? "Creating account..." : "Create account"}
            </Button>
          </StickyFormFooter>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="h-10 rounded-md border border-input bg-input px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}
