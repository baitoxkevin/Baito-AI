import React, { useState } from 'react';
import { ColorPicker } from '../components/ui/color-picker';

export function TestColorPicker() {
  const [color, setColor] = useState('#FF5733');

  return (
    <div className="flex h-screen items-center justify-center gap-4">
      <div className="flex flex-col gap-4 items-center">
        <h1 className="text-2xl font-bold">Color Picker Test</h1>
        <ColorPicker value={color} onChange={setColor} />
        <div className="text-sm">Selected color: {color}</div>
      </div>
    </div>
  );
}
