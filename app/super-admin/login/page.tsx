"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Lock } from "lucide-react"
import { VerifiedSuperAdminLogin } from "@/components/auth/verified-super-admin-login"

export default function SuperAdminLoginPage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-3 sm:p-4 md:p-6">
      <Card className="w-full max-w-md mx-auto border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <CardHeader className="text-center pb-4 md:pb-6 px-4 md:px-6">
          <div className="mx-auto mb-3 md:mb-4 p-2 md:p-3 rounded-full bg-red-100">
            <Shield className="h-6 w-6 md:h-8 md:w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl md:text-2xl font-bold text-white">
            Super Admin Portal
          </CardTitle>
          <CardDescription className="text-sm md:text-base text-slate-300">
            Secure access for system administrators
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-4 md:px-6">
          <VerifiedSuperAdminLogin />

          <div className="mt-4 md:mt-6 space-y-3 md:space-y-4">
            {/* Security Notice */}
            <div className="bg-slate-700/50 rounded-lg p-3 md:p-4 border border-slate-600">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-3 w-3 md:h-4 md:w-4 text-slate-300 flex-shrink-0" />
                <span className="text-xs md:text-sm font-medium text-slate-300">Security Notice</span>
              </div>
              <p className="text-xs text-slate-400">
                This portal is restricted to authorized system administrators. 
                All access attempts are logged and monitored.
              </p>
            </div>

            {/* Links */}
            <div className="text-center space-y-2">
              <p className="text-xs md:text-sm text-slate-400">
                Need super admin access?{" "}
                <a href="/super-admin/signup" className="text-red-400 hover:text-red-300 font-medium">
                  Create Account
                </a>
              </p>
              <p className="text-xs md:text-sm text-slate-400">
                Regular user?{" "}
                <a href="/signin" className="text-blue-400 hover:text-blue-300 font-medium">
                  Sign in here
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
