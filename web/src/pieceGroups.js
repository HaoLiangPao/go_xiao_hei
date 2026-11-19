import { WIDTH, HEIGHT } from "./geometry.js";

export const shapeGroups = { corner: "角块", edge: "边块", middle: "内部块" };
export const colorGroups = {
  warm: "红橙",
  gold: "黄",
  green: "绿",
  blue: "蓝青",
  purple: "紫粉",
  light: "浅色",
  neutral: "灰褐",
  dark: "深色",
};

export function shapeGroup(piece, cols, rows) {
  const onSide = piece.x === 0 || piece.x === cols - 1;
  const onEnd = piece.y === 0 || piece.y === rows - 1;
  if (onSide && onEnd) return "corner";
  return onSide || onEnd ? "edge" : "middle";
}

function pixelColor(red, green, blue) {
  const high = Math.max(red, green, blue);
  const low = Math.min(red, green, blue);
  const range = high - low;
  if (high < 75) return "dark";
  if (range < 23 || range / high < 0.16)
    return high > 180 ? "light" : "neutral";
  const hue =
    60 *
    (high === red
      ? (green - blue) / range
      : high === green
        ? 2 + (blue - red) / range
        : 4 + (red - green) / range);
  const angle = (hue + 360) % 360;
  if (angle < 39 || angle >= 345) return "warm";
  if (angle < 69) return "gold";
  if (angle < 165) return "green";
  return angle < 252 ? "blue" : "purple";
}

export async function readPieceColors(url, pieces) {
  const image = new Image();
  image.src = url;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = Math.round((canvas.width * HEIGHT) / WIDTH);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const scaleX = canvas.width / WIDTH,
    scaleY = canvas.height / HEIGHT;
  return pieces.map((piece) => {
    const path = new Path2D(piece.path);
    const [x, y, width, height] = piece.viewBox.split(" ").map(Number);
    const counts = new Map();
    for (
      let row = Math.max(0, Math.floor(y * scaleY));
      row < Math.min(canvas.height, (y + height) * scaleY);
      row++
    ) {
      for (
        let col = Math.max(0, Math.floor(x * scaleX));
        col < Math.min(canvas.width, (x + width) * scaleX);
        col++
      ) {
        if (
          !context.isPointInPath(
            path,
            (col + 0.5) / scaleX,
            (row + 0.5) / scaleY,
          )
        )
          continue;
        const index = (row * canvas.width + col) * 4;
        const color = pixelColor(
          pixels[index],
          pixels[index + 1],
          pixels[index + 2],
        );
        counts.set(color, (counts.get(color) ?? 0) + 1);
      }
    }
    return (
      [...counts].sort((first, second) => second[1] - first[1])[0]?.[0] ??
      "neutral"
    );
  });
}
