"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Supabase tenging fyrir VAFRANN – eingöngu notuð fyrir rauntíma-áskrift
// (realtime) svo tæki fái push þegar einhver annar breytir ástandi. Notar
// opinbera anon-lykilinn sem má aðeins LESA (sjá RLS í schema.sql). Öll skrif
// fara gegnum /api/state. Skilar null ef rauntími er ekki uppsettur.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Er rauntími uppsettur (anon-lykill + slóð til staðar)? */
export const realtimeConfigured = Boolean(url && anon);

let cached: SupabaseClient | null = null;

/** Supabase-vafraviðskiptavinur fyrir realtime, eða null ef óuppsett. */
export function supabaseBrowser(): SupabaseClient | null {
  if (!url || !anon) return null;
  if (!cached) {
    cached = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
