import React, { memo } from "react";
import { WIDTH, HEIGHT } from "./geometry.js";
export const Fragment = memo(function Fragment({ piece, prefix, image, material = "light", raised = true }) {
  const id = `${prefix}-${piece.id}`;
  const cardboard = material === "cardboard";
  return (
    <g className={cardboard ? "material-piece" : undefined} pointerEvents="none">
      <defs>
        <clipPath id={id}>
          <path d={piece.path} />
        </clipPath>
        {cardboard && <pattern id={`${id}-grain`} width="13" height="17" patternUnits="userSpaceOnUse">
          <path d="M1 3h3m4 7h2M3 15h2" stroke="#fffce9" strokeWidth="1" opacity=".3" />
          <path d="M7 2h1m-5 8h2m6 4h1" stroke="#263d32" strokeWidth="1" opacity=".14" />
        </pattern>}
      </defs>
      {cardboard && raised && <g className="cardboard-side">
        <path d={piece.path} transform="translate(1 10)" fill="#736c55" stroke="#575b44" strokeWidth="4" />
        <path d={piece.path} transform="translate(0 5)" fill="#b4ac87" stroke="#c1b997" strokeWidth="2" />
      </g>}
      <image
        href={image}
        width={WIDTH}
        height={HEIGHT}
        clipPath={`url(#${id})`}
        pointerEvents="none"
      />
      {cardboard && <g clipPath={`url(#${id})`} className="cardboard-finish">
        <rect width={WIDTH} height={HEIGHT} fill={`url(#${id}-grain)`} />
        <path d={piece.path} fill="none" stroke="#2b443b70" strokeWidth="10" transform="translate(-2 -3)" />
        <path d={piece.path} fill="none" stroke="#fffbe5c4" strokeWidth="7" transform="translate(2 3)" />
        <path d={piece.path} fill="none" stroke="#30483d77" strokeWidth="3" />
      </g>}
    </g>
  );
});
export const PieceWell = memo(function PieceWell({ piece }) {
  const id = `well-${piece.id}`;
  return <g className="piece-well" pointerEvents="none">
    <defs><clipPath id={id}><path d={piece.path} /></clipPath></defs>
    <path d={piece.path} fill="#4f615222" stroke="#3a4c3e77" strokeWidth="6" />
    <g clipPath={`url(#${id})`}>
      <path d={piece.path} fill="none" stroke="#213d3277" strokeWidth="15" transform="translate(3 5)" />
      <path d={piece.path} fill="none" stroke="#fffce299" strokeWidth="9" transform="translate(-2 -4)" />
    </g>
  </g>;
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
    kite: (
      <path d="m13 2 8 8-11 6-4-4 7-10Zm-3 14c-5 0 0 4-6 6m2-10 15-2M13 2l-3 14" />
    ),
    flower: (
      <>
        <path d="M12 8c-5-6-10 2-5 4-4 5 5 8 5 3 3 5 9-1 5-3 5-4-2-10-5-4Z" />
        <path d="M12 16v6m0-2 5-2" />
      </>
    ),
    drawing: (
      <>
        <path d="m5 16 11-11 3 3L8 19l-5 2 2-5Zm9-9 3 3" />
        <path d="M12 21h9" />
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
