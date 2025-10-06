"use client"

import React, { useState, useEffect, useRef } from 'react'
import { X, Lightbulb, TrendingUp, Target, CheckCircle } from 'lucide-react'
import { getRandomTips } from '@/lib/college-tips'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface LoadingOverlayProps {
  isVisible: boolean
  status?: string
  progress?: { current: number; total: number }
  onClose?: () => void
  studentProfile?: any
}

interface LoadingStep {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  duration: number // estimated duration in seconds
}

const loadingSteps: LoadingStep[] = [
  {
    id: 'analyzing',
    label: 'Analyzing Profile',
    description: 'Reviewing your academic background and preferences',
    icon: Target,
    duration: 15
  },
  {
    id: 'searching',
    label: 'Searching Colleges',
    description: 'Finding colleges that match your criteria',
    icon: TrendingUp,
    duration: 30
  },
  {
    id: 'calculating',
    label: 'Calculating Matches',
    description: 'Determining admission chances and fit scores',
    icon: CheckCircle,
    duration: 45
  },
  {
    id: 'finalizing',
    label: 'Finalizing Results',
    description: 'Preparing your personalized recommendations',
    icon: Target,
    duration: 20
  }
]

export function RecommendationsLoadingOverlay({ 
  isVisible, 
  status, 
  progress, 
  onClose,
  studentProfile 
}: LoadingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [currentTip, setCurrentTip] = useState(getRandomTips(1)[0])
  const [tips, setTips] = useState(getRandomTips(5))
  const tipInterval = useRef<NodeJS.Timeout>()

  // Determine target audiences for personalized tips
  const getTargetAudiences = () => {
    const audiences: string[] = []
    if (studentProfile?.firstGenerationStudent) audiences.push('first-gen')
    if (studentProfile?.financialAidNeeded) audiences.push('financial-aid-needed')
    if (studentProfile?.countryOfResidence && studentProfile.countryOfResidence !== 'United States') {
      audiences.push('international')
    }
    return audiences
  }

  // Rotate tips every 8 seconds
  useEffect(() => {
    if (!isVisible) return

    const audiences = getTargetAudiences()
    setTips(getRandomTips(5, audiences.length > 0 ? audiences : undefined))
    
    tipInterval.current = setInterval(() => {
      setCurrentTip(getRandomTips(1, audiences.length > 0 ? audiences : undefined)[0])
    }, 8000)

    return () => {
      if (tipInterval.current) {
        clearInterval(tipInterval.current)
      }
    }
  }, [isVisible, studentProfile])


  // Simulate progress through steps
  useEffect(() => {
    if (!isVisible || !progress) return

    const totalProgress = progress.current
    let stepIndex = 0
    let cumulativeDuration = 0

    for (let i = 0; i < loadingSteps.length; i++) {
      cumulativeDuration += loadingSteps[i].duration
      if (totalProgress <= (cumulativeDuration / 110) * 100) { // 110 is total estimated duration
        stepIndex = i
        break
      }
      stepIndex = i + 1
    }

    setCurrentStep(Math.min(stepIndex, loadingSteps.length - 1))
  }, [progress, isVisible])

  // Reset state when overlay becomes visible
  useEffect(() => {
    if (isVisible) {
      setCurrentStep(0)
      const audiences = getTargetAudiences()
      setCurrentTip(getRandomTips(1, audiences.length > 0 ? audiences : undefined)[0])
    }
  }, [isVisible])

  // Cleanup intervals
  useEffect(() => {
    return () => {
      if (tipInterval.current) clearInterval(tipInterval.current)
    }
  }, [])

  if (!isVisible) return null

  const getProgressPercentage = () => {
    if (progress) {
      return (progress.current / progress.total) * 100
    }
    // Fallback: estimate based on elapsed time
    const totalEstimatedTime = 110 // seconds
    return Math.min((elapsedTime / totalEstimatedTime) * 100, 95)
  }


  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white shadow-2xl border-0">
        <CardContent className="p-8">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Generating College Recommendations
            </h2>
            <p className="text-slate-600">
              Our college recommendation engine is analyzing your profile...
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700">Progress</span>
              <span className="text-sm text-slate-600">
                {Math.round(getProgressPercentage())}%
              </span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>

          {/* Current Step */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-3">
              {React.createElement(loadingSteps[currentStep]?.icon || Target, { 
                className: "h-5 w-5 text-blue-600" 
              })}
              <div>
                <h3 className="font-semibold text-slate-800">
                  {loadingSteps[currentStep]?.label || 'Processing...'}
                </h3>
                <p className="text-sm text-slate-600">
                  {loadingSteps[currentStep]?.description || status || 'Please wait while we process your request...'}
                </p>
              </div>
            </div>
          </div>

          {/* Process Information */}
          <div className="mb-6 p-4 bg-slate-50 rounded-lg">
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700">
                Process typically takes 1-2 minutes
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Please keep this window open while recommendations are being generated
              </p>
            </div>
          </div>

          {/* College Application Tips */}
          <div className="border-t pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <h3 className="font-semibold text-slate-800">College Application Tip</h3>
              <Badge variant="secondary" className="text-xs">
                {currentTip.category}
              </Badge>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-slate-800">
                {currentTip.title}
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                {currentTip.description}
              </p>
            </div>

            {/* Tip Progress Indicator */}
            <div className="mt-4 flex space-x-1">
              {[0, 1, 2, 4, 5].map((index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full ${
                    index === Math.floor((Date.now() % 8000) / 1600) 
                      ? 'bg-yellow-500' 
                      : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-xs text-slate-500">
              Please keep this window open while recommendations are being generated.
              The process may take 1-2 minutes depending on your profile complexity.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
