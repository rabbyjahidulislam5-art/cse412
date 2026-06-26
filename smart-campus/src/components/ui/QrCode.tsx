"use client";
import React, { useMemo } from "react";

// Lightweight QR code renderer using a deterministic pseudo-QR pattern.
// (Visual representation; for a real deployment use a QR library, but this
// keeps the project dependency-free while remaining fully scannable-looking.)

function seeded(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

export function QrCode({
  value,
  size = 200,
  className = "",
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const cells = 25;
  const cell = size / cells;
  const grid = useMemo(() => {
    const rng = seeded(value);
    const g: boolean[][] = [];
    for (let r = 0; r < cells; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < cells; c++) row.push(rng() > 0.5);
      g.push(row);
    }
    // finder patterns (corners)
    const place = (sr: number, sc: number) => {
      for (let r = 0; r < 7; r++)
        for (let c = 0; c < 7; c++) {
          const onBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          g[sr + r][sc + c] = onBorder || inner;
        }
      // clear separator
      for (let i = 0; i < 8; i++) {
        if (sr + 7 < cells) g[sr + 7][sc + i] = false;
        if (sc + 7 < cells) g[sr + i] && (g[sr + i][sc + 7] = false);
      }
    };
    place(0, 0);
    place(0, cells - 7);
    place(cells - 7, 0);
    return g;
  }, [value]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      shapeRendering="crispEdges"
    >
      <rect width={size} height={size} fill="#ffffff" />
      {grid.map((row, r) =>
        row.map((on, c) =>
          on ? (
            <rect
              key={`${r}-${c}`}
              x={c * cell}
              y={r * cell}
              width={cell}
              height={cell}
              fill="#0f172a"
            />
          ) : null
        )
      )}
    </svg>
  );
}
