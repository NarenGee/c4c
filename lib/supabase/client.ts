import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClientOptions } from "@supabase/supabase-js"

/**
 * Create a Supabase client for browser use with minimal auto-behavior
 * to prevent unwanted network calls that could fail in preview environments
 */
export function createClient() {
  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Missing Supabase environment variables - returning mock client")
    // Return a mock client that will fail gracefully
    return {
      auth: {
        signInWithPassword: async () => ({ error: { message: "Database not configured" } }),
        signOut: async () => ({ error: { message: "Database not configured" } }),
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: { message: "Database not configured" } }) }) }),
        insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: "Database not configured" } }) }) }),
        update: () => ({ eq: async () => ({ data: null, error: { message: "Database not configured" } }) }),
        delete: () => ({ eq: async () => ({ data: null, error: { message: "Database not configured" } }) }),
      }),
    } as any
  }

  const options: SupabaseClientOptions<any> = {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: "pkce",
    },
    global: {
      headers: {
        "X-Client-Info": "supabase-js-web",
      },
    },
  }

  try {
    return createBrowserClient(supabaseUrl, supabaseAnonKey, options)
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    throw error
  }
}
