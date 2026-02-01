import { createClient } from "@supabase/supabase-js";

/**
 * Admin client with service role - bypasses RLS.
 * Use ONLY in server-side code for trusted operations (e.g. OAuth callbacks).
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for admin operations");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}
