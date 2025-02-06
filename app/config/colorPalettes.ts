export type ColorPalette = {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    muted: string;
  };
};

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'ocean-depths',
    name: 'Ocean Depths',
    colors: {
      primary: '#0EA5E9',    // Bright blue
      secondary: '#FFA726',  // Warm orange
      accent: '#E0F2FE',     // Soft sky blue
      muted: 'rgba(14, 165, 233, 0.2)',
    },
  },
  {
    id: 'forest-haven',
    name: 'Forest Haven',
    colors: {
      primary: '#059669',    // Emerald green
      secondary: '#9333EA',  // Rich purple
      accent: '#86EFAC',     // Mint green
      muted: 'rgba(5, 150, 105, 0.2)',
    },
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    colors: {
      primary: '#F97316',    // Vibrant orange
      secondary: '#2563EB',  // Royal blue
      accent: '#FED7AA',     // Soft peach
      muted: 'rgba(249, 115, 22, 0.2)',
    },
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    colors: {
      primary: '#7C3AED',    // Bright purple
      secondary: '#FBBF24',  // Golden yellow
      accent: '#DDD6FE',     // Soft lavender
      muted: 'rgba(124, 58, 237, 0.2)',
    },
  },
  {
    id: 'ruby-fusion',
    name: 'Ruby Fusion',
    colors: {
      primary: '#DC2626',    // Vibrant red
      secondary: '#0891B2',  // Teal blue
      accent: '#FEE2E2',     // Soft pink
      muted: 'rgba(220, 38, 38, 0.2)',
    },
  },
  {
    id: 'arctic-aurora',
    name: 'Arctic Aurora',
    colors: {
      primary: '#2DD4BF',    // Bright teal
      secondary: '#E11D48',  // Rose red
      accent: '#CCFBF1',     // Soft mint
      muted: 'rgba(45, 212, 191, 0.2)',
    },
  },
  {
    id: 'golden-dawn',
    name: 'Golden Dawn',
    colors: {
      primary: '#D97706',    // Rich amber
      secondary: '#4F46E5',  // Electric indigo
      accent: '#FEF3C7',     // Soft yellow
      muted: 'rgba(217, 119, 6, 0.2)',
    },
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    colors: {
      primary: '#DB2777',    // Bright pink
      secondary: '#059669',  // Emerald green
      accent: '#FCE7F3',     // Soft pink
      muted: 'rgba(219, 39, 119, 0.2)',
    },
  },
  {
    id: 'electric-indigo',
    name: 'Electric Indigo',
    colors: {
      primary: '#4F46E5',    // Bright indigo
      secondary: '#EA580C',  // Burnt orange
      accent: '#E0E7FF',     // Soft periwinkle
      muted: 'rgba(79, 70, 229, 0.2)',
    },
  },
  {
    id: 'midnight-sea',
    name: 'Midnight Sea',
    colors: {
      primary: '#1E40AF',    // Rich blue
      secondary: '#B45309',  // Bronze
      accent: '#BFDBFE',     // Soft sky blue
      muted: 'rgba(30, 64, 175, 0.2)',
    },
  },
]; 