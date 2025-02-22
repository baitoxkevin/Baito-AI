import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPicker } from '../ui/color-picker';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';

describe('ColorPicker', () => {
  it('renders with initial color', () => {
    const handleChange = vi.fn();
    render(<ColorPicker value="#FF5733" onChange={handleChange} />);
    const button = screen.getByRole('button');
    expect(button).toHaveStyle({ backgroundColor: '#FF5733' });
  });

  it('opens color palette on click', () => {
    const handleChange = vi.fn();
    render(<ColorPicker value="#FF5733" onChange={handleChange} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('calls onChange with selected color', () => {
    const handleChange = vi.fn();
    render(<ColorPicker value="#FF5733" onChange={handleChange} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    const colorOption = screen.getAllByRole('button')[1]; // Get first color option
    fireEvent.click(colorOption);
    expect(handleChange).toHaveBeenCalled();
  });
});
