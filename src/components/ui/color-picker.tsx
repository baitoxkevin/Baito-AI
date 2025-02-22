import * as React from 'react'
import { Button } from "./button"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { PROJECT_COLORS, ProjectColorValue } from '@/lib/colors';

const COLOR_VALUES = Object.entries(PROJECT_COLORS);

interface ColorPickerProps {
  value: ProjectColorValue
  onChange: (color: ProjectColorValue) => void
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
          {COLOR_VALUES.map(([name, color]) => (
            <Button
              key={name}
              className="w-[30px] h-[30px] p-0"
              style={{ backgroundColor: color }}
              onClick={() => onChange(color)}
              title={name}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
