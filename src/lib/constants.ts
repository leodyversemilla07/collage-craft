import type { CanvasPreset, CollageDensity, CollageSettings } from '@/types';

export const CANVAS_PRESETS: CanvasPreset[] = [
  { id: 'square', label: 'Square 1:1', width: 1080, height: 1080 },
  { id: 'landscape', label: 'Landscape 16:9', width: 1600, height: 900 },
  { id: 'portrait', label: 'Portrait 4:5', width: 864, height: 1080 },
  { id: 'wide', label: 'Wide 3:1', width: 1500, height: 500 },
];

export const DENSITY_GAPS: Record<CollageDensity, number> = {
  loose: 16,
  normal: 8,
  tight: 3,
};

export const DEFAULT_SETTINGS: CollageSettings = {
  style: 'magazine',
  canvasPreset: CANVAS_PRESETS[0],
  density: 'normal',
  title: '',
};
