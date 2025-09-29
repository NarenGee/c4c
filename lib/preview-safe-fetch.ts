/**
 * preview-safe-fetch
 *
 * In the v0 "Next.js" preview runtime most external network
 * requests are blocked.  The Supabase SDK – and any other code –
 * will throw a "TypeError: Failed to fetch".
 *
 * We transparently wrap the global fetch **on the client** so that
 * any network failure returns a fake 200 JSON response instead of
 * throwing.  This keeps the SDK happy while you preview the UI.
 *
 * In a real deployment this wrapper is a no-op because the network
 * request succeeds.
 */
if (typeof window !== "undefined") {
  const realFetch = window.fetch

  window.fetch = async (...args) => {
    try {
      return await realFetch(...args)
    } catch (err) {
      console.warn("preview-safe-fetch: network request blocked – returning stub response", err)
      return new Response(
        JSON.stringify({
          error: { message: "network-blocked" },
          data: null,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
  }
}
