/**
 * Unified Date Picker Component
 *
 * Features:
 * - Date picker stays open after clicking the button
 * - Automatically closes after selecting a date
 * - Won't accidentally close when clicking elsewhere
 * - Fully compatible with existing UI styles
 *
 * Usage:
 * import { DatePicker } from "@/components/ui/date-picker"
 * 
 * <DatePicker
 *   date={date}
 *   onDateChange={setDate}
 *   placeholder="Select date"
 * />
 */

import * as React from "react"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  buttonClassName?: string
  disabled?: boolean
  dateFormat?: string
  align?: "start" | "center" | "end"
  showIcon?: boolean
  locale?: Locale
  fromDate?: Date  // Minimum selectable date
  toDate?: Date    // Maximum selectable date
  disabledDays?: any  // Custom disabled days matcher
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
  buttonClassName,
  disabled = false,
  dateFormat = "PPP",
  align = "start",
  showIcon = true,
  locale = enUS,
  fromDate,
  toDate,
  disabledDays
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)

  // Sync with external date prop
  React.useEffect(() => {
    setSelectedDate(date)
  }, [date])

  const handleSelect = React.useCallback((newDate: Date | undefined) => {
    if (newDate) {
      setSelectedDate(newDate)
      onDateChange?.(newDate)
      // Delay closing after selecting a date to ensure smooth animation
      setTimeout(() => setOpen(false), 150)
    }
  }, [onDateChange])

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            buttonClassName || className
          )}
        >
          {showIcon && <CalendarIcon className="mr-2 h-4 w-4" />}
          {selectedDate ? (
            format(selectedDate, dateFormat, { locale })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
          locale={locale}
          fromDate={fromDate}
          toDate={toDate}
          disabled={disabledDays}
        />
      </PopoverContent>
    </Popover>
  )
}

// Export alias for easy migration
export const DatePickerStable = DatePicker

// Compatible with old naming
export default DatePicker