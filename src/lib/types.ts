export type Unit = 'km' | 'mile';
export type Strategy = 'even' | 'negative' | 'custom';
export type NegativePct = 1 | 3 | 5;

export interface Segment {
  id: number;
  label: string;
  distanceKm: number;
  paceSecPerKm: number;
}
