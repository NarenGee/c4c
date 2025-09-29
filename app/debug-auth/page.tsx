import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function DebugAuthPage() {
  const supabase = await createClient()
  
  // Get auth user
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  
  // Get user profile
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Auth User:</strong>
              <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
                {JSON.stringify(authUser, null, 2)}
              </pre>
            </div>
            
            <div>
              <strong>Auth Error:</strong>
              <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
                {JSON.stringify(authError, null, 2)}
              </pre>
            </div>
            
            <div>
              <strong>User Profile:</strong>
              <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
            
            <div>
              <strong>Session:</strong>
              <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
                {JSON.stringify(await supabase.auth.getSession(), null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <form action="/api/auth/signout" method="post">
            <Button type="submit" variant="destructive">
              Sign Out
            </Button>
          </form>
          
          <Button onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
          
          <Button onClick={() => window.location.href = '/dashboard'}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
} 