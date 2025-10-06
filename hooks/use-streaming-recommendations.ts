"use client"

import { useState, useCallback } from 'react'

interface StreamStatus {
  type: 'status' | 'progress' | 'complete' | 'error'
  message: string
  current?: number
  total?: number
  count?: number
}

export function useStreamingRecommendations() {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  const generateRecommendations = useCallback(async (profile: any): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    setStatus('')
    setProgress(null)
    setIsComplete(false)

    try {
      const response = await fetch('/api/college-recommendations-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profile }),
      })

      if (!response.ok) {
        throw new Error('Failed to start recommendations generation')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response stream available')
      }

      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: StreamStatus = JSON.parse(line.slice(6))
              
              switch (data.type) {
                case 'status':
                  setStatus(data.message)
                  break
                case 'progress':
                  setProgress({
                    current: data.current || 0,
                    total: data.total || 0
                  })
                  setStatus(data.message)
                  break
                case 'complete':
                  setStatus(data.message)
                  setProgress(null)
                  setIsComplete(true)
                  return true
                case 'error':
                  setError(data.message)
                  return false
              }
            } catch (parseError) {
              console.warn('Failed to parse stream data:', parseError)
            }
          }
        }
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    generateRecommendations,
    isLoading,
    status,
    progress,
    error,
    isComplete
  }
}
