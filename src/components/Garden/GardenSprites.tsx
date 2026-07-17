import { useId, type ReactElement, type ReactNode } from "react";
import type { GardenElementId } from "@/constants/achievements";

interface SpriteProps {
  size?: number;
}

const OUTLINE = "#1a2e22";

function Shadow() {
  return <ellipse cx="20" cy="37" rx="10" ry="2" fill="#1a2e22" opacity="0.2" />;
}

function Frame({ size = 40, children }: { size?: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <Shadow />
      {children}
    </svg>
  );
}

function Sprout({ size = 36 }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size}>
      <defs>
        <linearGradient id={`${id}-soil`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e0c8a8" />
          <stop offset="100%" stopColor="#a88860" />
        </linearGradient>
        <linearGradient id={`${id}-l`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8fc49e" />
          <stop offset="100%" stopColor="#2d5241" />
        </linearGradient>
        <linearGradient id={`${id}-r`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a8d4b4" />
          <stop offset="100%" stopColor="#4a7c59" />
        </linearGradient>
      </defs>
      <ellipse cx="20" cy="33" rx="12" ry="5" fill={`url(#${id}-soil)`} stroke={OUTLINE} strokeWidth="1.2" />
      <ellipse cx="20" cy="31.5" rx="9" ry="2.2" fill="#c4a882" opacity="0.7" />
      <path d="M20 31 V14" stroke={OUTLINE} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M20 31 V14" stroke="#4a7c59" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M20 22 C12 19 8 14 6 8 C12 10 17 14 20 19 Z" fill={`url(#${id}-l)`} stroke={OUTLINE} strokeWidth="1" />
      <path d="M20 20 C28 17 32 12 34 6 C28 8 23 13 20 18 Z" fill={`url(#${id}-r)`} stroke={OUTLINE} strokeWidth="1" />
      <path d="M11 13 Q16 15 19 18" stroke="#c5e0cc" strokeWidth="0.9" fill="none" opacity="0.8" />
      <path d="M29 11 Q24 14 21 17" stroke="#eef4f0" strokeWidth="0.9" fill="none" opacity="0.75" />
    </Frame>
  );
}

function SensorMushroom({ size = 36 }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size}>
      <defs>
        <linearGradient id={`${id}-cap`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0a088" />
          <stop offset="100%" stopColor="#b84830" />
        </linearGradient>
        <linearGradient id={`${id}-stem`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#d8cfc4" />
          <stop offset="45%" stopColor="#f7f5f0" />
          <stop offset="100%" stopColor="#c8bfb4" />
        </linearGradient>
      </defs>
      <path d="M15.5 20 V31 Q15.5 34.5 20 34.5 Q24.5 34.5 24.5 31 V20" fill={`url(#${id}-stem)`} stroke={OUTLINE} strokeWidth="1.1" />
      <ellipse cx="20" cy="20" rx="5" ry="1.8" fill="#efe8df" stroke={OUTLINE} strokeWidth="0.8" />
      <path d="M5 20 Q7 6 20 5 Q33 6 35 20 Z" fill={`url(#${id}-cap)`} stroke={OUTLINE} strokeWidth="1.2" />
      <ellipse cx="13" cy="13" rx="2.4" ry="2" fill="#f7f5f0" />
      <ellipse cx="22" cy="11" rx="1.8" ry="1.5" fill="#f7f5f0" />
      <ellipse cx="28" cy="15" rx="1.5" ry="1.2" fill="#f7f5f0" opacity="0.9" />
      <path d="M9 11 Q15 8 21 9" stroke="#f4e1d9" strokeWidth="1.3" fill="none" opacity="0.55" />
      <circle cx="20" cy="15" r="2.2" fill="#2d5241" stroke={OUTLINE} strokeWidth="0.6" />
      <circle cx="20" cy="15" r="1.1" fill="#8fc49e" />
    </Frame>
  );
}

function VineLink({ size = 36 }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size}>
      <defs>
        <linearGradient id={`${id}-v`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1a2e22" />
          <stop offset="50%" stopColor="#4a7c59" />
          <stop offset="100%" stopColor="#6fa080" />
        </linearGradient>
      </defs>
      <path
        d="M6 31 C12 22 14 16 20 12 C26 8 29 12 34 24"
        stroke={`url(#${id}-v)`}
        strokeWidth="3.4"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M6 31 C12 22 14 16 20 12 C26 8 29 12 34 24"
        stroke={OUTLINE}
        strokeWidth="4.6"
        fill="none"
        strokeLinecap="round"
        opacity="0.25"
      />
      <ellipse cx="13" cy="18" rx="4.5" ry="2.8" fill="#4a7c59" stroke={OUTLINE} strokeWidth="0.9" transform="rotate(-40 13 18)" />
      <ellipse cx="23" cy="11" rx="4" ry="2.5" fill="#6fa080" stroke={OUTLINE} strokeWidth="0.9" transform="rotate(30 23 11)" />
      <ellipse cx="29" cy="18" rx="3.5" ry="2.2" fill="#2d5241" stroke={OUTLINE} strokeWidth="0.9" transform="rotate(-20 29 18)" />
      <circle cx="6" cy="31" r="3.8" fill="#d67a5b" stroke={OUTLINE} strokeWidth="1.1" />
      <circle cx="6" cy="31" r="1.6" fill="#f4e1d9" />
      <circle cx="34" cy="24" r="3.8" fill="#2d5241" stroke={OUTLINE} strokeWidth="1.1" />
      <circle cx="34" cy="24" r="1.6" fill="#6fa080" />
    </Frame>
  );
}

function Magnifier({ size = 36 }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size}>
      <defs>
        <radialGradient id={`${id}-lens`} cx="38%" cy="32%" r="62%">
          <stop offset="0%" stopColor="#f7f5f0" stopOpacity="0.95" />
          <stop offset="65%" stopColor="#a8c9b4" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#4a7c59" stopOpacity="0.3" />
        </radialGradient>
      </defs>
      <line x1="24" y1="23" x2="34" y2="34" stroke={OUTLINE} strokeWidth="5" strokeLinecap="round" />
      <line x1="24" y1="23" x2="34" y2="34" stroke="#6b3d28" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="15.5" cy="15" r="10.5" fill={`url(#${id}-lens)`} stroke={OUTLINE} strokeWidth="2.4" />
      <circle cx="15.5" cy="15" r="7.5" fill="none" stroke="#6fa080" strokeWidth="0.8" opacity="0.45" />
      <path d="M10 10 Q13 8 16.5 9.5" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.75" />
      <circle cx="13" cy="17" r="1.4" fill="#d67a5b" opacity="0.7" />
      <circle cx="18" cy="15" r="1" fill="#4a2b1c" opacity="0.45" />
      <circle cx="15" cy="20" r="0.8" fill="#4a7c59" opacity="0.55" />
    </Frame>
  );
}

function BellFlower({ size = 36 }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size}>
      <defs>
        <linearGradient id={`${id}-p`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0a088" />
          <stop offset="55%" stopColor="#d67a5b" />
          <stop offset="100%" stopColor="#a84830" />
        </linearGradient>
      </defs>
      <path d="M20 34 V22" stroke={OUTLINE} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M20 34 V22" stroke="#2d5241" strokeWidth="1.4" strokeLinecap="round" />
      <ellipse cx="14" cy="27" rx="4" ry="2" fill="#4a7c59" stroke={OUTLINE} strokeWidth="0.8" transform="rotate(-35 14 27)" />
      <ellipse cx="26" cy="28" rx="4" ry="2" fill="#6fa080" stroke={OUTLINE} strokeWidth="0.8" transform="rotate(35 26 28)" />
      <path
        d="M20 5 C11 5 8 14 8 20 C8 25 12 27 16 26 L18 22.5 Q20 25 22 22.5 L24 26 C28 27 32 25 32 20 C32 14 29 5 20 5 Z"
        fill={`url(#${id}-p)`}
        stroke={OUTLINE}
        strokeWidth="1.2"
      />
      <ellipse cx="15" cy="11" rx="3.2" ry="2.2" fill="#f4e1d9" opacity="0.5" />
      <circle cx="20" cy="8" r="2" fill="#f7f5f0" opacity="0.55" />
      <circle cx="20" cy="7.5" r="1.6" fill="#f7f5f0" stroke={OUTLINE} strokeWidth="0.7" />
    </Frame>
  );
}

function GardenGnome({ size = 36 }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size}>
      <defs>
        <linearGradient id={`${id}-hat`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0a088" />
          <stop offset="100%" stopColor="#b84830" />
        </linearGradient>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7eb892" />
          <stop offset="100%" stopColor="#2d5241" />
        </linearGradient>
      </defs>
      <ellipse cx="14.5" cy="35" rx="4.5" ry="2.2" fill="#4a2b1c" stroke={OUTLINE} strokeWidth="0.8" />
      <ellipse cx="25.5" cy="35" rx="4.5" ry="2.2" fill="#4a2b1c" stroke={OUTLINE} strokeWidth="0.8" />
      <path d="M11 22 Q11 35 20 35 Q29 35 29 22 Z" fill={`url(#${id}-body)`} stroke={OUTLINE} strokeWidth="1.1" />
      <ellipse cx="20" cy="22" rx="9" ry="3.2" fill="#8fc49e" stroke={OUTLINE} strokeWidth="0.8" />
      <path d="M12 20 Q13 29 20 31.5 Q27 29 28 20 Q20 25 12 20 Z" fill="#f7f5f0" stroke={OUTLINE} strokeWidth="0.9" />
      <circle cx="20" cy="16.5" r="6.5" fill="#f0d5c0" stroke={OUTLINE} strokeWidth="1.1" />
      <circle cx="17.2" cy="16" r="1.2" fill={OUTLINE} />
      <circle cx="22.8" cy="16" r="1.2" fill={OUTLINE} />
      <ellipse cx="20" cy="19" rx="1.6" ry="1.1" fill="#e89578" opacity="0.55" />
      <path d="M20 1.5 L30 17.5 H10 Z" fill={`url(#${id}-hat)`} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
      <ellipse cx="20" cy="17.5" rx="11" ry="2.6" fill="#d67a5b" stroke={OUTLINE} strokeWidth="0.9" />
      <path d="M15 7 Q18 4.5 21 6" stroke="#f4e1d9" strokeWidth="1.3" fill="none" opacity="0.55" />
    </Frame>
  );
}

function WateringCan({ size = 36 }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size}>
      <defs>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7eb892" />
          <stop offset="100%" stopColor="#1a2e22" />
        </linearGradient>
      </defs>
      <ellipse cx="31" cy="7" rx="1.5" ry="2.2" fill="#6fa080" opacity="0.75" />
      <ellipse cx="35" cy="12" rx="1.3" ry="1.9" fill="#4a7c59" opacity="0.6" />
      <ellipse cx="33" cy="17" rx="1.1" ry="1.5" fill="#6fa080" opacity="0.4" />
      <path d="M11 15 Q4 13 4 22 Q4 29 11 27" stroke={OUTLINE} strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <path d="M11 15 Q4 13 4 22 Q4 29 11 27" stroke="#2d5241" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path
        d="M10 13 H26 Q29 13 29 16 V29 Q29 32.5 24.5 32.5 H11.5 Q7 32.5 7 29 V16 Q7 13 10 13 Z"
        fill={`url(#${id}-b)`}
        stroke={OUTLINE}
        strokeWidth="1.2"
      />
      <path d="M12 16 H24" stroke="#a8d4b4" strokeWidth="1.6" opacity="0.45" strokeLinecap="round" />
      <path d="M29 17 L37 11.5 L38.5 15 L29 22.5 Z" fill="#2d5241" stroke={OUTLINE} strokeWidth="1" />
      <ellipse cx="37.5" cy="13.2" rx="1.6" ry="2.2" fill={OUTLINE} />
    </Frame>
  );
}

function GhostOrchid({ size = 36 }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size}>
      <defs>
        <radialGradient id={`${id}-b`} cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#eef4f0" />
          <stop offset="100%" stopColor="#b8cec0" />
        </radialGradient>
      </defs>
      <path d="M20 35 V24" stroke={OUTLINE} strokeWidth="2.2" strokeLinecap="round" />
      <ellipse cx="13" cy="29" rx="4.5" ry="2.2" fill="#4a7c59" stroke={OUTLINE} strokeWidth="0.8" transform="rotate(-28 13 29)" />
      <ellipse cx="20" cy="11" rx="5.5" ry="7.5" fill={`url(#${id}-b)`} stroke={OUTLINE} strokeWidth="1.1" />
      <ellipse cx="11" cy="16" rx="5.5" ry="6.5" fill={`url(#${id}-b)`} stroke={OUTLINE} strokeWidth="1.1" transform="rotate(-38 11 16)" />
      <ellipse cx="29" cy="16" rx="5.5" ry="6.5" fill={`url(#${id}-b)`} stroke={OUTLINE} strokeWidth="1.1" transform="rotate(38 29 16)" />
      <ellipse cx="20" cy="20" rx="6.5" ry="5.5" fill={`url(#${id}-b)`} stroke={OUTLINE} strokeWidth="1.1" />
      <circle cx="16.5" cy="16" r="1.4" fill={OUTLINE} opacity="0.55" />
      <circle cx="23.5" cy="16" r="1.4" fill={OUTLINE} opacity="0.55" />
      <path d="M16.5 21.5 Q20 25 23.5 21.5" stroke="#6fa080" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <ellipse cx="15" cy="9" rx="2.2" ry="1.6" fill="#fff" opacity="0.65" />
    </Frame>
  );
}

function BatteryBush({ size = 36 }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size}>
      <defs>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7eb892" />
          <stop offset="100%" stopColor="#1a2e22" />
        </linearGradient>
      </defs>
      <circle cx="9" cy="27" r="5.5" fill="#4a7c59" stroke={OUTLINE} strokeWidth="1" />
      <circle cx="31" cy="25" r="6" fill="#6fa080" stroke={OUTLINE} strokeWidth="1" />
      <circle cx="7" cy="31" r="3.8" fill="#d67a5b" stroke={OUTLINE} strokeWidth="0.9" />
      <circle cx="33" cy="30" r="3.4" fill="#e89578" stroke={OUTLINE} strokeWidth="0.9" />
      <rect x="11" y="7" width="18" height="26" rx="3.5" fill={`url(#${id}-b)`} stroke={OUTLINE} strokeWidth="1.2" />
      <rect x="16" y="3.5" width="8" height="5" rx="1.8" fill="#2d5241" stroke={OUTLINE} strokeWidth="0.9" />
      <rect x="14" y="11" width="12" height="3" rx="1" fill="#d8e5dc" opacity="0.35" />
      <rect x="14" y="27" width="12" height="3.8" rx="1" fill="#8fc49e" stroke={OUTLINE} strokeWidth="0.5" />
      <rect x="14" y="21.5" width="12" height="3.8" rx="1" fill="#8fc49e" stroke={OUTLINE} strokeWidth="0.5" />
      <rect x="14" y="16" width="12" height="3.8" rx="1" fill="#b8e0c4" stroke={OUTLINE} strokeWidth="0.5" />
    </Frame>
  );
}

function CloverCluster({ size = 36 }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size}>
      <defs>
        <radialGradient id={`${id}-l`} cx="38%" cy="32%" r="62%">
          <stop offset="0%" stopColor="#a8d4b4" />
          <stop offset="100%" stopColor="#1a2e22" />
        </radialGradient>
      </defs>
      <path d="M20 22 V35" stroke={OUTLINE} strokeWidth="2.2" strokeLinecap="round" />
      {[
        { cx: 20, cy: 11, rot: 0 },
        { cx: 11, cy: 18, rot: -18 },
        { cx: 29, cy: 18, rot: 18 },
        { cx: 20, cy: 25, rot: 0 },
      ].map(({ cx, cy, rot }, i) => (
        <g key={i} transform={`rotate(${rot} ${cx} ${cy})`}>
          <ellipse cx={cx} cy={cy} rx="6" ry="7" fill={`url(#${id}-l)`} stroke={OUTLINE} strokeWidth="1" />
          <path d={`M${cx} ${cy + 5.5} Q${cx} ${cy} ${cx} ${cy - 4.5}`} stroke="#c5e0cc" strokeWidth="0.9" fill="none" opacity="0.5" />
        </g>
      ))}
      <circle cx="20" cy="18" r="2.5" fill={OUTLINE} opacity="0.3" />
      <circle cx="20" cy="18" r="1.5" fill="#d67a5b" stroke={OUTLINE} strokeWidth="0.6" />
    </Frame>
  );
}

function FernPot({ size = 36 }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size}>
      <defs>
        <linearGradient id={`${id}-pot`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0a088" />
          <stop offset="100%" stopColor="#a84830" />
        </linearGradient>
      </defs>
      <path d="M20 23 C11 16 7 9 5 2" stroke="#2d5241" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M20 21 C29 14 33 7 35 1" stroke="#4a7c59" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M20 19 C15 10 13 5 11 0" stroke="#4a7c59" strokeWidth="1.9" fill="none" strokeLinecap="round" />
      <path d="M20 19 C25 10 27 4 29 0" stroke="#6fa080" strokeWidth="1.9" fill="none" strokeLinecap="round" />
      <path d="M20 17 C20 8 19 3 18 -1" stroke={OUTLINE} strokeWidth="1.7" fill="none" strokeLinecap="round" />
      <ellipse cx="9" cy="9" rx="2.8" ry="1.5" fill="#4a7c59" stroke={OUTLINE} strokeWidth="0.6" transform="rotate(-48 9 9)" />
      <ellipse cx="31" cy="8" rx="2.8" ry="1.5" fill="#6fa080" stroke={OUTLINE} strokeWidth="0.6" transform="rotate(48 31 8)" />
      <ellipse cx="13" cy="5" rx="2.2" ry="1.3" fill="#6fa080" stroke={OUTLINE} strokeWidth="0.5" transform="rotate(-38 13 5)" />
      <ellipse cx="27" cy="4" rx="2.2" ry="1.3" fill="#4a7c59" stroke={OUTLINE} strokeWidth="0.5" transform="rotate(38 27 4)" />
      <ellipse cx="20" cy="23" rx="12" ry="3.8" fill="#f4e1d9" stroke={OUTLINE} strokeWidth="1" />
      <path d="M9 23 L11.5 35 Q11.5 37.5 20 37.5 Q28.5 37.5 28.5 35 L31 23 Z" fill={`url(#${id}-pot)`} stroke={OUTLINE} strokeWidth="1.2" />
      <ellipse cx="20" cy="23" rx="11" ry="3" fill="#d67a5b" />
      <path d="M13 29 H27" stroke="#f4e1d9" strokeWidth="1.1" opacity="0.4" />
    </Frame>
  );
}

function LabelStake({ size = 36 }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size}>
      <defs>
        <linearGradient id={`${id}-w`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5c3d28" />
          <stop offset="50%" stopColor="#8a5a3c" />
          <stop offset="100%" stopColor="#4a2b1c" />
        </linearGradient>
        <linearGradient id={`${id}-l`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f7f5f0" />
          <stop offset="100%" stopColor="#e0ebe4" />
        </linearGradient>
      </defs>
      <rect x="18" y="16" width="4.2" height="21" rx="1.2" fill={`url(#${id}-w)`} stroke={OUTLINE} strokeWidth="0.9" />
      <path d="M18 37 L20.1 39.5 L22.2 37" fill="#4a2b1c" stroke={OUTLINE} strokeWidth="0.6" />
      <rect x="5" y="5" width="30" height="15" rx="3.2" fill={`url(#${id}-l)`} stroke={OUTLINE} strokeWidth="1.3" />
      <rect x="5" y="5" width="30" height="3.5" rx="3.2" fill="#4a7c59" opacity="0.28" />
      <line x1="10" y1="12" x2="30" y2="12" stroke="#4a7c59" strokeWidth="2" strokeLinecap="round" />
      <line x1="10" y1="16.5" x2="24" y2="16.5" stroke="#6fa080" strokeWidth="1.6" strokeLinecap="round" />
    </Frame>
  );
}

function CameraSunflower({ size = 36 }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size}>
      <defs>
        <linearGradient id={`${id}-p`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8e07a" />
          <stop offset="100%" stopColor="#c4922a" />
        </linearGradient>
        <radialGradient id={`${id}-c`} cx="42%" cy="38%" r="58%">
          <stop offset="0%" stopColor="#6b4a32" />
          <stop offset="100%" stopColor="#1a1008" />
        </radialGradient>
      </defs>
      <path d="M20 36 V26" stroke={OUTLINE} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M20 36 V26" stroke="#2d5241" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="14" cy="31" rx="4.5" ry="2.2" fill="#4a7c59" stroke={OUTLINE} strokeWidth="0.8" transform="rotate(-28 14 31)" />
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const cx = 20 + Math.cos(angle) * 8.2;
        const cy = 15.5 + Math.sin(angle) * 8.2;
        return (
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx="3.4"
            ry="5.2"
            fill={`url(#${id}-p)`}
            stroke={OUTLINE}
            strokeWidth="0.7"
            transform={`rotate(${i * 30} ${cx} ${cy})`}
          />
        );
      })}
      <circle cx="20" cy="15.5" r="6.5" fill={`url(#${id}-c)`} stroke={OUTLINE} strokeWidth="1.1" />
      <circle cx="20" cy="15.5" r="3.8" fill="#1a2e22" />
      <circle cx="20" cy="15.5" r="2.2" fill="#4a7c59" opacity="0.75" />
      <circle cx="18.2" cy="13.8" r="1.1" fill="#d8e5dc" opacity="0.75" />
    </Frame>
  );
}

function RainCloud({ size = 36 }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size}>
      <defs>
        <linearGradient id={`${id}-c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#b8c8c0" />
        </linearGradient>
      </defs>
      <ellipse cx="13" cy="13" rx="7.5" ry="6" fill={`url(#${id}-c)`} stroke={OUTLINE} strokeWidth="1.1" />
      <ellipse cx="25" cy="12" rx="8.5" ry="6.5" fill={`url(#${id}-c)`} stroke={OUTLINE} strokeWidth="1.1" />
      <ellipse cx="20" cy="16" rx="11" ry="5.5" fill={`url(#${id}-c)`} stroke={OUTLINE} strokeWidth="1.1" />
      <ellipse cx="11" cy="10" rx="3.2" ry="2" fill="#fff" opacity="0.55" />
      <path d="M12 24 L10 33" stroke="#4a7c59" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M20 25 L20 35" stroke="#2d5241" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M28 24 L30 33" stroke="#4a7c59" strokeWidth="2.2" strokeLinecap="round" />
    </Frame>
  );
}

function MirrorPond({ size = 36 }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size}>
      <defs>
        <radialGradient id={`${id}-w`} cx="38%" cy="32%" r="62%">
          <stop offset="0%" stopColor="#c8e4d8" />
          <stop offset="50%" stopColor="#6fa080" />
          <stop offset="100%" stopColor="#1a2e22" />
        </radialGradient>
      </defs>
      <ellipse cx="20" cy="25" rx="16" ry="9.5" fill="#2d5241" opacity="0.25" />
      <ellipse cx="20" cy="23.5" rx="15" ry="8.5" fill={`url(#${id}-w)`} stroke={OUTLINE} strokeWidth="1.2" />
      <ellipse cx="15" cy="20" rx="6.5" ry="3.2" fill="#eef4f0" opacity="0.5" />
      <path d="M9 22 Q16 17.5 23 21" stroke="#d8e5dc" strokeWidth="1.3" fill="none" opacity="0.55" />
      <ellipse cx="27" cy="27" rx="5" ry="2.8" fill="#4a7c59" stroke={OUTLINE} strokeWidth="0.8" />
      <path d="M27 27 L31.5 24.5" stroke={OUTLINE} strokeWidth="0.8" />
      <circle cx="24.5" cy="25.5" r="1.4" fill="#d67a5b" stroke={OUTLINE} strokeWidth="0.5" />
    </Frame>
  );
}

function WeekWreath({ size = 36 }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size}>
      <defs>
        <linearGradient id={`${id}-r`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8fc49e" />
          <stop offset="100%" stopColor="#1a2e22" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="13.5" fill="none" stroke={`url(#${id}-r)`} strokeWidth="5.5" />
      <circle cx="20" cy="20" r="13.5" fill="none" stroke={OUTLINE} strokeWidth="1.2" opacity="0.35" />
      <circle cx="20" cy="6.5" r="3.4" fill="#d67a5b" stroke={OUTLINE} strokeWidth="0.9" />
      <circle cx="20" cy="6.5" r="1.3" fill="#f4e1d9" />
      <circle cx="33.5" cy="20" r="3" fill="#4a7c59" stroke={OUTLINE} strokeWidth="0.8" />
      <circle cx="20" cy="33.5" r="3.4" fill="#d67a5b" stroke={OUTLINE} strokeWidth="0.9" />
      <circle cx="20" cy="33.5" r="1.3" fill="#f4e1d9" />
      <circle cx="6.5" cy="20" r="3" fill="#6fa080" stroke={OUTLINE} strokeWidth="0.8" />
      <circle cx="29" cy="9.5" r="2.2" fill="#e89578" stroke={OUTLINE} strokeWidth="0.7" />
      <circle cx="11" cy="9.5" r="2.2" fill="#8fc49e" stroke={OUTLINE} strokeWidth="0.7" />
      <circle cx="29" cy="30.5" r="2.2" fill="#8fc49e" stroke={OUTLINE} strokeWidth="0.7" />
      <circle cx="11" cy="30.5" r="2.2" fill="#e89578" stroke={OUTLINE} strokeWidth="0.7" />
    </Frame>
  );
}

function MonthSun({ size = 36 }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size}>
      <defs>
        <radialGradient id={`${id}-s`} cx="38%" cy="32%" r="62%">
          <stop offset="0%" stopColor="#fff6c8" />
          <stop offset="50%" stopColor="#e8b84a" />
          <stop offset="100%" stopColor="#b87820" />
        </radialGradient>
      </defs>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={20 + Math.cos(rad) * 11}
            y1={20 + Math.sin(rad) * 11}
            x2={20 + Math.cos(rad) * 17.5}
            y2={20 + Math.sin(rad) * 17.5}
            stroke="#e8b84a"
            strokeWidth="3"
            strokeLinecap="round"
          />
        );
      })}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line
            key={`o-${deg}`}
            x1={20 + Math.cos(rad) * 11}
            y1={20 + Math.sin(rad) * 11}
            x2={20 + Math.cos(rad) * 17.5}
            y2={20 + Math.sin(rad) * 17.5}
            stroke={OUTLINE}
            strokeWidth="4.2"
            strokeLinecap="round"
            opacity="0.2"
          />
        );
      })}
      <circle cx="20" cy="20" r="9.5" fill={`url(#${id}-s)`} stroke={OUTLINE} strokeWidth="1.3" />
      <circle cx="16.5" cy="16.5" r="3.2" fill="#fff" opacity="0.45" />
    </Frame>
  );
}

function PhoenixFern({ size = 36 }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size}>
      <defs>
        <linearGradient id={`${id}-f`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#d67a5b" />
          <stop offset="55%" stopColor="#e8b84a" />
          <stop offset="100%" stopColor="#fff0b0" />
        </linearGradient>
        <linearGradient id={`${id}-g`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#1a2e22" />
          <stop offset="100%" stopColor="#6fa080" />
        </linearGradient>
      </defs>
      <path d="M20 37 V17" stroke="#6b3d28" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M20 37 V17" stroke={OUTLINE} strokeWidth="1" strokeLinecap="round" opacity="0.3" />
      <path d="M20 22 C9 15 5 7 3 1 C10 5 16 12 20 18 Z" fill={`url(#${id}-f)`} stroke={OUTLINE} strokeWidth="1" />
      <path d="M20 20 C31 13 35 6 37 1 C30 4 24 11 20 17 Z" fill={`url(#${id}-g)`} stroke={OUTLINE} strokeWidth="1" />
      <circle cx="20" cy="15.5" r="4" fill="#e8b84a" stroke={OUTLINE} strokeWidth="1" />
      <circle cx="20" cy="15.5" r="2" fill="#fff6c8" />
    </Frame>
  );
}

function CompostBin({ size = 36 }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size}>
      <defs>
        <linearGradient id={`${id}-w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5a8a68" />
          <stop offset="100%" stopColor="#1a2e22" />
        </linearGradient>
      </defs>
      <path d="M6 12 L20 5 L34 12 L31 14.5 H9 Z" fill="#4a7c59" stroke={OUTLINE} strokeWidth="1.1" />
      <ellipse cx="20" cy="12.5" rx="14" ry="2.8" fill="#6fa080" stroke={OUTLINE} strokeWidth="0.8" />
      <path d="M9 13 H31 V33 Q31 36.5 20 36.5 Q9 36.5 9 33 Z" fill={`url(#${id}-w)`} stroke={OUTLINE} strokeWidth="1.2" />
      <line x1="16" y1="17" x2="16" y2="31" stroke="#d8e5dc" strokeWidth="1.3" opacity="0.35" />
      <line x1="24" y1="17" x2="24" y2="31" stroke="#d8e5dc" strokeWidth="1.3" opacity="0.35" />
      <ellipse cx="20" cy="29" rx="6.5" ry="2.8" fill="#6b3d28" opacity="0.55" />
      <circle cx="16.5" cy="28" r="1.6" fill="#d67a5b" />
      <circle cx="23.5" cy="29" r="1.3" fill="#6fa080" />
    </Frame>
  );
}

function HourglassLeaf({ size = 36 }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size}>
      <defs>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a5a3c" />
          <stop offset="100%" stopColor="#4a2b1c" />
        </linearGradient>
        <linearGradient id={`${id}-s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8b84a" />
          <stop offset="100%" stopColor="#d67a5b" />
        </linearGradient>
      </defs>
      <rect x="10" y="4" width="20" height="3.5" rx="1.2" fill={`url(#${id}-f)`} stroke={OUTLINE} strokeWidth="0.9" />
      <rect x="10" y="32.5" width="20" height="3.5" rx="1.2" fill={`url(#${id}-f)`} stroke={OUTLINE} strokeWidth="0.9" />
      <path
        d="M12 7.5 L20 20 L12 32.5 H28 L20 20 L28 7.5 Z"
        fill="#eef4f0"
        stroke={OUTLINE}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M14.5 9.5 L20 18 L25.5 9.5 Z" fill={`url(#${id}-s)`} opacity="0.75" />
      <ellipse cx="20" cy="28.5" rx="5.5" ry="2.8" fill={`url(#${id}-s)`} />
      <ellipse cx="20" cy="26.5" rx="3.2" ry="4.2" fill="#4a7c59" stroke={OUTLINE} strokeWidth="0.7" />
      <path d="M20 22.5 V30.5" stroke={OUTLINE} strokeWidth="0.8" />
    </Frame>
  );
}

function MoonMushroom({ size = 36 }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size}>
      <defs>
        <linearGradient id={`${id}-cap`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#b8c8c0" />
        </linearGradient>
        <radialGradient id={`${id}-moon`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff6c8" />
          <stop offset="100%" stopColor="#e8b84a" />
        </radialGradient>
      </defs>
      <path d="M15.5 20 V31 Q15.5 34.5 20 34.5 Q24.5 34.5 24.5 31 V20" fill="#d8e5dc" stroke={OUTLINE} strokeWidth="1.1" />
      <ellipse cx="20" cy="20" rx="5" ry="1.8" fill="#eef4f0" stroke={OUTLINE} strokeWidth="0.7" />
      <path d="M6 20 Q8 6.5 20 5.5 Q32 6.5 34 20 Z" fill={`url(#${id}-cap)`} stroke={OUTLINE} strokeWidth="1.2" />
      <ellipse cx="13" cy="13" rx="2.2" ry="1.8" fill="#d67a5b" opacity="0.55" />
      <ellipse cx="23" cy="11" rx="1.7" ry="1.4" fill="#d67a5b" opacity="0.45" />
      <ellipse cx="27" cy="16" rx="1.4" ry="1.1" fill="#d67a5b" opacity="0.4" />
      <path d="M31 5 A7.5 7.5 0 1 1 31 18 A5.5 5.5 0 1 0 31 5" fill={`url(#${id}-moon)`} stroke={OUTLINE} strokeWidth="0.9" />
    </Frame>
  );
}

const SPRITES: Record<GardenElementId, (props: SpriteProps) => ReactElement> = {
  sprout: Sprout,
  sensor_mushroom: SensorMushroom,
  vine_link: VineLink,
  magnifier: Magnifier,
  bell_flower: BellFlower,
  garden_gnome: GardenGnome,
  watering_can: WateringCan,
  ghost_orchid: GhostOrchid,
  battery_bush: BatteryBush,
  clover_cluster: CloverCluster,
  fern_pot: FernPot,
  label_stake: LabelStake,
  camera_sunflower: CameraSunflower,
  rain_cloud: RainCloud,
  mirror_pond: MirrorPond,
  week_wreath: WeekWreath,
  month_sun: MonthSun,
  phoenix_fern: PhoenixFern,
  compost_bin: CompostBin,
  hourglass_leaf: HourglassLeaf,
  moon_mushroom: MoonMushroom,
};

export function GardenSprite({ element, size = 40 }: { element: GardenElementId; size?: number }) {
  const Comp = SPRITES[element] ?? Sprout;
  return <Comp size={size} />;
}

/** Placeholder sprite shown in place of the real artwork for hidden locked badges. */
export function MysterySprite({ size = 40 }: { size?: number }) {
  return (
    <Frame size={size}>
      {/* Seed-packet body */}
      <rect x="8" y="10" width="24" height="22" rx="3" fill="#8a9e94" stroke="#5a7068" strokeWidth="1.2" />
      {/* Top flap */}
      <rect x="8" y="10" width="24" height="8" rx="3" fill="#6b8078" stroke="#5a7068" strokeWidth="1.2" />
      {/* Bottom of top flap (square off bottom edge) */}
      <rect x="8" y="15" width="24" height="3" fill="#6b8078" />
      {/* Fold crease */}
      <line x1="8" y1="18" x2="32" y2="18" stroke="#5a7068" strokeWidth="0.8" opacity="0.6" />
      {/* Question mark */}
      <text
        x="20"
        y="29"
        textAnchor="middle"
        fontSize="11"
        fontWeight="bold"
        fill="#ffffff"
        opacity="0.85"
        fontFamily="serif"
      >
        ?
      </text>
    </Frame>
  );
}
