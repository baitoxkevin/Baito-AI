export const PROJECT_COLORS = {
  red: '#DC2127',      // RGB: 220,33,39
  lightRed: '#FF887C', // RGB: 255,136,124
  orange: '#FFB878',   // RGB: 255,184,120
  yellow: '#FBD75B',   // RGB: 251,215,91
  teal: '#7AE7BF',     // RGB: 122,231,191
  green: '#51B749',    // RGB: 81,183,73
  cyan: '#46D6DB',     // RGB: 70,214,219
  blue: '#5484ED',     // RGB: 84,132,237
  lightBlue: '#A4BDFC', // RGB: 164,189,252
  lavender: '#DBADFF', // RGB: 219,173,255
  grey: '#E1E1E1'      // RGB: 225,225,225
} as const;

export type ProjectColor = keyof typeof PROJECT_COLORS;
export type ProjectColorValue = typeof PROJECT_COLORS[ProjectColor];

// Helper to get color with opacity
export const getColorWithOpacity = (color: string, opacity: number) => {
  return `${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
};
