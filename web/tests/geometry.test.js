import { test } from "node:test";
import assert from "node:assert/strict";
import {
  makePieces,
  levels,
  reverseEdge,
  edgePath,
  readProgress,
} from "../src/geometry.js";
for (const [level, { cols, rows }] of Object.entries(levels))
  for (const shape of ["flat", "classic", "organic"])
    test(`${level}/${shape}: adjoining cuts match exactly`, () => {
      const pieces = makePieces(cols, rows, shape);
      assert.equal(pieces.length, cols * rows);
      for (const p of pieces) {
        assert.ok(!/NaN|undefined/.test(p.path));
        if (p.x < cols - 1)
          assert.equal(
            edgePath(p.edges[1]),
            edgePath(reverseEdge(pieces[p.id + 1].edges[3])),
          );
        if (p.y < rows - 1)
          assert.equal(
            edgePath(p.edges[2]),
            edgePath(reverseEdge(pieces[p.id + cols].edges[0])),
          );
      }
      assert.deepEqual(pieces, makePieces(cols, rows, shape));
    });
test("invalid stored IDs are discarded", () => {
  assert.deepEqual(
    [
      ...readProgress(
        { getItem: () => JSON.stringify([0, 0, 11, 12, -1, "3", null]) },
        "key",
        12,
      ),
    ],
    [0, 11],
  );
  assert.equal(readProgress({ getItem: () => "{bad" }, "key", 12).size, 0);
});
