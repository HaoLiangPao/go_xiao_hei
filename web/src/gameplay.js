import { WIDTH, HEIGHT } from "./geometry.js";

// Hand-marked story areas in A0243, normalized to the original image.
// These are gameplay zones, not automatic object segmentation.
export const memories = [
  {
    id: "umbrella",
    name: "一把伞",
    icon: "umbrella",
    speaker: "无限",
    voice: "adultMale",
    effect: "umbrella",
    text: "靠近一点，雨就淋不到了。",
    bounds: [0.04, 0.01, 0.97, 0.23],
  },
  {
    id: "wuxian",
    name: "无限",
    icon: "mountain",
    speaker: "无限",
    voice: "adultMale",
    text: "不赶时间。你想看，就再看一会儿。",
    bounds: [0.12, 0.27, 0.68, 0.53],
  },
  {
    id: "xiaohei",
    name: "小黑",
    icon: "cat",
    speaker: "小黑",
    voice: "child",
    text: "师父，你看！叶子上有一颗小小的天空。",
    bounds: [0.45, 0.51, 0.94, 0.77],
  },
  {
    id: "grass",
    name: "叶尖水珠",
    icon: "leaf",
    speaker: "小黑",
    voice: "child",
    text: "嘘——别动。让它在叶子上，再待一小会儿。",
    bounds: [0, 0.83, 1, 1],
  },
];
export function regionPieces(region, cols, rows) {
  const [x1, y1, x2, y2] = region.bounds;
  const ids = [];
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const overlapX = Math.max(
        0,
        Math.min((x + 1) / cols, x2) - Math.max(x / cols, x1),
      );
      const overlapY = Math.max(
        0,
        Math.min((y + 1) / rows, y2) - Math.max(y / rows, y1),
      );
      if (overlapX * overlapY * cols * rows >= 0.18) ids.push(y * cols + x);
    }
  return ids;
}
export function completedMemories(placed, cols, rows, regions = memories) {
  return regions.filter((memory) => {
    const ids = regionPieces(memory, cols, rows);
    return ids.length > 0 && ids.every((id) => placed.has(id));
  });
}
export function targetPoint(piece, cols, rows, rect) {
  return {
    x: rect.left + ((piece.x + 0.5) * rect.width) / cols,
    y: rect.top + ((piece.y + 0.5) * rect.height) / rows,
  };
}
export function snapRadius(cols, rows, rect) {
  // Screen-space distance: usable on phones without accepting unrelated slots.
  return Math.min(
    34,
    Math.max(14, Math.min(rect.width / cols, rect.height / rows) * 0.48),
  );
}
export function withinSnap(point, target, radius) {
  return Math.hypot(point.x - target.x, point.y - target.y) <= radius;
}
export function floatingSize(piece, rect) {
  const [, , width, height] = piece.viewBox.split(" ").map(Number);
  return {
    width: (width * rect.width) / WIDTH,
    height: (height * rect.height) / HEIGHT,
  };
}
