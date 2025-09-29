"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Lock } from "lucide-react"
import { VerifiedSuperAdminLogin } from "@/components/auth/verified-super-admin-login"

export default function SuperAdminLoginPage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 p-3 rounded-full bg-red-100">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Super Admin Portal
          </CardTitle>
          <CardDescription className="text-slate-300">
            Secure access for system administrators
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <VerifiedSuperAdminLogin />

          <div className="mt-6 space-y-4">
            {/* Security Notice */}
            <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-slate-300" />
                <span className="text-sm font-medium text-slate-300">Security Notice</span>
              </div>
              <p className="text-xs text-slate-400">
                This portal is restricted to authorized system administrators. 
                All access attempts are logged and monitored.
              </p>
            </div>

            {/* Links */}
            <div className="text-center space-y-2">
              <p className="text-sm text-slate-400">
                Need super admin access?{" "}
                <a href="/super-admin/signup" className="text-red-400 hover:text-red-300 font-medium">
                  Create Account
                </a>
              </p>
              <p className="text-sm text-slate-400">
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
