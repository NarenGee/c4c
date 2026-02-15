import { getCurrentUser } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default async function TestUserProfilePage() {
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>User Profile Test</CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-4">
                <div>
                  <strong>User ID:</strong> {user.id}
                </div>
                <div>
                  <strong>Email:</strong> {user.email}
                </div>
                <div>
                  <strong>Full Name:</strong> {user.full_name}
                </div>
                <div>
                  <strong>Role:</strong> {user.role}
                </div>
                <div>
                  <strong>Created At:</strong> {user.created_at}
                </div>
                <div className="p-4 bg-green-100 text-green-800 rounded">
                  ✅ User profile successfully loaded!
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-100 text-red-800 rounded">
                ❌ No user found. Please sign in first.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 