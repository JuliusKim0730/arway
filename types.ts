
export interface Destination {
  id: string;
  name: string;
  description: string;
  distance: number;
}

export type NavStatus = '맞는 중' | '틀림' | '도착 근처';
