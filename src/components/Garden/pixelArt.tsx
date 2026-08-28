import { type ReactElement } from "react";

const PALETTE = {
  k: "#1a140c",
  w: "#FCFCFC",
  g: "#3d8a48",
  l: "#6bb86a",
  d: "#2a5c32",
  r: "#c45c38",
  o: "#e88850",
  n: "#8a5a32",
  m: "#5C3000",
  y: "#e8c040",
  c: "#FCE8A0",
  p: "#FCB8A0",
  t: "#5cb8d8",
  b: "#3a7ca8",
  u: "#7C7C7C",
  h: "#BCBCBC",
  a: "#d49258",
  f: "#883000",
  e: "#E8E0D0",
  s: "#683418",
  q: "#FCD8A8",
} as const;

/**
 * Scale2x (EPX) upscale. Each source pixel becomes a 2×2 block, with
 * neighbor colors pulled in on diagonals so edges stay sharp at double resolution.
 */
function scale2x(rows: readonly string[]): string[] {
  const h = rows.length;
  const w = rows[0]?.length ?? 0;
  const at = (x: number, y: number): string => {
    if (y < 0 || y >= h || x < 0 || x >= w) return ".";
    return rows[y][x];
  };

  const out: string[] = [];
  for (let y = 0; y < h; y++) {
    const top: string[] = [];
    const bot: string[] = [];
    for (let x = 0; x < w; x++) {
      const E = at(x, y);
      const B = at(x, y - 1);
      const D = at(x - 1, y);
      const F = at(x + 1, y);
      const H = at(x, y + 1);

      let e0 = E;
      let e1 = E;
      let e2 = E;
      let e3 = E;
      if (E !== ".") {
        if (B !== "." && D !== "." && B === D && B !== H && D !== F) e0 = D;
        if (B !== "." && F !== "." && B === F && B !== H && F !== D) e1 = F;
        if (H !== "." && D !== "." && H === D && H !== B && D !== F) e2 = D;
        if (H !== "." && F !== "." && H === F && H !== B && F !== D) e3 = F;
      }
      top.push(e0, e1);
      bot.push(e2, e3);
    }
    out.push(top.join(""), bot.join(""));
  }
  return out;
}

export function PixelSprite({
  size = 40,
  rows,
  palette = PALETTE,
}: {
  size?: number;
  rows: readonly string[];
  palette?: Record<string, string>;
}) {
  const grid = scale2x(rows);
  const height = grid.length;
  const width = Math.max(...grid.map((row) => row.length), 0);
  const rects: ReactElement[] = [];

  for (let y = 0; y < height; y++) {
    const row = grid[y].padEnd(width, ".");
    let x = 0;
    while (x < width) {
      const ch = row[x];
      if (ch === ".") {
        x += 1;
        continue;
      }
      let run = 1;
      while (x + run < width && row[x + run] === ch) run += 1;
      const fill = palette[ch];
      if (fill) {
        rects.push(
          <rect key={`${x}-${y}`} x={x} y={y} width={run} height={1} fill={fill} />,
        );
      }
      x += run;
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      data-testid="garden-sprite-svg"
      shapeRendering="crispEdges"
      style={{ imageRendering: "pixelated" }}
    >
      {rects}
    </svg>
  );
}
