"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { addCollegeToList } from "@/app/actions/college-list"

export default function TestDatabasePage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [addTestResult, setAddTestResult] = useState<any>(null)
  const [addTestLoading, setAddTestLoading] = useState(false)

  const runConnectionTest = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-db-connection')
      const data = await response.json()
      setTestResults(data)
    } catch (error) {
      setTestResults({
        success: false,
        error: "Failed to run connection test",
        tests: {
          supabaseClient: "❌ Failed to connect to API",
          authentication: "❌ Failed to connect to API",
          tableExists: "❌ Failed to connect to API",
          userRecord: "❌ Failed to connect to API"
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const testAddToList = async () => {
    setAddTestLoading(true)
    try {
      const testCollegeData = {
        college_name: "Test College",
        college_location: "Test City, Test Country",
        college_type: "University",
        tuition_range: "Test Range",
        source: "Test",
        notes: "This is a test college entry",
        priority: 1,
        application_status: "Considering" as const,
      }

      const result = await addCollegeToList(testCollegeData)
      setAddTestResult(result)
    } catch (error: any) {
      setAddTestResult({
        success: false,
        error: error.message || "Failed to add test college"
      })
    } finally {
      setAddTestLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Database Connection Test</h1>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Connection Test</CardTitle>
            <CardDescription>Test if Supabase connection and authentication are working</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={runConnectionTest} disabled={loading}>
              {loading ? "Testing..." : "Run Connection Test"}
            </Button>
            
            {testResults && (
              <div className="mt-4 space-y-2">
                {testResults.success ? (
                  <Alert className="border-green-200 bg-green-50">
                    <AlertDescription className="text-green-800">
                      Connection test completed
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Connection test failed: {testResults.error}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Test Results:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>{testResults.tests.supabaseClient}</li>
                    <li>{testResults.tests.authentication}</li>
                    <li>{testResults.tests.tableExists}</li>
                    <li>{testResults.tests.userRecord}</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add College Test</CardTitle>
            <CardDescription>Test the add college to list functionality</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={testAddToList} disabled={addTestLoading}>
              {addTestLoading ? "Testing..." : "Test Add to List"}
            </Button>
            
            {addTestResult && (
              <div className="mt-4">
                {addTestResult.success ? (
                  <Alert className="border-green-200 bg-green-50">
                    <AlertDescription className="text-green-800">
                      ✅ Successfully added test college to list!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertDescription>
                      ❌ Failed to add college: {addTestResult.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 