"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Role, VerificationStatus, Prisma } from "../generated/prisma/client";

async function createActionClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );
}

export type ActionState = { error?: string } | undefined;

export async function registerStudent(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = formData.get("name") as string;
  const matricNo = formData.get("matricNo") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const department = formData.get("department") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createActionClient();

  const { data, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !data.user) {
    return { error: authError?.message ?? "Could not create account." };
  }

  try {
    await prisma.user.create({
      data: {
        id: data.user.id,
        name,
        matricNo,
        email,
        phone,
        department,
        role: Role.STUDENT,
        verificationStatus: VerificationStatus.UNVERIFIED,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const field = (err.meta?.target as string[])?.[0] ?? "field";
      return { error: `That ${field} is already registered.` };
    }
    return {
      error: "Something went wrong creating your profile. Please try again.",
    };
  }

  redirect("/verify-pending");
}

export async function loginUser(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createActionClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "Invalid email or password." };
  }

  const profile = await prisma.user.findUnique({
    where: { id: data.user.id },
    select: { role: true, verificationStatus: true },
  });

  if (!profile) {
    return { error: "Account not found. Please contact support." };
  }

  if (profile.role === Role.ADMIN) {
    redirect("/admin");
  }

  if (profile.verificationStatus === VerificationStatus.VERIFIED) {
    redirect("/dashboard");
  }

  redirect("/verify-pending");
}

export async function getCurrentUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");
  return user.id;
}

export async function getCurrentUserIdOrNull(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// Guards the (student) route group — bounces admins to /admin,
// unverified students to /verify-pending, logged-out users to /login.
export async function requireStudent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, role: true, verificationStatus: true },
  });

  if (!profile) redirect("/login");
  if (profile.role === Role.ADMIN) redirect("/admin");
  if (profile.verificationStatus !== VerificationStatus.VERIFIED)
    redirect("/verify-pending");

  return profile;
}

// Guards the (admin)/admin route group
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, role: true },
  });

  if (!profile || profile.role !== Role.ADMIN) redirect("/dashboard");

  return profile;
}

// For /verify-pending itself — any logged-in user is allowed to see it
export async function requireAuthProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, verificationStatus: true, rejectionReason: true },
  });

  if (!profile) redirect("/login");
  return profile;
}

export async function logoutUser() {
  const supabase = await createActionClient();
  await supabase.auth.signOut();
  redirect("/login");
}