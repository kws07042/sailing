export type GraphicsQuality = 'low' | 'medium' | 'high';

export const GRAPHICS = {
  low: { pixelRatio: 1, viewDistance: 520, rain: 240, shadows: false, islandDetail: 0.65 },
  medium: { pixelRatio: 1.5, viewDistance: 760, rain: 520, shadows: false, islandDetail: 1 },
  high: { pixelRatio: 2, viewDistance: 980, rain: 900, shadows: true, islandDetail: 1.25 }
} as const;
