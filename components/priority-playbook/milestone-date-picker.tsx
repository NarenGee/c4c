"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  formatMilestoneButtonDate,
  parseMilestoneDate,
  toMilestoneDateString,
} from "@/lib/priority-playbook/milestone-dates"
import { CalendarIcon } from "lucide-react"

interface MilestoneDatePickerProps {
  value?: string
  onChange: (value: string) => void
  className?: string
  emptyLabel?: string
}

export function MilestoneDatePicker({
  value,
  onChange,
  className,
  emptyLabel = "Pick a date",
}: MilestoneDatePickerProps) {
  const [open, setOpen] = useState(false)
  const selectedDate = parseMilestoneDate(value)
  const hasDate = !!selectedDate

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-10 min-w-[10.5rem] justify-start gap-2 px-3 font-normal",
            !hasDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 opacity-70" />
          <span className="truncate">
            {hasDate ? formatMilestoneButtonDate(value) : emptyLabel}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end" sideOffset={6}>
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate}
          onSelect={(date) => {
            if (date) {
              onChange(toMilestoneDateString(date))
              setOpen(false)
            }
          }}
          initialFocus
        />
        {hasDate && (
          <div className="border-t px-3 py-2 flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-slate-600"
              onClick={() => {
                onChange("")
                setOpen(false)
              }}
            >
              Clear
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
