/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AIAssistant from '../AIAssistant';

describe('AIAssistant', () => {
  it('renders chat button when closed', () => {
    render(<AIAssistant />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
