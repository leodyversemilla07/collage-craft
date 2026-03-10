import { describe, expect, test } from "bun:test"

import {
  HeuristicScorer,
  scorePhotos,
  type ScoringStrategy,
} from "../src/lib/scoring"
import type { Photo } from "../src/types"

function createPhoto(overrides: Partial<Photo> = {}): Photo {
  return {
    id: overrides.id ?? "photo-1",
    file:
      overrides.file ??
      new File(["image"], overrides.name ?? "photo-1.jpg", {
        type: "image/jpeg",
      }),
    name: overrides.name ?? "photo-1.jpg",
    previewUrl: overrides.previewUrl ?? "blob:test-photo-1",
    width: overrides.width ?? 1200,
    height: overrides.height ?? 800,
    aspectRatio: overrides.aspectRatio ?? 1200 / 800,
    orientation: overrides.orientation ?? "landscape",
    fileSize: overrides.fileSize ?? 1_000_000,
    score: overrides.score ?? 0,
  }
}

describe("HeuristicScorer", () => {
  test("gives higher scores to higher-quality photos", () => {
    const scorer = new HeuristicScorer()

    const scores = scorer.score([
      {
        width: 600,
        height: 600,
        aspectRatio: 1,
        fileSize: 200_000,
        orientation: "landscape",
      },
      {
        width: 4000,
        height: 3000,
        aspectRatio: 4 / 3,
        fileSize: 8_000_000,
        orientation: "portrait",
      },
    ])

    expect(scores).toHaveLength(2)
    expect(scores[1]).toBeGreaterThan(scores[0])
  })

  test("rewards orientation variety when one orientation dominates", () => {
    const scorer = new HeuristicScorer()

    const [landscapeScore, secondLandscapeScore, portraitScore] = scorer.score([
      {
        width: 2000,
        height: 1500,
        aspectRatio: 4 / 3,
        fileSize: 2_000_000,
        orientation: "landscape",
      },
      {
        width: 2000,
        height: 1500,
        aspectRatio: 4 / 3,
        fileSize: 2_000_000,
        orientation: "landscape",
      },
      {
        width: 2000,
        height: 1500,
        aspectRatio: 4 / 3,
        fileSize: 2_000_000,
        orientation: "portrait",
      },
    ])

    expect(portraitScore).toBeGreaterThan(landscapeScore)
    expect(portraitScore).toBeGreaterThan(secondLandscapeScore)
  })

  test("returns an empty list for empty input", () => {
    const scorer = new HeuristicScorer()

    expect(scorer.score([])).toEqual([])
  })
})

describe("scorePhotos", () => {
  test("adds scorer output to each photo", async () => {
    const photos = [
      createPhoto({ id: "a", name: "a.jpg" }),
      createPhoto({ id: "b", name: "b.jpg" }),
    ]

    const scorer: ScoringStrategy = {
      score: () => [0.25, 0.75],
    }

    const scored = await scorePhotos(photos, scorer)

    expect(scored.map((photo) => photo.score)).toEqual([0.25, 0.75])
    expect(scored[0].id).toBe("a")
    expect(scored[1].id).toBe("b")
  })

  test("supports async scoring strategies", async () => {
    const photos = [createPhoto({ id: "async-photo" })]

    const scorer: ScoringStrategy = {
      score: async () => [0.9],
    }

    const scored = await scorePhotos(photos, scorer)

    expect(scored[0].score).toBe(0.9)
  })

  test("defaults missing scores to zero", async () => {
    const photos = [createPhoto({ id: "a" }), createPhoto({ id: "b" })]

    const scorer: ScoringStrategy = {
      score: () => [0.6],
    }

    const scored = await scorePhotos(photos, scorer)

    expect(scored.map((photo) => photo.score)).toEqual([0.6, 0])
  })
})
