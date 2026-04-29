export type Unit = 'km' | 'mile';
export type Strategy = 'even' | 'negative' | 'custom';
export type NegativePct = 0.5 | 1 | 2;

export interface Segment {
  id: number;
  label: string;
  distanceKm: number;
  paceSecPerKm: number;
}
