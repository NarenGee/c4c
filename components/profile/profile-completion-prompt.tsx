import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export function ProfileCompletionPrompt() {
  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center justify-between space-x-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">Complete your profile</h2>
          <p className="text-sm text-muted-foreground">
            Get personalized college recommendations by completing your profile.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild className="flex-1">
            <Link href="/college-recommendations">
              Complete Profile
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/college-recommendations">Skip for Now</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
