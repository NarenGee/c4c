import { createServerClient } from "@supabase/ssr"

/**
 * Service-role Supabase client that bypasses Row-Level-Security.
 * Must be used ONLY on the server – never expose the service key
 * to the browser.
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY")
  }

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    // We don’t need cookies for service-role calls,
    // but the ssr helper requires these methods.
    cookies: {
      // -- new recommended API  ---------------------------------
      get(name: string) {
        return undefined
      },
      set() {
        /* no-op – admin client never sets cookies */
      },
      remove() {
        /* no-op */
      },
      // -- deprecated API (still required for backward compat) --
      getAll() {
        return []
      },
      setAll() {
        /* no-op */
      },
    },
  })
}
