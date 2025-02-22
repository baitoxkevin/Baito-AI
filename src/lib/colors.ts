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

// Verify that hex values match RGB values
// Used for documentation and verification
export const verifyColors = {
  red: { hex: '#DC2127', rgb: [220, 33, 39] },
  lightRed: { hex: '#FF887C', rgb: [255, 136, 124] },
  orange: { hex: '#FFB878', rgb: [255, 184, 120] },
  yellow: { hex: '#FBD75B', rgb: [251, 215, 91] },
  teal: { hex: '#7AE7BF', rgb: [122, 231, 191] },
  green: { hex: '#51B749', rgb: [81, 183, 73] },
  cyan: { hex: '#46D6DB', rgb: [70, 214, 219] },
  blue: { hex: '#5484ED', rgb: [84, 132, 237] },
  lightBlue: { hex: '#A4BDFC', rgb: [164, 189, 252] },
  lavender: { hex: '#DBADFF', rgb: [219, 173, 255] },
  grey: { hex: '#E1E1E1', rgb: [225, 225, 225] }
};

export type ProjectColor = keyof typeof PROJECT_COLORS;
export type ProjectColorValue = typeof PROJECT_COLORS[ProjectColor];

// Helper to get color with opacity
export const getColorWithOpacity = (color: string, opacity: number) => {
  return `${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
};
