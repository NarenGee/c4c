"use client"

import { useState, useEffect, useCallback, memo } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface OptimizedTextInputProps {
  id: string
  label: string
  value: string
  onDebouncedChange: (value: string) => void
  placeholder?: string
  delay?: number
  type?: "input" | "textarea"
  rows?: number
  required?: boolean
}

export const OptimizedTextInput = memo(function OptimizedTextInput({
  id,
  label,
  value,
  onDebouncedChange,
  placeholder,
  delay = 300,
  type = "input",
  rows = 3,
  required = false
}: OptimizedTextInputProps) {
  const [localValue, setLocalValue] = useState(value)

  // Update local value when external value changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Debounce the value updates
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== value) {
        onDebouncedChange(localValue)
      }
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [localValue, delay, onDebouncedChange, value])

  const handleChange = useCallback((newValue: string) => {
    setLocalValue(newValue)
  }, [])

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {type === "textarea" ? (
        <Textarea
          id={id}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
        />
      ) : (
        <Input
          id={id}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  )
}) 