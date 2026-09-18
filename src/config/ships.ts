export type ShipKind = 'steamship' | 'turtle' | 'viking';

export interface ShipConfig {
  label: string;
  maxSpeed: number;
  acceleration: number;
  reverseSpeed: number;
  turnRate: number;
  drag: number;
  color: number;
  stats: [number, number, number];
}

export const SHIPS: Record<ShipKind, ShipConfig> = {
  steamship: { label: 'Steamship', maxSpeed: 20, acceleration: 6, reverseSpeed: 5, turnRate: 0.55, drag: 1.1, color: 0x263640, stats: [3, 2, 2] },
  turtle: { label: 'Turtle Ship', maxSpeed: 16, acceleration: 6, reverseSpeed: 5, turnRate: 0.78, drag: 1.25, color: 0x694226, stats: [2, 2, 3] },
  viking: { label: 'Viking Ship', maxSpeed: 23, acceleration: 9, reverseSpeed: 6, turnRate: 0.9, drag: 1.4, color: 0x8a542e, stats: [4, 4, 4] }
};
