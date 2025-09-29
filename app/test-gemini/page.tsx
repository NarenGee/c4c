'use client'

import { useState } from 'react'
import { testGeminiAPI } from '@/lib/gemini'
import { Button } from '@/components/ui/button'

export default function TestGeminiPage() {
  const [response, setResponse] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const handleTest = async () => {
    setLoading(true)
    setError('')
    setResponse('')
    
    try {
      const result = await testGeminiAPI()
      setResponse(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Gemini API</h1>
      
      <Button onClick={handleTest} disabled={loading} className="mb-4">
        {loading ? 'Testing...' : 'Test API'}
      </Button>
      
      {response && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="font-semibold text-green-800">Response:</h3>
          <p className="text-green-700">{response}</p>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="font-semibold text-red-800">Error:</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
        <h3 className="font-semibold text-gray-800">Debug Info:</h3>
        <p className="text-gray-700">Check the browser console for detailed logs</p>
      </div>
    </div>
  )
} 