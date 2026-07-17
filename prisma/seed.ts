/**
 * Bootstrap seed — creates the FIRST admin account.
 * Run manually/locally only: `npx prisma db seed`
 * Never exposed via any app route. Requires the Supabase service-role key,
 * which must never be shipped to the client.
 */
import { createAdminClient } from "../src/lib/supabase/admin";
import { Role, VerificationStatus } from "../src/generated/prisma/client";
import { prisma } from "../src/lib/prisma";

const supabaseAdmin = createAdminClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in your local .env before seeding.",
    );
  }

  // 1. Create the Supabase Auth user directly (bypasses normal signup/email verification)
  const { data: authUser, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !authUser.user) {
    throw new Error(`Failed to create auth user: ${error?.message}`);
  }

  // 2. Create the matching profile row, already VERIFIED and role = ADMIN
  await prisma.user.create({
    data: {
      id: authUser.user.id,
      name: "System Administrator",
      matricNo: "ADMIN-0001",
      email,
      phone: "0000000000",
      department: "Cooperative Management",
      role: Role.ADMIN,
      verificationStatus: VerificationStatus.VERIFIED,
    },
  });

  console.log(`✅ Bootstrap admin created: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
