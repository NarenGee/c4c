import { useState, useEffect, useCallback } from 'react'

interface UseDebouncedInputProps {
  initialValue: string
  onDebouncedChange: (value: string) => void
  delay?: number
}

export function useDebouncedInput({
  initialValue,
  onDebouncedChange,
  delay = 300
}: UseDebouncedInputProps) {
  const [localValue, setLocalValue] = useState(initialValue)
  const [debouncedValue, setDebouncedValue] = useState(initialValue)

  // Update local value when initialValue changes (external updates)
  useEffect(() => {
    setLocalValue(initialValue)
    setDebouncedValue(initialValue)
  }, [initialValue])

  // Debounce the value updates
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(localValue)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [localValue, delay])

  // Call the callback when debounced value changes
  useEffect(() => {
    if (debouncedValue !== initialValue) {
      onDebouncedChange(debouncedValue)
    }
  }, [debouncedValue, onDebouncedChange, initialValue])

  const handleChange = useCallback((value: string) => {
    setLocalValue(value)
  }, [])

  return {
    value: localValue,
    onChange: handleChange
  }
} 