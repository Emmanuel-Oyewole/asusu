import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Role, VerificationStatus } from "../generated/prisma/client";

export async function getCurrentUserId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");
  return user.id;
}

export async function getCurrentUserIdOrNull(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// Guards the (student) route group — bounces admins to /admin,
// unverified students to /verify-pending, logged-out users to /login.
export async function requireStudent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, role: true, verificationStatus: true },
  });

  if (!profile) redirect("/login");
  if (profile.role === Role.ADMIN) redirect("/admin");
  if (profile.verificationStatus !== VerificationStatus.VERIFIED) redirect("/verify-pending");

  return profile;
}

// Guards the (admin)/admin route group
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, verificationStatus: true, rejectionReason: true },
  });

  if (!profile) redirect("/login");
  return profile;
}
