"use client"

import { useState, useCallback, useRef } from 'react'

interface LoadingState {
  isVisible: boolean
  status: string
  progress: { current: number; total: number } | null
  error: string | null
}

interface UseRecommendationsLoadingReturn {
  loadingState: LoadingState
  startLoading: () => void
  updateStatus: (status: string) => void
  updateProgress: (current: number, total: number) => void
  setError: (error: string) => void
  stopLoading: () => void
  resetLoading: () => void
}

export function useRecommendationsLoading(): UseRecommendationsLoadingReturn {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isVisible: false,
    status: '',
    progress: null,
    error: null
  })

  const startTimeRef = useRef<number | null>(null)

  const startLoading = useCallback(() => {
    startTimeRef.current = Date.now()
    setLoadingState({
      isVisible: true,
      status: 'Initializing college recommendation engine...',
      progress: null,
      error: null
    })
  }, [])

  const updateStatus = useCallback((status: string) => {
    setLoadingState(prev => ({
      ...prev,
      status,
      error: null
    }))
  }, [])

  const updateProgress = useCallback((current: number, total: number) => {
    setLoadingState(prev => ({
      ...prev,
      progress: { current, total },
      error: null
    }))
  }, [])


  const setError = useCallback((error: string) => {
    setLoadingState(prev => ({
      ...prev,
      error,
      isVisible: true // Keep visible to show error
    }))
  }, [])

  const stopLoading = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      isVisible: false,
      status: 'Complete'
    }))
    startTimeRef.current = null
  }, [])

  const resetLoading = useCallback(() => {
    setLoadingState({
      isVisible: false,
      status: '',
      progress: null,
      error: null
    })
    startTimeRef.current = null
  }, [])

  return {
    loadingState,
    startLoading,
    updateStatus,
    updateProgress,
    setError,
    stopLoading,
    resetLoading
  }
}
