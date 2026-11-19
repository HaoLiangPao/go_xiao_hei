import React, { memo } from "react";
import { WIDTH, HEIGHT } from "./geometry.js";
export const IMAGE = "/art/rain-2020.jpg";
export const Fragment = memo(function Fragment({ piece, prefix }) {
  const id = `${prefix}-${piece.id}`;
  return (
    <>
      <defs>
        <clipPath id={id}>
          <path d={piece.path} />
        </clipPath>
      </defs>
      <image
        href={IMAGE}
        width={WIDTH}
        height={HEIGHT}
        clipPath={`url(#${id})`}
        pointerEvents="none"
      />
    </>
  );
});
export function Icon({ name, ...props }) {
  const paths = {
    leaf: (
      <>
        <path d="M20 4C8 2 2 9 6 16s16 4 14-12Z" />
        <path d="m4 21 11-11M8 16v-5m4 1h5" />
      </>
    ),
    umbrella: (
      <>
        <path d="M3 12a9 9 0 0 1 18 0c-3-3-5 0-6 0-2-3-4-3-6 0-1 0-3-3-6 0Z" />
        <path d="M12 3v16a2 2 0 0 0 4 0" />
      </>
    ),
    cat: (
      <>
        <path d="M5 10 4 3l6 4h4l6-4-1 7c6 13-20 13-14 0Z" />
        <path d="M8 12v2m8-2v2m-5 3h2" />
      </>
    ),
    mountain: (
      <>
        <path d="m2 19 7-13 5 8 3-5 5 10Z" />
        <path d="m6 12 3 1 2-3" />
      </>
    ),
    sound: (
      <>
        <path d="m4 9 4 0 5-4v14l-5-4H4Z" />
        <path d="M17 8q5 4 0 8m3-11q7 7 0 14" />
      </>
    ),
    mute: (
      <>
        <path d="M4 9h4l5-4v14l-5-4H4Z" />
        <path d="m17 9 5 6m0-6-5 6" />
      </>
    ),
    settings: (
      <>
        <path d="M4 7h16M4 17h16" />
        <circle cx="9" cy="7" r="3" />
        <circle cx="16" cy="17" r="3" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12q10-14 20 0-10 14-20 0Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    hint: (
      <>
        <path d="M8 16c0-3-3-3-3-7a7 7 0 0 1 14 0c0 4-3 4-3 7Zm1 4h6m-6-2h6" />
      </>
    ),
    reset: (
      <>
        <path d="M4 10a8 8 0 1 1 0 5M4 4v6h6" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    left: <path d="m14 6-6 6 6 6" />,
    right: <path d="m10 6 6 6-6 6" />,
    zoom: (
      <>
        <circle cx="10" cy="10" r="7" />
        <path d="m15 15 6 6M7 10h6m-3-3v6" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.leaf}
    </svg>
  );
}
