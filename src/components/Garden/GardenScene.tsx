import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { GARDEN_LAYOUT, type GardenVisualStage } from "@/constants/achievements";
import type { AchievementDefinition, EarnedAchievement } from "@/services/achievementService";
import GardenElement from "./GardenElement";
import "./GardenScene.css";

interface Props {
  visualStage: GardenVisualStage;
  allDefinitions: AchievementDefinition[];
  earned: EarnedAchievement[];
  newlyUnlockedKeys: string[];
  timeOfDay?: TimeOfDay;
}

export type TimeOfDay = "dawn" | "day" | "dusk" | "night";

function getTimeOfDay(date = new Date()): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 18) return "day";
  if (hour >= 18 && hour < 21) return "dusk";
  return "night";
}

function useTimeOfDay() {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(() => getTimeOfDay());

  useEffect(() => {
    const updateTimeOfDay = () => setTimeOfDay(getTimeOfDay());
    const interval = window.setInterval(updateTimeOfDay, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return timeOfDay;
}

function GardenBackdrop({ visualStage, timeOfDay }: { visualStage: GardenVisualStage; timeOfDay: TimeOfDay }) {
  const isForest = visualStage === "forest";
  const isGarden = visualStage === "garden" || isForest;
  const isSoil = visualStage === "soil";
  const isNight = timeOfDay === "night";
  const isDusk = timeOfDay === "dusk";
  const isDawn = timeOfDay === "dawn";

  return (
    <svg
      className="garden-backdrop-svg"
      viewBox="0 0 400 340"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="gsSky" x1="0" y1="0" x2="0" y2="1">
          {isNight ? (
            <>
              <stop offset="0%" stopColor="#17243b" />
              <stop offset="48%" stopColor="#294457" />
              <stop offset="100%" stopColor="#416557" />
            </>
          ) : isDusk ? (
            <>
              <stop offset="0%" stopColor="#747896" />
              <stop offset="48%" stopColor="#c48b82" />
              <stop offset="100%" stopColor="#9fa477" />
            </>
          ) : isDawn ? (
            <>
              <stop offset="0%" stopColor="#a9bfd0" />
              <stop offset="48%" stopColor="#e3c8b7" />
              <stop offset="100%" stopColor="#a9bf9a" />
            </>
          ) : isSoil ? (
            <>
              <stop offset="0%" stopColor="#eee8f3" />
              <stop offset="48%" stopColor="#d9e3dc" />
              <stop offset="100%" stopColor="#aebfa9" />
            </>
          ) : isForest ? (
            <>
              <stop offset="0%" stopColor="#d4e9e4" />
              <stop offset="42%" stopColor="#afd3c2" />
              <stop offset="100%" stopColor="#79a77f" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#d9edf0" />
              <stop offset="38%" stopColor="#c1ddd2" />
              <stop offset="100%" stopColor="#83ae89" />
            </>
          )}
        </linearGradient>
        <radialGradient id="gsSun" cx="68%" cy="12%" r="34%">
          <stop offset="0%" stopColor={isDusk ? "#ffe1af" : "#fff9cf"} stopOpacity="0.95" />
          <stop offset="42%" stopColor={isDusk ? "#e99a6d" : "#f1d47b"} stopOpacity="0.32" />
          <stop offset="100%" stopColor={isDusk ? "#e99a6d" : "#f1d47b"} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="gsHillFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isNight ? "#35544f" : isDusk ? "#6f7d70" : isForest ? "#78a590" : "#9bc7a7"} />
          <stop offset="100%" stopColor={isNight ? "#203d3b" : isDusk ? "#4c685d" : isForest ? "#527b69" : "#6f9e7c"} />
        </linearGradient>
        <linearGradient id="gsHillNear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isNight ? "#294b43" : isDusk ? "#59705f" : isForest ? "#639073" : "#79ae82"} />
          <stop offset="100%" stopColor={isNight ? "#183631" : isDusk ? "#3b5c4d" : isForest ? "#39634f" : "#4b865f"} />
        </linearGradient>
        <linearGradient id="gsLawn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isNight ? "#2b5145" : isDusk ? "#4f7459" : isSoil ? "#849873" : isForest ? "#4d805e" : "#579169"} />
          <stop offset="50%" stopColor={isNight ? "#1d4038" : isDusk ? "#3c624d" : isSoil ? "#697e5d" : isForest ? "#37694e" : "#397655"} />
          <stop offset="100%" stopColor={isNight ? "#122d28" : isDusk ? "#294b3d" : isSoil ? "#506449" : isForest ? "#244f3c" : "#275d45"} />
        </linearGradient>
        <linearGradient id="gsSoil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#69503f" />
          <stop offset="100%" stopColor="#3d3029" />
        </linearGradient>
        <linearGradient id="gsPlatform" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isNight ? "#64766f" : isForest ? "#98a995" : "#b7b89a"} />
          <stop offset="100%" stopColor={isNight ? "#394f49" : isForest ? "#5e7966" : "#747d69"} />
        </linearGradient>
        <linearGradient id="gsStream" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={isNight ? "#79aaa6" : isForest ? "#9bd6bd" : "#a9ded2"} />
          <stop offset="55%" stopColor={isNight ? "#477d7c" : isForest ? "#62ae91" : "#6ab8aa"} />
          <stop offset="100%" stopColor={isNight ? "#275b60" : isForest ? "#367b68" : "#3f8f83"} />
        </linearGradient>
        <radialGradient id="gsCrystal" cx="35%" cy="25%" r="70%">
          <stop offset="0%" stopColor="#f5ffd7" />
          <stop offset="55%" stopColor={isForest ? "#8cd7a4" : "#d6df8a"} />
          <stop offset="100%" stopColor={isForest ? "#4a8e75" : "#8b9b61"} />
        </radialGradient>
        <linearGradient id="gsTree" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isNight ? "#315d53" : "#669c73"} />
          <stop offset="100%" stopColor={isNight ? "#172f2a" : "#294f3d"} />
        </linearGradient>
      </defs>

      {/* Sanctuary sky */}
      <rect width="400" height="340" fill="url(#gsSky)" />
      {!isNight && <ellipse cx="280" cy="40" rx="90" ry="65" fill="url(#gsSun)" />}
      {!isNight && (
        <circle
          cx={isDawn ? 245 : isDusk ? 318 : 282}
          cy={isDawn || isDusk ? 52 : 36}
          r="14"
          fill={isDusk ? "#ffd6a1" : "#fff8cf"}
          opacity="0.9"
        />
      )}
      {isNight && (
        <>
          <path d="M292 18 A18 18 0 1 1 292 54 A13 13 0 1 0 292 18" fill="#fff4bd" opacity="0.9" />
          <g fill="#eef7d2">
            {[
              [24, 24, 1.2], [62, 48, 0.8], [105, 20, 1], [148, 58, 0.7],
              [194, 26, 1.1], [236, 62, 0.8], [340, 24, 1], [378, 54, 0.75],
            ].map(([cx, cy, radius], index) => (
              <circle key={index} cx={cx} cy={cy} r={radius} opacity={0.58 + (index % 3) * 0.14} />
            ))}
          </g>
        </>
      )}

      {/* Soft sky wisps */}
      {!isNight && (
        <g fill="#fff" opacity={isSoil ? 0.22 : isForest ? 0.2 : 0.38}>
          <g transform="translate(35, 30)">
            <ellipse cx="0" cy="8" rx="24" ry="7" />
            <ellipse cx="18" cy="5" rx="15" ry="6" />
            <ellipse cx="-12" cy="10" rx="12" ry="4" />
          </g>
          <g transform="translate(170, 22)">
            <ellipse cx="0" cy="6" rx="25" ry="6" />
            <ellipse cx="20" cy="3" rx="13" ry="5" />
          </g>
          <g transform="translate(340, 35)">
            <ellipse cx="0" cy="5" rx="20" ry="5" />
            <ellipse cx="14" cy="2" rx="11" ry="4" />
          </g>
        </g>
      )}

      {/* Layered preserve boundary */}
      <path
        d="M0 115 C45 96 88 108 138 91 C192 73 250 93 311 80 C352 72 382 83 400 78 V146 H0Z"
        fill="url(#gsHillFar)"
        opacity={isSoil ? 0.25 : 0.5}
      />
      <path
        d="M0 130 C55 114 103 125 158 108 C218 91 273 113 336 98 C367 91 391 100 400 96 V151 H0Z"
        fill="url(#gsHillNear)"
        opacity={isSoil ? 0.32 : 0.62}
      />

      {/* Ancient sanctuary markers replace the garden fence */}
      {isGarden && (
        <g opacity={isForest ? 0.62 : 0.48}>
          {[22, 76, 132, 270, 326, 380].map((x, index) => (
            <g key={x} transform={`translate(${x} ${index % 2 === 0 ? 105 : 111})`}>
              <path d="M-5 22 L-3 3 L0 -2 L3 3 L5 22 Z" fill="url(#gsPlatform)" stroke="#405b4d" strokeWidth="0.8" />
              <circle cx="0" cy="8" r="2.2" fill="url(#gsCrystal)" opacity="0.85" />
              <path d="M0 5.8 V10.2 M-2.2 8 H2.2" stroke="#e8f4c8" strokeWidth="0.55" strokeLinecap="round" />
            </g>
          ))}
          <path d="M132 122 Q200 76 270 122" stroke="#6d8d74" strokeWidth="2" fill="none" strokeDasharray="3 5" opacity="0.55" />
        </g>
      )}

      {/* Main lawn */}
      <path
        d="M0 138 C60 125 130 132 200 122 C270 114 340 126 400 120 V340 H0Z"
        fill="url(#gsLawn)"
      />

      {/* Habitat shadow patches for depth */}
      <g opacity="0.07">
        <ellipse cx="50" cy="235" rx="30" ry="10" fill="#000" />
        <ellipse cx="160" cy="275" rx="25" ry="8" fill="#000" />
        <ellipse cx="350" cy="255" rx="32" ry="11" fill="#000" />
        <ellipse cx="290" cy="300" rx="28" ry="9" fill="#000" />
      </g>

      {/* Luminous stream links the habitat zones */}
      <path
        d="M178 340 C183 305 192 270 204 240 C216 210 232 192 250 178"
        fill="none" stroke="rgba(10,35,32,0.18)" strokeWidth="38" strokeLinecap="round"
      />
      <path
        d="M176 340 C181 305 190 270 202 240 C214 210 230 192 248 178"
        fill="none" stroke="url(#gsStream)" strokeWidth="32" strokeLinecap="round"
      />
      <path
        d="M176 340 C181 305 190 270 202 240 C214 210 230 192 248 178"
        fill="none" stroke="#d8f2e7" strokeWidth="7" strokeLinecap="round" opacity="0.35"
      />
      <g fill="url(#gsPlatform)" stroke="#526b5b" strokeWidth="0.5" opacity="0.82">
        {[
          [180, 325, -5], [184, 298, 3], [191, 272, -8], [199, 248, 5],
          [210, 226, -3], [225, 206, 6], [240, 188, -4],
        ].map(([cx, cy, r], i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={8} ry={3.8} transform={`rotate(${r} ${cx} ${cy})`} />
        ))}
      </g>

      {/* Creature habitat platforms */}
      {[
        { cx: 75, cy: 170, rx: 43, ry: 19 },
        { cx: 195, cy: 164, rx: 59, ry: 23 },
        { cx: 328, cy: 168, rx: 47, ry: 20 },
      ].map(({ cx, cy, rx, ry }, index) => (
        <g key={cx}>
          <ellipse cx={cx} cy={cy + 9} rx={rx + 2} ry={ry - 1} fill="rgba(8,28,23,0.18)" />
          <ellipse cx={cx} cy={cy + 3} rx={rx} ry={ry} fill="url(#gsPlatform)" stroke="#526b59" strokeWidth="1" />
          <ellipse cx={cx} cy={cy} rx={rx - 5} ry={ry - 5} fill={index === 1 ? "#456c50" : "url(#gsSoil)"} stroke="#789078" strokeWidth="0.8" />
          <path
            d={`M${cx - rx * 0.55} ${cy + 1} Q${cx} ${cy - ry * 0.55} ${cx + rx * 0.55} ${cy + 1}`}
            stroke={index === 1 ? "#88a77a" : "#9d8568"}
            strokeWidth="0.7"
            fill="none"
            opacity="0.5"
          />
          <circle cx={cx} cy={cy + 1} r="2.2" fill="url(#gsCrystal)" opacity="0.65" />
        </g>
      ))}

      {/* Habitat crystals and nesting stones */}
      <g fill="url(#gsCrystal)" stroke="#58705e" strokeWidth="0.45" opacity={isSoil ? 0.42 : 0.72}>
        {[
          [40, 182], [54, 188], [70, 192], [90, 190], [105, 183], [112, 176],
          [142, 180], [160, 186], [182, 190], [210, 190], [232, 184], [248, 178], [256, 170],
          [288, 182], [306, 188], [326, 192], [350, 190], [366, 184], [376, 176],
        ].map(([x, y], i) => (
          <path
            key={i}
            d={`M${x - 2 - (i % 2)} ${y + 2} L${x - 1} ${y - 3 - (i % 3)} L${x + 2 + (i % 2)} ${y + 2} Z`}
          />
        ))}
      </g>

      {/* Grass blades along lawn edge */}
      <g stroke={isSoil ? "#8aa070" : isForest ? "#1a3020" : "#2a5038"} strokeWidth="1.2" strokeLinecap="round" opacity="0.4" fill="none">
        {Array.from({ length: 45 }, (_, i) => {
          const x = 5 + i * 9;
          const baseY = 130 + Math.sin(i * 0.8) * 8;
          const h = 5 + ((i * 3) % 7);
          const lean = ((i * 7) % 5) - 2;
          return <path key={i} d={`M${x} ${baseY} Q${x + lean} ${baseY - h / 2} ${x + lean * 0.5} ${baseY - h}`} />;
        })}
      </g>
      {/* Lower grass near beds */}
      <g stroke={isSoil ? "#8aa070" : isForest ? "#1a3020" : "#2a5038"} strokeWidth="1" strokeLinecap="round" opacity="0.3" fill="none">
        {Array.from({ length: 30 }, (_, i) => {
          const x = 8 + i * 13.5;
          const baseY = 205 + Math.sin(i * 1.2) * 12;
          const h = 4 + ((i * 5) % 6);
          const lean = ((i * 3) % 5) - 2;
          return <path key={i} d={`M${x} ${baseY} Q${x + lean} ${baseY - h / 2} ${x + lean * 0.3} ${baseY - h}`} />;
        })}
      </g>

      {/* Sanctuary motes */}
      {isGarden && (
        <g opacity={isForest ? 0.75 : 0.55}>
          {([
            [30, 200, "#f5e99b"], [55, 228, "#d8f5df"], [115, 208, "#f5e99b"],
            [140, 248, "#d8c4ee"], [265, 198, "#e7ffe4"], [285, 238, "#f5e99b"],
            [360, 208, "#d8c4ee"], [380, 248, "#e7ffe4"], [20, 268, "#f5e99b"],
            [100, 258, "#d8f5df"], [320, 278, "#f5e99b"], [370, 288, "#d8c4ee"],
          ] as const).map(([x, y, fill], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={3 + (i % 2)} fill={fill} opacity="0.12" />
              <circle cx={x} cy={y} r={0.9 + (i % 3) * 0.25} fill={fill} />
            </g>
          ))}
        </g>
      )}

      {/* Nursery stones appear before the sanctuary awakens */}
      {isSoil && (
        <g opacity="0.72">
          {[
            { x: 42, y: 284, s: 1 },
            { x: 335, y: 270, s: 0.82 },
            { x: 365, y: 300, s: 0.62 },
          ].map(({ x, y, s }) => (
            <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
              <ellipse cx="0" cy="14" rx="13" ry="5" fill="rgba(20,40,30,0.16)" />
              <path d="M-10 11 C-11 1 -6 -8 0 -9 C7 -8 11 1 10 11 C5 15 -5 15 -10 11 Z" fill="url(#gsPlatform)" stroke="#667362" strokeWidth="1" />
              <path d="M-4 -5 Q0 -8 4 -4" stroke="#dfe5c4" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.65" />
              <path d="M-3 3 L0 6 L3 3" stroke="#809873" strokeWidth="0.9" fill="none" strokeLinecap="round" />
            </g>
          ))}
        </g>
      )}

      {/* Creature nesting grottos */}
      <g opacity={isSoil ? 0.45 : 0.82}>
        <g transform="translate(18, 286)">
          <ellipse cx="18" cy="27" rx="19" ry="6" fill="rgba(12,35,28,0.2)" />
          <path d="M1 25 Q4 2 18 0 Q32 2 35 25 Z" fill="url(#gsPlatform)" stroke="#4e6757" strokeWidth="1.1" />
          <ellipse cx="18" cy="20" rx="10" ry="8" fill="#263e35" />
          <ellipse cx="16" cy="17" rx="5" ry="3" fill="#0e2722" opacity="0.6" />
          <path d="M4 11 Q10 8 14 10 M27 7 Q31 10 32 14" stroke="#8ca47c" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        </g>
        <g transform="translate(350, 291) scale(0.86)">
          <ellipse cx="18" cy="27" rx="19" ry="6" fill="rgba(12,35,28,0.2)" />
          <path d="M1 25 Q4 2 18 0 Q32 2 35 25 Z" fill="url(#gsPlatform)" stroke="#4e6757" strokeWidth="1.1" />
          <ellipse cx="18" cy="20" rx="10" ry="8" fill="#263e35" />
          <path d="M5 10 Q10 7 14 10 M25 8 Q30 9 32 14" stroke="#8ca47c" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        </g>
      </g>

      {/* Sanctuary arrival arch */}
      {isGarden && (
        <g transform="translate(354, 113)" opacity={isForest ? 0.72 : 0.58}>
          <path d="M0 76 V22 Q0 3 22 3 Q44 3 44 22 V76" stroke="#456657" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M0 76 V22 Q0 3 22 3 Q44 3 44 22 V76" stroke="#86a178" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M4 66 C13 53 7 38 17 25 C24 33 21 47 29 58 C32 46 31 31 39 20" stroke="#4f8a5e" strokeWidth="2" fill="none" strokeLinecap="round" />
          <ellipse cx="17" cy="25" rx="4" ry="2.4" fill="#79a968" transform="rotate(35 17 25)" />
          <ellipse cx="29" cy="57" rx="4" ry="2.4" fill="#6e9b62" transform="rotate(-30 29 57)" />
          <circle cx="22" cy="9" r="4" fill="url(#gsCrystal)" stroke="#526b5b" strokeWidth="0.8" />
          <path d="M22 6 V12 M19 9 H25" stroke="#f0f7cc" strokeWidth="0.8" strokeLinecap="round" />
        </g>
      )}

      {/* Enchanted preserve canopy */}
      {isForest && (
        <g opacity="0.86">
          {[
            { x: -8, s: 1.15, y: 72 },
            { x: 42, s: 0.78, y: 91 },
            { x: 355, s: 1.05, y: 76 },
          ].map(({ x, s, y }) => (
            <g key={x} transform={`translate(${x}, ${y}) scale(${s})`}>
              <path d="M14 91 Q17 60 16 38 H25 Q23 61 27 91 Z" fill="#443d32" />
              <path d="M18 70 Q8 60 5 47 M23 62 Q34 51 36 38" stroke="#443d32" strokeWidth="4" fill="none" strokeLinecap="round" />
              <ellipse cx="20" cy="30" rx="27" ry="28" fill="url(#gsTree)" />
              <ellipse cx="7" cy="27" rx="16" ry="18" fill="#568464" opacity="0.7" />
              <ellipse cx="32" cy="24" rx="15" ry="17" fill="#315b4b" opacity="0.75" />
              <circle cx="10" cy="24" r="1.5" fill="#c9ec9c" />
              <circle cx="29" cy="17" r="1.2" fill="#9ed8aa" />
            </g>
          ))}
          <g fill="#c9efa8" opacity={isNight ? 1 : 0.28}>
            {[[18, 92], [68, 108], [116, 82], [292, 94], [342, 105], [383, 88]].map(([x, y], index) => (
              <circle key={index} cx={x} cy={y} r={index % 2 ? 1.2 : 1.7} opacity={0.55 + (index % 3) * 0.12} />
            ))}
          </g>
        </g>
      )}

      {/* Foreground vignette */}
      <rect
        y="308"
        width="400"
        height="32"
        fill={isNight ? "#0d2420" : "#243329"}
        opacity={isNight ? 0.24 : isForest ? 0.16 : 0.13}
      />
    </svg>
  );
}

export default function GardenScene({
  visualStage,
  allDefinitions,
  earned,
  newlyUnlockedKeys,
  timeOfDay: timeOfDayOverride,
}: Props) {
  const { t } = useTranslation();
  const detectedTimeOfDay = useTimeOfDay();
  const timeOfDay = timeOfDayOverride ?? detectedTimeOfDay;
  const earnedKeys = new Set(earned.map((e) => e.key));

  // Stable paint order: back-to-front by layout y so overlaps feel grounded
  const ordered = [...allDefinitions].sort((a, b) => {
    const ay = GARDEN_LAYOUT[a.garden_element].y;
    const by = GARDEN_LAYOUT[b.garden_element].y;
    return ay - by || a.sort_order - b.sort_order;
  });

  return (
    <div
      className={`garden-scene garden-scene--${visualStage} garden-scene--${timeOfDay}`}
      role="img"
      aria-label={t("garden.sceneAria")}
    >
      <div className="garden-backdrop" aria-hidden>
        <GardenBackdrop visualStage={visualStage} timeOfDay={timeOfDay} />
      </div>

      {ordered.map((definition) => (
        <GardenElement
          key={definition.key}
          definition={definition}
          earned={earnedKeys.has(definition.key)}
          animateIn={newlyUnlockedKeys.includes(definition.key)}
        />
      ))}
    </div>
  );
}
