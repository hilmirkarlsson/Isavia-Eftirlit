import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Supabase tenging fyrir ÞJÓNINN (API leiðir). Notar service-role lykil sem
// hunsar RLS og má því skrifa. Lykillinn er EINGÖNGU á þjóninum – aldrei
// sendur í vafrann. Ef umhverfisbreytur vantar er forritið í "staðbundnum
// ham" (localStorage) og þetta skilar null.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Er sameiginlegi bakgrunnurinn uppsettur (service-role lykill til staðar)? */
export const supabaseConfigured = Boolean(url && serviceKey);

let cached: SupabaseClient | null = null;

/** Supabase-viðskiptavinur með service-role réttindum, eða null ef óuppsett. */
export function supabaseAdmin(): SupabaseClient | null {
  if (!url || !serviceKey) return null;
  if (!cached) {
    cached = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
