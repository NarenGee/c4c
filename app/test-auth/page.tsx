import { getCurrentUser } from "@/lib/auth"
import { AuthDebug } from "@/components/debug/auth-debug"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SupabaseEmailTest } from "@/components/debug/supabase-email-test"

export default async function TestAuthPage() {
  const user = await getCurrentUser()

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Test</CardTitle>
          <CardDescription>Debug authentication and user profile status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Server-side User Data:</h3>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">{JSON.stringify(user, null, 2)}</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      <AuthDebug />
      <SupabaseEmailTest />
    </div>
  )
}
