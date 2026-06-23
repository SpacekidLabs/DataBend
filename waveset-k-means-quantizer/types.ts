
export interface Waveset {
  id: number;
  start: number;
  end: number;
  length: number;
  rms: number;
  pcm: Float32Array;
  clusterId?: number;
  normalizedLength?: number;
  normalizedRms?: number;
}

export interface ProcessingState {
  isProcessing: boolean;
  stage: string;
  progress: number;
  error: string | null;
}

export type SegmentationMethod = 'WAVESET' | 'FFT' | 'DWT';
export type ClusteringMethod = 'KMEANS' | 'FCM' | 'BIRCH' | 'OPTICS' | 'SPECTRAL';

export interface ProcessingParams {
  clustersPerSecond: number;
  featureWeight: number; // Renamed from lengthWeight
  segmentation: SegmentationMethod;
  clustering: ClusteringMethod;
}

export interface ClusterPoint {
  length: number;
  rms: number;
  clusterId: number;
  originalIndex: number;
}
