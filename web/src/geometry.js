export const WIDTH = 1080,
  HEIGHT = 2057;
export const levels = {
  easy: { cols: 3, rows: 4, label: "轻松 · 12 片" },
  medium: { cols: 4, rows: 6, label: "漫游 · 24 片" },
  hard: { cols: 6, rows: 8, label: "挑战 · 48 片" },
};
const round = (n) => Math.round(n * 1000) / 1000;
const point = (p) => `${round(p.x)} ${round(p.y)}`;
export function reverseEdge(edge) {
  return edge
    .slice()
    .reverse()
    .map((s) =>
      s.type === "C"
        ? { type: "C", a: s.b, b: s.a, c1: s.c2, c2: s.c1 }
        : { type: "L", a: s.b, b: s.a },
    );
}
export function edgePath(edge) {
  return edge
    .map((s) =>
      s.type === "C"
        ? `C${point(s.c1)} ${point(s.c2)} ${point(s.b)}`
        : `L${point(s.b)}`,
    )
    .join(" ");
}
function edge(a, b, tab, seed) {
  if (!tab) return [{ type: "L", a, b }];
  const dx = b.x - a.x,
    dy = b.y - a.y,
    len = Math.hypot(dx, dy),
    depth = len * 0.19 * (seed % 2 ? 1 : -1);
  const p = (t, n = 0) => ({
    x: a.x + dx * t - (dy / len) * n,
    y: a.y + dy * t + (dx / len) * n,
  });
  return [
    { type: "L", a, b: p(0.34) },
    {
      type: "C",
      a: p(0.34),
      c1: p(0.48),
      c2: p(0.32, depth),
      b: p(0.5, depth),
    },
    {
      type: "C",
      a: p(0.5, depth),
      c1: p(0.68, depth),
      c2: p(0.52),
      b: p(0.66),
    },
    { type: "L", a: p(0.66), b },
  ];
}
export function makePieces(cols, rows, shape = "flat") {
  const cw = WIDTH / cols,
    ch = HEIGHT / rows;
  const noise = (x, y, s) => Math.sin(x * 37.3 + y * 71.9 + s * 13.1) * 0.14;
  const vertices = Array.from({ length: rows + 1 }, (_, y) =>
    Array.from({ length: cols + 1 }, (_, x) => ({
      x:
        x * cw +
        (shape === "organic" && x > 0 && x < cols && y > 0 && y < rows
          ? cw * noise(x, y, 1)
          : 0),
      y:
        y * ch +
        (shape === "organic" && x > 0 && x < cols && y > 0 && y < rows
          ? ch * noise(x, y, 2)
          : 0),
    })),
  );
  const horizontal = Array.from({ length: rows + 1 }, (_, y) =>
    Array.from({ length: cols }, (_, x) =>
      edge(
        vertices[y][x],
        vertices[y][x + 1],
        shape !== "flat" && y > 0 && y < rows,
        x + y * 13,
      ),
    ),
  );
  const vertical = Array.from({ length: rows }, (_, y) =>
    Array.from({ length: cols + 1 }, (_, x) =>
      edge(
        vertices[y][x],
        vertices[y + 1][x],
        shape !== "flat" && x > 0 && x < cols,
        x * 7 + y,
      ),
    ),
  );
  return Array.from({ length: cols * rows }, (_, id) => {
    const x = id % cols,
      y = Math.floor(id / cols),
      edges = [
        horizontal[y][x],
        vertical[y][x + 1],
        reverseEdge(horizontal[y + 1][x]),
        reverseEdge(vertical[y][x]),
      ];
    const pad = shape === "flat" ? 0 : Math.max(cw, ch) * 0.3;
    return {
      id,
      x,
      y,
      edges,
      path: `M${point(vertices[y][x])} ${edges.map(edgePath).join(" ")} Z`,
      viewBox: `${x * cw - pad} ${y * ch - pad} ${cw + pad * 2} ${ch + pad * 2}`,
    };
  });
}
export function shuffle(n) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function readProgress(storage, key, total) {
  try {
    const d = JSON.parse(storage.getItem(key));
    return new Set(
      Array.isArray(d)
        ? d.filter((n) => Number.isInteger(n) && n >= 0 && n < total)
        : [],
    );
  } catch {
    return new Set();
  }
}
