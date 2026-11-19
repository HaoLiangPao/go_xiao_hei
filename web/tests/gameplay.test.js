import { test } from "node:test";
import assert from "node:assert/strict";
import {
  completedMemories,
  memories,
  regionPieces,
  snapRadius,
  targetPoint,
  withinSnap,
  floatingSize,
} from "../src/gameplay.js";
import { levels, makePieces } from "../src/geometry.js";
for (const [name, { cols, rows }] of Object.entries(levels)) {
  test(`${name}: story regions require their own full set of pieces`, () => {
    assert.equal(completedMemories(new Set(), cols, rows).length, 0);
    assert.equal(
      completedMemories(
        new Set(Array.from({ length: cols * rows }, (_, i) => i)),
        cols,
        rows,
      ).length,
      memories.length,
    );
    for (const memory of memories) {
      const required = regionPieces(memory, cols, rows);
      assert.ok(required.length > 0);
      assert.ok(required.every((id) => id >= 0 && id < cols * rows));
      assert.ok(
        !completedMemories(new Set(required.slice(1)), cols, rows).some(
          (item) => item.id === memory.id,
        ),
      );
      assert.ok(
        completedMemories(new Set(required), cols, rows).some(
          (item) => item.id === memory.id,
        ),
      );
    }
  });
  test(`${name}: screen-space snap and floating crop share one scale`, () => {
    const rect = { left: 40, top: 60, width: 216, height: 411.4 },
      piece = makePieces(cols, rows, "organic")[cols + 1],
      point = targetPoint(piece, cols, rows, rect),
      radius = snapRadius(cols, rows, rect);
    assert.equal(point.x, 40 + (1.5 * 216) / cols);
    assert.equal(point.y, 60 + (1.5 * 411.4) / rows);
    assert.ok(
      withinSnap({ x: point.x + radius - 0.01, y: point.y }, point, radius),
    );
    assert.ok(
      !withinSnap({ x: point.x + radius + 0.01, y: point.y }, point, radius),
    );
    assert.ok(radius >= 14 && radius <= 34);
    const size = floatingSize(piece, rect),
      [, , vw, vh] = piece.viewBox.split(" ").map(Number);
    assert.ok(Math.abs(size.width / vw - size.height / vh) < 1e-8);
  });
}
test("snap distance does not accept a different piece location", () => {
  const rect = { left: 0, top: 0, width: 216, height: 411.4 },
    pieces = makePieces(6, 8, "classic"),
    radius = snapRadius(6, 8, rect);
  assert.ok(
    !withinSnap(
      targetPoint(pieces[1], 6, 8, rect),
      targetPoint(pieces[0], 6, 8, rect),
      radius,
    ),
  );
});
