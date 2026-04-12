export type Unit = 'km' | 'mile';
export type Strategy = 'even' | 'negative' | 'positive' | 'custom';

export interface Segment {
  id: number;
  label: string;
  distanceKm: number;
  paceSecPerKm: number;
}
