import * as React from 'react'
import { Button } from "./button"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

const PROJECT_COLORS = [
  '#FF5733', '#33FF57', '#3357FF', '#FF33F5',
  '#33FFF5', '#F5FF33', '#FF3333', '#33FF33'
]

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
      <PopoverContent className="w-[200px] p-2">
        <div className="grid grid-cols-4 gap-2">
          {PROJECT_COLORS.map(color => (
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
