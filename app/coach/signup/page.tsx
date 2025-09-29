import { CoachSignupForm } from "@/components/auth/coach-signup-form"

export default function CoachSignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <CoachSignupForm />
      </div>
    </div>
  )
}
