import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./config.js";

export function createDb(): SupabaseClient {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });
}
