'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('App error:', error)
    
    // If it's a chunk loading error, try to reload the page
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      console.warn('Chunk loading error detected, reloading page...')
      window.location.reload()
    }
  }, [error])

  const handleReset = () => {
    // For chunk errors, do a hard reload instead of just resetting
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      window.location.reload()
    } else {
      reset()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-red-600">Something went wrong!</CardTitle>
          <CardDescription>
            {error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')
              ? 'There was an issue loading the application. We\'ll refresh the page automatically.'
              : 'An unexpected error occurred. Please try again.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <Button onClick={handleReset} className="w-full">
            Try again
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Go to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 