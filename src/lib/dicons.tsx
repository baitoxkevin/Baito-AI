// This is a simplified version of DIcons for demo purposes
import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  strokeWidth?: number;
}

const Shapes = (props: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={props.strokeWidth || 2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M10.43 19 5 13.57a1 1 0 0 1 0-1.42l5.43-5.43a1 1 0 0 1 1.42 0L17.28 12a1 1 0 0 1 0 1.42L11.85 19a1 1 0 0 1-1.42 0Z" />
    <path d="M6 6h.01" />
    <path d="M6 18h.01" />
    <path d="M18 18h.01" />
    <path d="M18 6h.01" />
  </svg>
);

const ArrowRight = (props: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={props.strokeWidth || 2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const Plus = (props: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={props.strokeWidth || 2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

export const DIcons = {
  Shapes,
  ArrowRight,
  Plus,
};