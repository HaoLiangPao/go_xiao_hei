import React from "react";
import { HEIGHT, WIDTH } from "./geometry.js";

export function MemoryEffect({ memory }) {
  const [left, top, right, bottom] = memory.bounds;
  const centerX = ((left + right) * WIDTH) / 2;
  const centerY = ((top + bottom) * HEIGHT) / 2;
  const effect = memory.effect || "glow";
  return (
    <g
      data-memory-effect={memory.id}
      className={`story-effect effect-${effect}`}
      pointerEvents="none"
      aria-hidden="true"
    >
      {Array.from({ length: 6 }, (_, index) => {
        const fraction = (index + 0.5) / 6;
        const x = (left + (right - left) * fraction) * WIDTH;
        const y = centerY + (index % 2 ? 24 : -22);
        const style = { animationDelay: `${index * 85}ms` };
        if (effect === "rain" || effect === "umbrella") {
          return (
            <ellipse key={index} cx={x} cy={y} rx="24" ry="10" style={style} />
          );
        }
        if (effect === "wind") {
          return (
            <path
              key={index}
              d={`M${x - 35} ${y}q22 -18 53 -9t26 -14`}
              style={style}
            />
          );
        }
        if (effect === "petals") {
          return (
            <ellipse key={index} cx={x} cy={y} rx="12" ry="6" style={style} />
          );
        }
        return (
          <circle
            key={index}
            cx={(x + centerX) / 2}
            cy={y}
            r={index % 2 ? 7 : 11}
            style={style}
          />
        );
      })}
    </g>
  );
}
