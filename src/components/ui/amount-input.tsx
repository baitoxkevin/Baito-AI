/**
 * 安全的金额输入组件
 * 
 * 特性：
 * - 防止自动全选
 * - 防止误触删除
 * - 支持金额格式化
 * - 保护已输入的值
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export interface AmountInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string | number
  onChange?: (value: string) => void
  currency?: string
  preventSelectAll?: boolean
  formatOnBlur?: boolean
  allowNegative?: boolean
  maxValue?: number
  minValue?: number
}

export const AmountInput = React.forwardRef<HTMLInputElement, AmountInputProps>(({
  value = "",
  onChange,
  currency = "RM",
  preventSelectAll = true,
  formatOnBlur = true,
  allowNegative = false,
  maxValue,
  minValue = 0,
  className,
  onFocus,
  onClick,
  onKeyDown,
  ...props
}, ref) => {
  const [internalValue, setInternalValue] = React.useState(String(value))
  const [lastValidValue, setLastValidValue] = React.useState(String(value))
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useImperativeHandle(ref, () => inputRef.current!, [])

  React.useEffect(() => {
    setInternalValue(String(value))
    setLastValidValue(String(value))
  }, [value])

  // 防止自动全选
  const handleFocus = React.useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (preventSelectAll) {
      // 将光标移动到末尾而不是全选
      const length = e.target.value.length
      setTimeout(() => {
        e.target.setSelectionRange(length, length)
      }, 0)
    }
    onFocus?.(e)
  }, [preventSelectAll, onFocus])

  // 防止点击时全选
  const handleClick = React.useCallback((e: React.MouseEvent<HTMLInputElement>) => {
    if (preventSelectAll) {
      e.stopPropagation()
      // 防止选中全部文本
      const target = e.target as HTMLInputElement
      if (target.selectionStart === 0 && target.selectionEnd === target.value.length) {
        const pos = target.value.length
        target.setSelectionRange(pos, pos)
      }
    }
    onClick?.(e)
  }, [preventSelectAll, onClick])

  // 处理输入变化
  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    
    // 只允许数字、小数点和负号（如果允许）
    const regex = allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/
    
    if (regex.test(newValue) || newValue === "") {
      // 检查最大值和最小值
      const numValue = parseFloat(newValue)
      
      if (newValue === "" || newValue === "-" || newValue === "-." || newValue === ".") {
        setInternalValue(newValue)
        onChange?.(newValue)
      } else if (!isNaN(numValue)) {
        if ((maxValue !== undefined && numValue > maxValue) || 
            (minValue !== undefined && numValue < minValue)) {
          // 超出范围，保持原值
          return
        }
        setInternalValue(newValue)
        setLastValidValue(newValue)
        onChange?.(newValue)
      }
    }
  }, [allowNegative, maxValue, minValue, onChange])

  // Prevent accidental deletion - requires confirmation to delete
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement
    const value = target.value
    
    // If delete key is pressed and will clear the entire value, require confirmation
    if ((e.key === 'Delete' || e.key === 'Backspace')) {
      const selectionStart = target.selectionStart || 0
      const selectionEnd = target.selectionEnd || 0
      
      // Check if it will delete all content
      if ((selectionStart === 0 && selectionEnd === value.length) || 
          (value.length === 1 && !e.ctrlKey && !e.metaKey)) {
        // Can optionally add confirmation logic
        // Here we just prevent quick deletion
        if (!e.shiftKey) {
          // Need to hold Shift to delete all
          e.preventDefault()
          // Only delete one character
          if (e.key === 'Backspace' && selectionStart > 0) {
            const newValue = value.slice(0, selectionStart - 1) + value.slice(selectionEnd)
            setInternalValue(newValue)
            onChange?.(newValue)
            setTimeout(() => {
              target.setSelectionRange(selectionStart - 1, selectionStart - 1)
            }, 0)
          }
        }
      }
    }
    
    onKeyDown?.(e)
  }, [onChange, onKeyDown])

  // 格式化显示
  const handleBlur = React.useCallback(() => {
    if (formatOnBlur && internalValue) {
      const numValue = parseFloat(internalValue)
      if (!isNaN(numValue)) {
        const formatted = numValue.toFixed(2)
        setInternalValue(formatted)
        onChange?.(formatted)
      }
    }
  }, [formatOnBlur, internalValue, onChange])

  return (
    <div className="relative">
      {currency && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium pointer-events-none">
          {currency}
        </span>
      )}
      <Input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={internalValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={cn(
          currency && "pl-10",
          "font-medium",
          className
        )}
        {...props}
      />
    </div>
  )
})

AmountInput.displayName = "AmountInput"

// 导出便捷版本
export const SafeAmountInput = React.forwardRef<HTMLInputElement, AmountInputProps>((props, ref) => {
  return <AmountInput {...props} ref={ref} preventSelectAll={true} />
})