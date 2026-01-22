
export interface Voice {
  id: string;
  name: string;
  description: string;
  apiName: string; 
}

export type Speed = 'slow' | 'normal' | 'fast';
export type Pitch = 'low' | 'medium' | 'high';
export type AudioFormat = 'mp3' | 'wav';
