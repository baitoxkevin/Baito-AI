import { useState } from 'react';
import { ColorPicker } from '../components/ui/color-picker';
import { PROJECT_COLORS } from '@/lib/colors';

export function TestColorPicker() {
  const [color, setColor] = useState(PROJECT_COLORS.blue);

  return (
    <div className="flex h-screen items-center justify-center gap-4">
      <div className="flex flex-col gap-4 items-center">
        <h1 className="text-2xl font-bold">Color Picker Test</h1>
        <ColorPicker value={color} onChange={setColor} />
        <div className="text-sm space-y-1">
          <div>Selected color: {color}</div>
          <div>RGB: {color.match(/\w\w/g)?.map(hex => parseInt(hex, 16)).join(',')}</div>
        </div>
      </div>
    </div>
  );
}
