import type { Photo } from "@/types"

// ─── Photo scoring inputs ─────────────────────────────────────────────────────

export interface ScoringInput {
  width: number
  height: number
  aspectRatio: number
  fileSize: number
  orientation: "landscape" | "portrait" | "square"
}

export interface ScoringStrategy {
  score(photos: ScoringInput[]): number[] | Promise<number[]>
}

// ─── Heuristic Scorer ─────────────────────────────────────────────────────────

const GOLDEN_RATIOS = [16 / 9, 4 / 3, 3 / 2, 1, 2 / 3, 3 / 4, 9 / 16]
const MAX_PIXELS = 12_000_000 // 12 MP
const MAX_FILE_SIZE = 8_000_000 // 8 MB

function resolutionScore(p: ScoringInput): number {
  const pixels = p.width * p.height
  return Math.min(1, Math.log(pixels + 1) / Math.log(MAX_PIXELS))
}

function aspectRatioScore(p: ScoringInput): number {
  const minDist = Math.min(
    ...GOLDEN_RATIOS.map((r) => Math.abs(p.aspectRatio - r))
  )
  return Math.max(0, 1 - minDist / 0.5)
}

function fileSizeScore(p: ScoringInput): number {
  return Math.min(1, Math.log(p.fileSize + 1) / Math.log(MAX_FILE_SIZE))
}

// Photos that add orientation variety to the collection receive a small bonus.
function orientationBonuses(photos: ScoringInput[]): number[] {
  const landscapes = photos.filter((p) => p.orientation === "landscape").length
  const portraits = photos.filter((p) => p.orientation === "portrait").length
  const dominant: string = landscapes >= portraits ? "landscape" : "portrait"
  return photos.map((p) =>
    p.orientation !== dominant && p.orientation !== "square" ? 0.8 : 0.4
  )
}

export class HeuristicScorer implements ScoringStrategy {
  score(photos: ScoringInput[]): number[] {
    if (photos.length === 0) return []
    const orientBonuses = orientationBonuses(photos)
    return photos.map((photo, i) => {
      const resScore = resolutionScore(photo)
      const aspectScore = aspectRatioScore(photo)
      const fileScore = fileSizeScore(photo)
      const orientScore = orientBonuses[i]
      // Weighted: resolution 35%, aspect ratio 30%, file size 20%, orientation 15%
      return (
        0.35 * resScore +
        0.3 * aspectScore +
        0.2 * fileScore +
        0.15 * orientScore
      )
    })
  }
}

export const defaultScorer: ScoringStrategy = new HeuristicScorer()

export async function scorePhotos(
  photos: Photo[],
  scorer: ScoringStrategy = defaultScorer
): Promise<Photo[]> {
  const inputs: ScoringInput[] = photos.map((p) => ({
    width: p.width,
    height: p.height,
    aspectRatio: p.aspectRatio,
    fileSize: p.fileSize,
    orientation: p.orientation,
  }))
  const scores = await Promise.resolve(scorer.score(inputs))
  return photos.map((p, i) => ({ ...p, score: scores[i] ?? 0 }))
}
