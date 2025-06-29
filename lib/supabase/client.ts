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
    console.error("Missing Supabase environment variables")
    throw new Error("Supabase configuration is incomplete")
  }

  // A fetch that never throws in the browser sandbox – returns an empty JSON response instead
  const safeFetch: typeof fetch = async (input, init) => {
    try {
      return await fetch(input, init)
    } catch (err) {
      console.warn("Supabase request blocked in preview, returning stub response:", err)
      return new Response(JSON.stringify({ user: null, error: { message: "network-blocked" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }
  }

  const options: SupabaseClientOptions = {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      flowType: "pkce",
    },
    global: {
      fetch: safeFetch,
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
