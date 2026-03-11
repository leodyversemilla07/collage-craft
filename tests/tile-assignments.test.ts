import { describe, expect, test } from "bun:test"

import {
  applyAssignedPhotoIds,
  getTileAssignmentSignature,
  swapAssignedPhotoIds,
} from "../src/lib/tile-assignments"
import type { CollageLayout } from "../src/types"

const layout: CollageLayout = {
  canvasWidth: 1200,
  canvasHeight: 900,
  tiles: [
    { photoId: "a", x: 0, y: 0, width: 400, height: 300 },
    { photoId: "b", x: 400, y: 0, width: 400, height: 300 },
    { photoId: "c", x: 800, y: 0, width: 400, height: 300 },
  ],
}

describe("tile assignments", () => {
  test("creates a stable signature from the current tile order", () => {
    expect(getTileAssignmentSignature(layout)).toBe("a|b|c")
    expect(getTileAssignmentSignature(null)).toBe("")
  })

  test("swaps two assigned photo ids", () => {
    expect(swapAssignedPhotoIds(["a", "b", "c"], 0, 2)).toEqual([
      "c",
      "b",
      "a",
    ])
  })

  test("applies assigned photo ids without changing tile geometry", () => {
    const assigned = applyAssignedPhotoIds(layout, ["c", "b", "a"])

    expect(assigned.tiles.map((tile) => tile.photoId)).toEqual(["c", "b", "a"])
    expect(assigned.tiles.map((tile) => [tile.x, tile.y, tile.width, tile.height]))
      .toEqual(layout.tiles.map((tile) => [tile.x, tile.y, tile.width, tile.height]))
  })
})
