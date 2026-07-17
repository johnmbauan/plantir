import { GARDEN_LAYOUT, type GardenVisualStage } from "@/constants/achievements";
import type { AchievementDefinition, EarnedAchievement } from "@/services/achievementService";
import GardenElement from "./GardenElement";
import "./GardenScene.css";

interface Props {
  visualStage: GardenVisualStage;
  allDefinitions: AchievementDefinition[];
  earned: EarnedAchievement[];
  newlyUnlockedKeys: string[];
}

function GardenBackdrop({ visualStage }: { visualStage: GardenVisualStage }) {
  const isForest = visualStage === "forest";
  const isGarden = visualStage === "garden" || isForest;
  const isSoil = visualStage === "soil";

  return (
    <svg
      className="garden-backdrop-svg"
      viewBox="0 0 400 340"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="gsSky" x1="0" y1="0" x2="0" y2="1">
          {isSoil ? (
            <>
              <stop offset="0%" stopColor="#f0ebe4" />
              <stop offset="50%" stopColor="#e0d5c8" />
              <stop offset="100%" stopColor="#c8b89e" />
            </>
          ) : isForest ? (
            <>
              <stop offset="0%" stopColor="#c8ddd2" />
              <stop offset="40%" stopColor="#90b89a" />
              <stop offset="100%" stopColor="#5a8868" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#e8f2ec" />
              <stop offset="35%" stopColor="#d0e2d8" />
              <stop offset="100%" stopColor="#a0c8a8" />
            </>
          )}
        </linearGradient>
        <radialGradient id="gsSun" cx="70%" cy="12%" r="30%">
          <stop offset="0%" stopColor="#fff8d0" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#f0d878" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#f0d878" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="gsHillFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isForest ? "#5f8a68" : "#b0d4b8"} />
          <stop offset="100%" stopColor={isForest ? "#3d5c44" : "#88b090"} />
        </linearGradient>
        <linearGradient id="gsHillNear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isForest ? "#4a7858" : "#90c098"} />
          <stop offset="100%" stopColor={isForest ? "#2d5241" : "#68a072"} />
        </linearGradient>
        <linearGradient id="gsLawn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isSoil ? "#b8a07a" : isForest ? "#3d6850" : "#5a9870"} />
          <stop offset="50%" stopColor={isSoil ? "#9a8060" : isForest ? "#2a5040" : "#408058"} />
          <stop offset="100%" stopColor={isSoil ? "#7a6040" : isForest ? "#1a3828" : "#2a6040"} />
        </linearGradient>
        <linearGradient id="gsSoil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5c3928" />
          <stop offset="100%" stopColor="#3a2010" />
        </linearGradient>
        <linearGradient id="gsFence" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4b88e" />
          <stop offset="100%" stopColor="#a88860" />
        </linearGradient>
        <linearGradient id="gsPot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8a07e" />
          <stop offset="100%" stopColor="#b85a3e" />
        </linearGradient>
        <linearGradient id="gsTree" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a8860" />
          <stop offset="100%" stopColor="#1a3020" />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect width="400" height="340" fill="url(#gsSky)" />
      <ellipse cx="280" cy="40" rx="90" ry="65" fill="url(#gsSun)" />
      {!isForest && <circle cx="282" cy="36" r="15" fill="#fff6d0" opacity="0.85" />}

      {/* Clouds */}
      {!isForest && (
        <g fill="#fff" opacity={isSoil ? 0.3 : 0.5}>
          <g transform="translate(35, 30)">
            <ellipse cx="0" cy="8" rx="20" ry="9" />
            <ellipse cx="16" cy="4" rx="14" ry="8" />
            <ellipse cx="-10" cy="10" rx="10" ry="6" />
            <ellipse cx="8" cy="0" rx="12" ry="7" />
          </g>
          <g transform="translate(170, 22)">
            <ellipse cx="0" cy="6" rx="22" ry="8" />
            <ellipse cx="18" cy="2" rx="12" ry="7" />
            <ellipse cx="-8" cy="8" rx="10" ry="5" />
          </g>
          <g transform="translate(340, 35)">
            <ellipse cx="0" cy="5" rx="16" ry="7" />
            <ellipse cx="12" cy="2" rx="10" ry="6" />
          </g>
        </g>
      )}

      {/* Distant hills */}
      {isGarden && (
        <>
          <path
            d="M0 115 C40 100 90 108 140 95 C200 82 260 92 320 85 C360 80 390 90 400 88 V145 H0Z"
            fill="url(#gsHillFar)"
            opacity="0.45"
          />
          <path
            d="M0 128 C50 118 100 124 160 115 C220 108 280 118 340 110 C370 106 400 112 400 112 V150 H0Z"
            fill="url(#gsHillNear)"
            opacity="0.55"
          />
        </>
      )}

      {/* Wooden fence */}
      {isGarden && (
        <g opacity={isForest ? 0.3 : 0.5}>
          <line x1="0" y1="112" x2="400" y2="112" stroke="#a08060" strokeWidth="2" />
          <line x1="0" y1="122" x2="400" y2="122" stroke="#a08060" strokeWidth="2" />
          {Array.from({ length: 27 }, (_, i) => {
            const x = 8 + i * 15;
            return (
              <g key={i}>
                <rect x={x - 2.5} y={102} width={5} height={24} rx={1} fill="url(#gsFence)" />
                <polygon points={`${x - 2.5},102 ${x},97 ${x + 2.5},102`} fill="url(#gsFence)" />
              </g>
            );
          })}
        </g>
      )}

      {/* Main lawn */}
      <path
        d="M0 138 C60 125 130 132 200 122 C270 114 340 126 400 120 V340 H0Z"
        fill="url(#gsLawn)"
      />

      {/* Lawn shadow patches for depth */}
      <g opacity="0.07">
        <ellipse cx="50" cy="235" rx="30" ry="10" fill="#000" />
        <ellipse cx="160" cy="275" rx="25" ry="8" fill="#000" />
        <ellipse cx="350" cy="255" rx="32" ry="11" fill="#000" />
        <ellipse cx="290" cy="300" rx="28" ry="9" fill="#000" />
      </g>

      {/* Gravel path */}
      <path
        d="M178 340 C183 305 192 270 204 240 C216 210 232 192 250 178"
        fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="38" strokeLinecap="round"
      />
      <path
        d="M176 340 C181 305 190 270 202 240 C214 210 230 192 248 178"
        fill="none" stroke="#c8b898" strokeWidth="32" strokeLinecap="round"
      />
      <path
        d="M176 340 C181 305 190 270 202 240 C214 210 230 192 248 178"
        fill="none" stroke="#ddd0b8" strokeWidth="18" strokeLinecap="round"
      />
      <g fill="#e8ddd0" opacity="0.65">
        {[
          [180, 325, -5], [184, 298, 3], [191, 272, -8], [199, 248, 5],
          [210, 226, -3], [225, 206, 6], [240, 188, -4],
        ].map(([cx, cy, r], i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={9} ry={4.5} transform={`rotate(${r} ${cx} ${cy})`} />
        ))}
      </g>

      {/* Raised beds */}
      {/* Left bed */}
      <g>
        <ellipse cx="75" cy="178" rx="42" ry="18" fill="rgba(0,0,0,0.1)" />
        <ellipse cx="75" cy="172" rx="42" ry="20" fill="#9e7a5a" />
        <ellipse cx="75" cy="170" rx="40" ry="18" fill="#b08e68" />
        <ellipse cx="75" cy="168" rx="36" ry="15" fill="url(#gsSoil)" />
        <g stroke="#6b4a32" strokeWidth="0.5" opacity="0.2">
          <line x1="50" y1="165" x2="100" y2="165" />
          <line x1="46" y1="168" x2="104" y2="168" />
          <line x1="50" y1="171" x2="100" y2="171" />
        </g>
      </g>
      {/* Center bed */}
      <g>
        <ellipse cx="195" cy="172" rx="60" ry="20" fill="rgba(0,0,0,0.1)" />
        <ellipse cx="195" cy="166" rx="58" ry="24" fill="#9e7a5a" />
        <ellipse cx="195" cy="164" rx="56" ry="22" fill="#b08e68" />
        <ellipse cx="195" cy="162" rx="52" ry="19" fill="url(#gsSoil)" />
        <g stroke="#6b4a32" strokeWidth="0.5" opacity="0.2">
          <line x1="155" y1="159" x2="235" y2="159" />
          <line x1="150" y1="162" x2="240" y2="162" />
          <line x1="155" y1="165" x2="235" y2="165" />
        </g>
      </g>
      {/* Right bed */}
      <g>
        <ellipse cx="328" cy="176" rx="48" ry="20" fill="rgba(0,0,0,0.1)" />
        <ellipse cx="328" cy="170" rx="46" ry="22" fill="#9e7a5a" />
        <ellipse cx="328" cy="168" rx="44" ry="20" fill="#b08e68" />
        <ellipse cx="328" cy="166" rx="40" ry="17" fill="url(#gsSoil)" />
        <g stroke="#6b4a32" strokeWidth="0.5" opacity="0.2">
          <line x1="298" y1="163" x2="358" y2="163" />
          <line x1="294" y1="166" x2="362" y2="166" />
          <line x1="298" y1="169" x2="358" y2="169" />
        </g>
      </g>

      {/* Bed border stones */}
      <g fill="#d0c8b8" opacity="0.55">
        {[
          [40, 182], [54, 188], [70, 192], [90, 190], [105, 183], [112, 176],
          [142, 180], [160, 186], [182, 190], [210, 190], [232, 184], [248, 178], [256, 170],
          [288, 182], [306, 188], [326, 192], [350, 190], [366, 184], [376, 176],
        ].map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx={3 + (i % 2)} ry={2} transform={`rotate(${(i * 15) % 45} ${x} ${y})`} />
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

      {/* Wildflowers */}
      {isGarden && (
        <g opacity="0.5">
          {([
            [30, 200, "#f5e866"], [55, 228, "#fff"], [115, 208, "#f5e866"],
            [140, 248, "#d8a0d8"], [265, 198, "#fff"], [285, 238, "#f5e866"],
            [360, 208, "#d8a0d8"], [380, 248, "#fff"], [20, 268, "#f5e866"],
            [100, 258, "#fff"], [320, 278, "#f5e866"], [370, 288, "#d8a0d8"],
          ] as const).map(([x, y, fill], i) => (
            <circle key={i} cx={x} cy={y} r={1.2 + (i % 3) * 0.3} fill={fill} />
          ))}
        </g>
      )}

      {/* Decorative pots */}
      <g>
        <g transform="translate(18, 285)" opacity="0.85">
          <ellipse cx="18" cy="5" rx="16" ry="5" fill="#f4e1d9" />
          <path d="M4 5 L7 30 Q7 34 18 34 Q29 34 29 30 L32 5 Z" fill="url(#gsPot)" />
          <ellipse cx="18" cy="5" rx="13" ry="4" fill="#d67a5b" />
          <ellipse cx="18" cy="5" rx="9" ry="2.5" fill="#6b4a32" opacity="0.5" />
        </g>
        <g transform="translate(352, 290)" opacity="0.8">
          <ellipse cx="15" cy="4" rx="14" ry="4.5" fill="#f4e1d9" />
          <path d="M3 4 L5 26 Q5 29 15 29 Q25 29 25 26 L27 4 Z" fill="url(#gsPot)" />
          <ellipse cx="15" cy="4" rx="12" ry="3.5" fill="#d67a5b" />
          <ellipse cx="15" cy="4" rx="8" ry="2" fill="#6b4a32" opacity="0.5" />
        </g>
      </g>

      {/* Trellis */}
      {isGarden && (
        <g transform="translate(358, 120)" opacity="0.6">
          <g stroke="#7a5838" strokeWidth="2" fill="none" strokeLinecap="round">
            <path d="M0 68 V8 Q0 0 8 0 H38 Q46 0 46 8 V68" />
            <line x1="0" y1="22" x2="46" y2="22" />
            <line x1="0" y1="44" x2="46" y2="44" />
            <line x1="15" y1="0" x2="15" y2="68" />
            <line x1="31" y1="0" x2="31" y2="68" />
          </g>
          <path
            d="M5 62 C12 42 7 24 16 10 C24 18 20 38 26 55"
            stroke="#4a7c59" strokeWidth="2" fill="none" strokeLinecap="round"
          />
          <ellipse cx="16" cy="12" rx="3.5" ry="2.2" fill="#4a7c59" />
          <ellipse cx="22" cy="34" rx="3" ry="2" fill="#6fa080" />
          <ellipse cx="10" cy="46" rx="2.5" ry="1.8" fill="#4a7c59" />
        </g>
      )}

      {/* Forest trees */}
      {isForest && (
        <g opacity="0.75">
          {[
            { x: 5, s: 1.0, y: 85 },
            { x: 50, s: 0.75, y: 98 },
            { x: 360, s: 0.9, y: 90 },
          ].map(({ x, s, y }) => (
            <g key={x} transform={`translate(${x}, ${y}) scale(${s})`}>
              <rect x="16" y="50" width="8" height="42" rx="2" fill="#4a2b1c" />
              <ellipse cx="20" cy="38" rx="22" ry="30" fill="url(#gsTree)" />
              <ellipse cx="10" cy="28" rx="12" ry="14" fill="#4a7c59" opacity="0.5" />
              <ellipse cx="30" cy="32" rx="10" ry="12" fill="#2d5241" opacity="0.4" />
            </g>
          ))}
        </g>
      )}

      {/* Foreground vignette */}
      <rect y="308" width="400" height="32" fill="#2a1a0a" opacity="0.14" />
    </svg>
  );
}

export default function GardenScene({ visualStage, allDefinitions, earned, newlyUnlockedKeys }: Props) {
  const earnedKeys = new Set(earned.map((e) => e.key));

  // Stable paint order: back-to-front by layout y so overlaps feel grounded
  const ordered = [...allDefinitions].sort((a, b) => {
    const ay = GARDEN_LAYOUT[a.garden_element].y;
    const by = GARDEN_LAYOUT[b.garden_element].y;
    return ay - by || a.sort_order - b.sort_order;
  });

  return (
    <div
      className={`garden-scene garden-scene--${visualStage}`}
      role="img"
      aria-label="Your growing garden"
    >
      <div className="garden-backdrop" aria-hidden>
        <GardenBackdrop visualStage={visualStage} />
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
