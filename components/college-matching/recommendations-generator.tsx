"use client"

import React, { useState, useCallback, useEffect } from 'react'
import { generateCollegeRecommendations } from '@/app/actions/college-matching'
import { useStreamingRecommendations } from '@/hooks/use-streaming-recommendations'
import { useRecommendationsLoading } from '@/hooks/use-recommendations-loading'
import { RecommendationsLoadingOverlay } from './recommendations-loading-overlay'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, Zap } from 'lucide-react'

interface RecommendationsGeneratorProps {
  studentProfile: any
  onRecommendationsGenerated?: (matches: any[]) => void
  className?: string
}

export function RecommendationsGenerator({ 
  studentProfile, 
  onRecommendationsGenerated,
  className = ""
}: RecommendationsGeneratorProps) {
  const [useStreaming, setUseStreaming] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastGeneratedCount, setLastGeneratedCount] = useState<number | null>(null)

  // Hooks for loading management
  const { loadingState, startLoading, updateStatus, updateProgress, stopLoading, resetLoading } = useRecommendationsLoading()
  
  // Streaming hook
  const { 
    generateRecommendations: generateStreamingRecommendations,
    isLoading: isStreamingLoading,
    status: streamingStatus,
    progress: streamingProgress,
    error: streamingError,
    isComplete: isStreamingComplete
  } = useStreamingRecommendations()

  const handleGenerateRecommendations = useCallback(async () => {
    if (!studentProfile) return

    setIsGenerating(true)
    resetLoading()
    startLoading()

    try {
      if (useStreaming) {
        // Use streaming API
        updateStatus('Starting streaming recommendations...')
        
        const success = await generateStreamingRecommendations(studentProfile)
        
        if (success) {
          updateStatus('Recommendations generated successfully!')
          setLastGeneratedCount(streamingProgress?.total || 12)
        } else {
          updateStatus('Failed to generate recommendations')
        }
      } else {
        // Use traditional API with simulated progress
        updateStatus('Analyzing your profile...')
        
        // Simulate progress updates for traditional API
        const progressSteps = [
          { progress: 25, status: 'Searching colleges that match your criteria...' },
          { progress: 50, status: 'Calculating admission chances and fit scores...' },
          { progress: 75, status: 'Personalizing recommendations...' },
          { progress: 90, status: 'Finalizing your college list...' },
          { progress: 100, status: 'Recommendations complete!' }
        ]

        // Simulate progress updates
        for (const step of progressSteps) {
          await new Promise(resolve => setTimeout(resolve, 1500)) // 1.5 second delay between steps
          updateProgress(step.progress, 100)
          updateStatus(step.status)
        }

        const result = await generateCollegeRecommendations(studentProfile.user_id || 'current-user', studentProfile)
        
        if (result.success && result.matches) {
          updateStatus('Recommendations generated successfully!')
          setLastGeneratedCount(result.matches.length)
          onRecommendationsGenerated?.(result.matches)
        } else {
          updateStatus('Failed to generate recommendations')
        }
      }
    } catch (error) {
      console.error('Error generating recommendations:', error)
      updateStatus('An error occurred while generating recommendations')
    } finally {
      setIsGenerating(false)
      // Keep loading overlay visible for a moment to show completion
      setTimeout(() => {
        stopLoading()
      }, 2000)
    }
  }, [studentProfile, useStreaming, startLoading, updateStatus, updateProgress, stopLoading, resetLoading, generateStreamingRecommendations, streamingProgress, onRecommendationsGenerated])

  // Sync streaming state with loading overlay
  const syncStreamingState = useCallback(() => {
    if (isStreamingLoading && !loadingState.isVisible) {
      startLoading()
    }
    
    if (streamingStatus) {
      updateStatus(streamingStatus)
    }
    
    if (streamingProgress) {
      updateProgress(streamingProgress.current, streamingProgress.total)
    }
    
    if (streamingError) {
      updateStatus(`Error: ${streamingError}`)
    }
    
    if (isStreamingComplete) {
      updateStatus('Streaming recommendations complete!')
      setTimeout(() => {
        stopLoading()
      }, 2000)
    }
  }, [isStreamingLoading, streamingStatus, streamingProgress, streamingError, isStreamingComplete, loadingState.isVisible, startLoading, updateStatus, updateProgress, stopLoading])

  // Sync streaming state
  useEffect(() => {
    syncStreamingState()
  }, [syncStreamingState])

  return (
    <div className={className}>
      {/* Generation Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <span>Generate College Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="generation-mode"
                  checked={useStreaming}
                  onChange={() => setUseStreaming(true)}
                  className="text-blue-600"
                />
                <span className="flex items-center space-x-1">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span>Streaming (Recommended)</span>
                </span>
                <Badge variant="secondary" className="text-xs">Faster</Badge>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="generation-mode"
                  checked={!useStreaming}
                  onChange={() => setUseStreaming(false)}
                  className="text-blue-600"
                />
                <span>Traditional</span>
              </label>
            </div>
            
            {lastGeneratedCount && (
              <Badge variant="outline" className="text-sm">
                Last generated: {lastGeneratedCount} colleges
              </Badge>
            )}
          </div>

          <Button 
            onClick={handleGenerateRecommendations}
            disabled={isGenerating || isStreamingLoading}
            className="w-full"
            size="lg"
          >
            {isGenerating || isStreamingLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Recommendations...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate My College Recommendations
              </>
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm text-slate-600">
              Our college recommendation engine will analyze your profile and find colleges that match your preferences, academic profile, and goals.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              This process typically takes 1-2 minutes and cannot be cancelled once started.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Loading Overlay */}
      <RecommendationsLoadingOverlay
        isVisible={loadingState.isVisible}
        status={loadingState.status}
        progress={loadingState.progress || undefined}
        studentProfile={studentProfile}
      />
    </div>
  )
}
