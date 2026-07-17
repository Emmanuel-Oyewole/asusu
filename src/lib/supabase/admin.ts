import { createClient } from "@supabase/supabase-js";

// Bypasses RLS entirely. NEVER import this into a Client Component,
// and never let SUPABASE_SERVICE_ROLE_KEY leak into a NEXT_PUBLIC_ variable.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
