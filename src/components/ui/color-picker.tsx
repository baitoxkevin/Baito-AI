import * as React from 'react'
import { Button } from "./button"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { PROJECT_COLORS } from '@/lib/colors'

const COLOR_VALUES = Object.values(PROJECT_COLORS)

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="w-[60px] h-[30px]"
          style={{ backgroundColor: value }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-2">
        <div className="grid grid-cols-4 gap-2">
          {COLOR_VALUES.map(color => (
            <Button
              key={color}
              className="w-[30px] h-[30px] p-0"
              style={{ backgroundColor: color }}
              onClick={() => onChange(color)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
