import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Users, UserCheck, Search, BarChart3, Shield } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Your College Journey, <span className="text-blue-600">Simplified</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            AI-powered college search and application tracking for students, parents, and counselors. Find your perfect
            match and stay organized throughout the process.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 py-3">
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-3 bg-transparent">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid gap-8 md:grid-cols-3 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 p-3 rounded-full bg-blue-100">
                <Search className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle>AI-Powered Search</CardTitle>
              <CardDescription>
                Get personalized college recommendations based on your academic profile and preferences
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 p-3 rounded-full bg-green-100">
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>Application Tracking</CardTitle>
              <CardDescription>
                Organize and track all your college applications with our intuitive Kanban board
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 p-3 rounded-full bg-purple-100">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                Your data is protected with enterprise-grade security and granular access controls
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Roles Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Built for Everyone</h2>
          <p className="text-lg text-gray-600 mb-8">
            Whether you're a student, parent, or counselor, we have the tools you need
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 mb-16">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 rounded-full bg-blue-100">
                <GraduationCap className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-blue-900">Students</CardTitle>
              <CardDescription className="text-blue-700">
                Search colleges, track applications, and get AI-powered recommendations tailored to your profile
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 rounded-full bg-green-100">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-green-900">Parents</CardTitle>
              <CardDescription className="text-green-700">
                Monitor your child's college search progress with read-only access to their applications and timeline
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 rounded-full bg-purple-100">
                <UserCheck className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-purple-900">Counselors</CardTitle>
              <CardDescription className="text-purple-700">
                Guide multiple students through their college journey with comprehensive oversight tools
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-blue-600 text-white rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of students who have found their perfect college match
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-3">
            <Link href="/signup">Create Your Account</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
