// Pixel-art props for the office room: string lights, windows, clock and the hanging plant.
// The dogs live in lib/dogs.ts, because one of them is picked per day.

import type { CSSProperties } from "react";
import type { StaticImageData } from "next/image";
import { WINDOW_GLASS, WINDOW_MULLION, windowRects, type Sky } from "@/lib/sky";
import { OUTLINE, type Rect } from "@/lib/sprite";
import { precipitation, type Weather } from "@/lib/weather";
import { gustPeriod } from "@/lib/scene";
import weatherStyles from "./Weather.module.css";
import type { FallingLeaf, GustLeaf } from "@/lib/scene";

type R = readonly [x: number, y: number, w: number, h: number, fill: string];

function Pixels({ rects }: { rects: readonly R[] }) {
  return (
    <>
      {rects.map(([x, y, w, h, fill], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
      ))}
    </>
  );
}

export function Lights({ className }: { className?: string }) {
  return <div className={className} aria-hidden="true" />;
}

const WOOD = "#a86f42";
const WOOD_HI = "#c98d5a";
/** Lavender curtains: fill, the fold's shadow and its highlight — the walls' and chairs' purple, lighter. */
const CURTAIN = ["#8e7cc9", "#6a5aa3", "#b3a4e6"] as const;
/** How wide each curtain is, two rows per entry from the rod down: gathered at the tie, fuller at the hem. */
const CURTAIN_WIDTHS = [6, 6, 5, 5, 5, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 7];

/** One curtain hanging from the rod: `x0` is its outer edge, `dir` 1 for the left one, −1 for the right. */
function curtain(x0: number, dir: 1 | -1): Rect[] {
  const [fill, shadow, light] = CURTAIN;
  const px = (x: number, y: number, w: number, c: string): Rect => ({ x, y, w, h: 1, fill: c });
  return Array.from({ length: 35 }, (_, y) => {
    const w = CURTAIN_WIDTHS[Math.min(CURTAIN_WIDTHS.length - 1, Math.floor(y / 2))];
    const x = dir > 0 ? x0 : x0 - w + 1;
    return [
      px(x, y, w, fill),
      px(dir > 0 ? x + w - 1 : x, y, 1, OUTLINE),
      px(dir > 0 ? x + 2 : x + w - 3, y, 1, shadow),
      px(dir > 0 ? x + 1 : x + w - 2, y, 1, light),
    ];
  }).flat();
}

/**
 * The window frame, drawn last so falling rain and snow never spill over it: a wooden frame with a
 * dark outline, the wooden mullion, and curtains on a rod reaching past the frame on both sides.
 */
const FRAME: Rect[] = [
  { x: 1, y: 1, w: 62, h: 1, fill: WOOD_HI },
  { x: 1, y: 34, w: 62, h: 1, fill: WOOD },
  { x: 1, y: 1, w: 1, h: 34, fill: WOOD_HI },
  { x: 62, y: 1, w: 1, h: 34, fill: WOOD },
  { ...WINDOW_MULLION, fill: WOOD },
  { x: WINDOW_MULLION.x, y: WINDOW_MULLION.y, w: 1, h: WINDOW_MULLION.h, fill: WOOD_HI },
  { x: 0, y: 0, w: 64, h: 1, fill: OUTLINE },
  { x: 0, y: 35, w: 64, h: 1, fill: OUTLINE },
  { x: 0, y: 0, w: 1, h: 36, fill: OUTLINE },
  { x: 63, y: 0, w: 1, h: 36, fill: OUTLINE },
  ...curtain(-2, 1),
  ...curtain(65, -1),
  { x: -3, y: -2, w: 70, h: 2, fill: OUTLINE },
  { x: -2, y: -1, w: 68, h: 1, fill: WOOD },
];
/** The drawing reaches 3 past the frame at the sides (curtains) and 2 above it (the rod); see .window. */
const WINDOW_VIEWBOX = "-3 -2 70 38";

/**
 * A window onto the Oslo sky: the weather-tinted sky and city, this month's hand-drawn view (if any),
 * then rain or snow from MET falling past it, and the frame and mullion on top.
 */
export function PixelWindow({
  sky,
  weather,
  view,
  city = true,
  leaves = [],
  gust = [],
  className,
}: {
  sky: Sky;
  weather?: Weather;
  view?: StaticImageData;
  city?: boolean;
  /** Autumn leaves blowing past, drawn over the view like the rain. */
  leaves?: readonly FallingLeaf[];
  /** The extra leaves of the gust: flyers that cross the glass and leaves resting on the sill. */
  gust?: readonly GustLeaf[];
  className?: string;
}) {
  const g = WINDOW_GLASS;
  const wind = weather?.wind ?? 0;
  const windClass = wind === 2 ? weatherStyles.gale : wind === 1 ? weatherStyles.breeze : "";
  return (
    <svg
      viewBox={WINDOW_VIEWBOX}
      className={className}
      shapeRendering="crispEdges"
      aria-hidden="true"
      style={{ "--gust": `${gustPeriod(wind)}s` } as CSSProperties}
    >
      <rect width="64" height="36" fill={OUTLINE} />
      <Rects rects={windowRects(sky, city)} />
      {view && (
        <image
          href={view.src}
          x={g.x}
          y={g.y}
          width={g.w}
          height={g.h}
          preserveAspectRatio="none"
          style={{
            imageRendering: "pixelated",
            filter: sky.outside < 1 ? `brightness(${sky.outside})` : undefined,
          }}
        />
      )}
      {precipitation(weather).map((p, i) => {
        const clock = { "--dur": `${p.duration}s`, "--off": `-${p.offset}s` } as CSSProperties;
        const fall = { ...clock, "--py": p.y } as CSSProperties;
        switch (p.kind) {
          case "drop":
            if (wind === 2) {
              // a diagonal that crosses as far as it falls: 3 px near, 2 px far
              const n = p.near ? 3 : 2;
              const fill = p.near ? "#e8f0ff" : "#cfe0ff";
              return (
                <g key={i} className={`${weatherStyles.wind} ${p.near ? weatherStyles.galeNear : weatherStyles.gale}`} style={clock}>
                  <g className={p.near ? weatherStyles.near : weatherStyles.far} style={fall} opacity={p.near ? 0.85 : 0.5}>
                    {Array.from({ length: n }, (_, k) => (
                      <rect key={k} x={p.x + k} y={p.y + k} width="1" height="1" fill={fill} />
                    ))}
                  </g>
                </g>
              );
            }
            return (
              <g key={i} className={`${weatherStyles.wind} ${windClass}`} style={clock}>
                <rect x={p.x} y={p.y} width="1" height="2" fill="#cfe0ff" opacity={wind === 1 ? 0.4 : 0.3} className={weatherStyles.far} style={fall} />
              </g>
            );
          case "flake":
            return <rect key={i} x={p.x} y={p.y} width="1" height="1" fill="#ffffff" opacity={0.95} className={weatherStyles.flake} style={fall} />;
          case "pane":
            return (
              <g key={i} className={`${weatherStyles.pane} ${windClass}`} style={clock}>
                <rect x={p.x} y={p.y - 2} width="1" height="2" fill="#e4ecff" opacity={0.45} />
                <rect x={p.x} y={p.y} width="1" height="1" fill="#ffffff" opacity={0.95} />
              </g>
            );
          case "splash":
            return (
              <g key={i} opacity={[0.6, 0.7, 0.8][wind]} style={clock}>
                <rect x={p.x} y={p.y} width="1" height="1" fill="#e3ecff" className={weatherStyles.splashA} />
                <g className={weatherStyles.splashB}>
                  <rect x={p.x - 1} y={p.y - 1} width="1" height="1" fill="#e3ecff" />
                  <rect x={p.x + 1} y={p.y - 1} width="1" height="1" fill="#e3ecff" />
                </g>
              </g>
            );
        }
      })}
      {wind === 2 && weather?.precip !== "none" && weather?.precip !== "snow" && (
        <>
          <rect x={g.x} y={g.y} width={g.w} height={g.h} fill="#ffffff" opacity={0.06} />
          {[0, -1.3].map((off) => (
            <polygon
              key={off}
              points="-30,2 -24,2 8,34 2,34"
              fill="#ffffff"
              opacity={0.07}
              className={weatherStyles.sheet}
              style={{ "--dur": "2.4s", "--off": `${off}s` } as CSSProperties}
            />
          ))}
        </>
      )}
      <g
        style={{
          filter: sky.outside < 1 ? `brightness(${sky.outside})` : undefined,
        }}
      >
        {leaves.map((leaf, i) => (
          <g key={`leaf-${i}`} className={weatherStyles.gust}>
            <rect
              x={leaf.x}
              y={leaf.y}
              width="2"
              height="1"
              fill={leaf.color}
              className={weatherStyles.drift}
              style={
                {
                  "--py": leaf.y,
                  "--dur": `${leaf.duration}s`,
                  "--off": `-${leaf.offset}s`,
                } as CSSProperties
              }
            />
          </g>
        ))}
        {gust.map((leaf, i) => (
          <g key={`gust-${i}`} className={leaf.kind === "flyer" ? weatherStyles.flyer : weatherStyles.resting}>
            <rect x={leaf.x} y={leaf.y} width="2" height="1" fill={leaf.color} />
          </g>
        ))}
      </g>
      {weather?.thunder && (
        <rect
          x={g.x}
          y={g.y}
          width={g.w}
          height={g.h}
          fill="#ffffff"
          className={weatherStyles.flash}
        />
      )}
      <Rects rects={FRAME} />
    </svg>
  );
}

function Rects({ rects }: { rects: readonly Rect[] }) {
  return (
    <Pixels rects={rects.map((r) => [r.x, r.y, r.w, r.h, r.fill] as const)} />
  );
}

const CLOCK: readonly R[] = [
  [4, 1, 10, 16, OUTLINE],
  [1, 4, 16, 10, OUTLINE],
  [2, 2, 14, 14, OUTLINE],
  [5, 2, 8, 14, "#fff3dc"],
  [2, 5, 14, 8, "#fff3dc"],
  [3, 3, 12, 12, "#fff3dc"],
  [8, 4, 2, 6, "#221a3a"],
  [9, 8, 4, 2, "#ff6fa8"],
];

export function Clock({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 18 18"
      className={className}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <Pixels rects={CLOCK} />
    </svg>
  );
}

const PLANT: readonly R[] = [
  [7, 0, 2, 8, OUTLINE],
  [3, 8, 10, 6, OUTLINE],
  [4, 9, 8, 4, "#e08a5b"],
  [2, 7, 5, 2, "#5fae62"],
  [9, 6, 5, 2, "#7dcf76"],
  [2, 13, 2, 6, "#5fae62"],
  [1, 18, 2, 4, "#7dcf76"],
  [12, 13, 2, 8, "#5fae62"],
  [13, 20, 2, 5, "#7dcf76"],
  [7, 14, 2, 4, "#7dcf76"],
];

export function HangingPlant({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 28"
      className={className}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <Pixels rects={PLANT} />
    </svg>
  );
}
