import type { Photo, LayoutTile, CollageLayout, CollageSettings } from '@/types';
import { DENSITY_GAPS } from './constants';

// ─── Seed-based pseudo-random helpers ────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = Math.imul(1664525, s) + 1013904223;
    return (s >>> 0) / 0xffffffff;
  };
}

function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  const rand = seededRandom(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Order photos for layout: keep top 3 by score in position, shuffle the rest
 * using the seed so Regenerate produces different arrangements.
 */
function orderForLayout(photos: Photo[], seed: number): Photo[] {
  const sorted = [...photos].sort((a, b) => b.score - a.score);
  const featured = sorted.slice(0, Math.min(3, sorted.length));
  const rest = shuffleWithSeed(sorted.slice(featured.length), seed);
  return [...featured, ...rest];
}

function gridDimensions(n: number): { cols: number; rows: number } {
  let cols: number;
  if (n === 1) cols = 1;
  else if (n === 2) cols = 2;
  else if (n <= 4) cols = 2;
  else if (n <= 9) cols = 3;
  else cols = 4;
  return { cols, rows: Math.ceil(n / cols) };
}

// ─── Grid Layout ──────────────────────────────────────────────────────────────

function generateGridLayout(
  photos: Photo[],
  cW: number,
  cH: number,
  gap: number,
): LayoutTile[] {
  const n = photos.length;
  if (n === 0) return [];

  const { cols, rows } = gridDimensions(n);
  const cellW = (cW - gap * (cols + 1)) / cols;
  const cellH = (cH - gap * (rows + 1)) / rows;

  return photos.slice(0, cols * rows).map((photo, i) => ({
    photoId: photo.id,
    x: gap + (i % cols) * (cellW + gap),
    y: gap + Math.floor(i / cols) * (cellH + gap),
    width: cellW,
    height: cellH,
  }));
}

// ─── Magazine Layout ──────────────────────────────────────────────────────────

function generateMagazineLayout(
  photos: Photo[],
  cW: number,
  cH: number,
  gap: number,
): LayoutTile[] {
  const n = photos.length;
  if (n === 0) return [];

  if (n === 1) {
    return [{ photoId: photos[0].id, x: gap, y: gap, width: cW - 2 * gap, height: cH - 2 * gap }];
  }

  if (n === 2) {
    const heroW = Math.round((cW - 3 * gap) * 0.6);
    const secondW = cW - 3 * gap - heroW;
    return [
      { photoId: photos[0].id, x: gap, y: gap, width: heroW, height: cH - 2 * gap },
      { photoId: photos[1].id, x: 2 * gap + heroW, y: gap, width: secondW, height: cH - 2 * gap },
    ];
  }

  const tiles: LayoutTile[] = [];
  const footerPhotos = photos.slice(3);
  const hasFooter = footerPhotos.length > 0;

  const footerH = hasFooter ? Math.round(cH * 0.27) : 0;
  const topH = cH - 2 * gap - (hasFooter ? gap + footerH : 0);
  const heroW = Math.round((cW - 3 * gap) * 0.58);
  const secondW = cW - 3 * gap - heroW;
  const secondH1 = Math.round((topH - gap) / 2);
  const secondH2 = topH - gap - secondH1;

  tiles.push({ photoId: photos[0].id, x: gap, y: gap, width: heroW, height: topH });

  if (photos[1]) {
    tiles.push({
      photoId: photos[1].id,
      x: 2 * gap + heroW,
      y: gap,
      width: secondW,
      height: secondH1,
    });
  }

  if (photos[2]) {
    tiles.push({
      photoId: photos[2].id,
      x: 2 * gap + heroW,
      y: gap + secondH1 + gap,
      width: secondW,
      height: secondH2,
    });
  }

  if (hasFooter) {
    const stripY = gap + topH + gap;
    const stripCellW = (cW - gap * (footerPhotos.length + 1)) / footerPhotos.length;
    footerPhotos.forEach((photo, i) => {
      tiles.push({
        photoId: photo.id,
        x: gap + i * (stripCellW + gap),
        y: stripY,
        width: stripCellW,
        height: footerH,
      });
    });
  }

  return tiles;
}

// ─── Scrapbook Layout ─────────────────────────────────────────────────────────

function generateScrapbookLayout(
  photos: Photo[],
  cW: number,
  cH: number,
  gap: number,
  seed: number,
): LayoutTile[] {
  const n = photos.length;
  if (n === 0) return [];

  const rand = seededRandom(seed + 777);
  const { cols, rows } = gridDimensions(n);
  const cellW = (cW - gap * (cols + 1)) / cols;
  const cellH = (cH - gap * (rows + 1)) / rows;

  return photos.slice(0, cols * rows).map((photo, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    // Higher-ranked photos are moderately larger
    const rank = i / Math.max(1, n - 1);
    const scale = 1 + (1 - rank) * 0.18 - rank * 0.08;

    const baseX = gap + col * (cellW + gap);
    const baseY = gap + row * (cellH + gap);
    const cx = baseX + cellW / 2;
    const cy = baseY + cellH / 2;
    const w = cellW * scale;
    const h = cellH * scale;

    // Randomized rotation: top photos rotate less
    const maxRot = 7;
    const rotation = (rand() * 2 - 1) * maxRot * (0.3 + rank * 0.7);

    return {
      photoId: photo.id,
      x: cx - w / 2,
      y: cy - h / 2,
      width: w,
      height: h,
      rotation,
    };
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function generateLayout(
  photos: Photo[],
  settings: CollageSettings,
  seed: number = 1,
): CollageLayout {
  const gap = DENSITY_GAPS[settings.density];
  const { width: cW, height: cH } = settings.canvasPreset;
  const ordered = orderForLayout(photos, seed);

  const tiles: LayoutTile[] =
    settings.style === 'grid'
      ? generateGridLayout(ordered, cW, cH, gap)
      : settings.style === 'magazine'
        ? generateMagazineLayout(ordered, cW, cH, gap)
        : generateScrapbookLayout(ordered, cW, cH, gap, seed);

  return { tiles, canvasWidth: cW, canvasHeight: cH };
}
