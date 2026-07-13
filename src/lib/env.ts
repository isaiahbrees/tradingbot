/**
 * Whether Supabase is wired up. When it isn't (e.g. a fresh clone with no
 * .env), the app runs in a fully local preview mode with a demo session so
 * every screen is explorable before infrastructure exists.
 */
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}
