import { useId, type ReactElement, type ReactNode } from "react";
import type { GardenElementId } from "@/constants/achievements";

interface SpriteProps {
  size?: number;
  animated?: boolean;
}

const OUTLINE = "#1a2e22";

function Shadow() {
  return <ellipse className="garden-sprite__shadow" cx="20" cy="37" rx="10" ry="2" fill="#1a2e22" opacity="0.2" />;
}

function Frame({ size = 40, animated = false, motion, children }: { size?: number; animated?: boolean; motion?: string; children: ReactNode }) {
  return (
    <svg
      className={`garden-sprite${animated ? " garden-sprite--animated" : ""}`}
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden
      data-testid="garden-sprite-svg"
    >
      <Shadow />
      {motion ? <g className={`garden-sprite__motion garden-sprite__motion--${motion}`}>{children}</g> : children}
    </svg>
  );
}

function Sprout({ size = 36, animated = false }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size} animated={animated}>
      <defs>
        <radialGradient id={`${id}-body`} cx="34%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#b9df9f" />
          <stop offset="58%" stopColor="#78ad69" />
          <stop offset="100%" stopColor="#3f704c" />
        </radialGradient>
        <linearGradient id={`${id}-leaf-left`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d8ef9b" />
          <stop offset="100%" stopColor="#57945c" />
        </linearGradient>
        <linearGradient id={`${id}-leaf-right`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0f3a8" />
          <stop offset="100%" stopColor="#69a75e" />
        </linearGradient>
      </defs>
      <g className="garden-sprite__idle garden-sprite__idle--sprout">
        {/* Root-like feet */}
        <path d="M15 31 Q10 32 8 35 Q12 36.5 17 34" fill="#d9c69a" stroke={OUTLINE} strokeWidth="1.1" strokeLinejoin="round" />
        <path d="M25 31 Q30 32 32 35 Q28 36.5 23 34" fill="#d9c69a" stroke={OUTLINE} strokeWidth="1.1" strokeLinejoin="round" />

        {/* Plump seed body */}
        <path
          d="M20 14 C12.5 14 8 20 9.5 27.5 C10.8 34 15.2 36 20 36 C24.8 36 29.2 34 30.5 27.5 C32 20 27.5 14 20 14 Z"
          fill={`url(#${id}-body)`}
          stroke={OUTLINE}
          strokeWidth="1.3"
        />
        <path d="M12.5 21 Q14.5 17 18 16.5" stroke="#e6f4bd" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7" />

        {/* Leaf ears form a distinct crown instead of a normal sprout */}
        <g className="sprout-creature__leaf sprout-creature__leaf--left">
          <path
            d="M19 16 C12 15.5 7 11 6 5.5 C12 5.8 18 8.8 20.5 14 Z"
            fill={`url(#${id}-leaf-left)`}
            stroke={OUTLINE}
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
          <path d="M9 8 Q14 10 18.5 14" stroke="#f1f5bd" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.75" />
        </g>
        <g className="sprout-creature__leaf sprout-creature__leaf--right">
          <path
            d="M21 15 C22.5 8.5 28 4.5 34 4 C33 10.5 28.5 15 21 17 Z"
            fill={`url(#${id}-leaf-right)`}
            stroke={OUTLINE}
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
          <path d="M31 7 Q26 10 22 14" stroke="#f8f6cf" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.75" />
        </g>

        {/* Curious creature face */}
        <g className="sprout-creature__eye sprout-creature__eye--left">
          <ellipse cx="15.8" cy="24.2" rx="2.2" ry="2.8" fill={OUTLINE} />
          <circle cx="15.2" cy="23.3" r="0.8" fill="#ffffff" />
          <circle cx="16.4" cy="25.2" r="0.4" fill="#8fc49e" />
        </g>
        <g className="sprout-creature__eye sprout-creature__eye--right">
          <ellipse cx="24.2" cy="24.2" rx="2.2" ry="2.8" fill={OUTLINE} />
          <circle cx="23.6" cy="23.3" r="0.8" fill="#ffffff" />
          <circle cx="24.8" cy="25.2" r="0.4" fill="#8fc49e" />
        </g>
        <path d="M17.5 29 Q20 31.2 22.5 29" stroke={OUTLINE} strokeWidth="1.1" fill="none" strokeLinecap="round" />
        <ellipse cx="13" cy="28.2" rx="2" ry="1" fill="#ef9b82" opacity="0.55" />
        <ellipse cx="27" cy="28.2" rx="2" ry="1" fill="#ef9b82" opacity="0.55" />
      </g>
    </Frame>
  );
}

function SensorMushroom({ size = 36, animated = false }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size} animated={animated} motion={animated ? "sensor" : undefined}>
      <defs>
        <radialGradient id={`${id}-cap`} cx="35%" cy="25%" r="75%">
          <stop offset="0%" stopColor="#ffb58f" />
          <stop offset="58%" stopColor="#df6b58" />
          <stop offset="100%" stopColor="#943e49" />
        </radialGradient>
        <radialGradient id={`${id}-body`} cx="38%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#fff9e9" />
          <stop offset="65%" stopColor="#d8ded0" />
          <stop offset="100%" stopColor="#9cae9d" />
        </radialGradient>
        <radialGradient id={`${id}-signal`} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#eaffcf" />
          <stop offset="55%" stopColor="#82d99c" />
          <stop offset="100%" stopColor="#31816b" />
        </radialGradient>
        <linearGradient id={`${id}-gill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8dfc6" />
          <stop offset="100%" stopColor="#bd8e86" />
        </linearGradient>
      </defs>

      {/* Short feet and balancing arms */}
      <ellipse cx="14.8" cy="35" rx="4.2" ry="2" fill="#9cae9d" stroke={OUTLINE} strokeWidth="1" transform="rotate(-8 14.8 35)" />
      <ellipse cx="25.2" cy="35" rx="4.2" ry="2" fill="#9cae9d" stroke={OUTLINE} strokeWidth="1" transform="rotate(8 25.2 35)" />
      <path d="M12 26 Q7 27 6 31 Q9.5 31.5 13 29" fill={`url(#${id}-body)`} stroke={OUTLINE} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M28 26 Q33 27 34 31 Q30.5 31.5 27 29" fill={`url(#${id}-body)`} stroke={OUTLINE} strokeWidth="1.1" strokeLinecap="round" />

      {/* Pear-shaped creature body */}
      <path
        d="M15.5 18 C12.5 22 11.5 28 12.8 32 C14 35.5 17 36.2 20 36.2 C23 36.2 26 35.5 27.2 32 C28.5 28 27.5 22 24.5 18 Z"
        fill={`url(#${id}-body)`}
        stroke={OUTLINE}
        strokeWidth="1.2"
      />
      <path d="M15 22 Q16 20 18 19.5" stroke="#ffffff" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.65" />

      {/* Sensory cap and soft gills */}
      <ellipse cx="20" cy="19.2" rx="12.5" ry="4.3" fill={`url(#${id}-gill)`} stroke={OUTLINE} strokeWidth="1.1" />
      <path
        d="M5.5 18.5 C7 10 12.5 6 20 6 C27.5 6 33 10 34.5 18.5 C29 17.2 25 18.8 20 18.8 C15 18.8 11 17.2 5.5 18.5 Z"
        fill={`url(#${id}-cap)`}
        stroke={OUTLINE}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M9.5 13 Q14 8.5 20 9" stroke="#ffd8bd" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M11 18 Q12 20.5 14 21.3 M17 18.7 Q18 21 20 21.5 M23 18.7 Q22 21 20 21.5 M29 18 Q28 20.5 26 21.3" stroke="#875263" strokeWidth="0.7" fill="none" opacity="0.65" />

      {/* Twin feelers read the surrounding soil */}
      <path d="M13 9 Q10 5.5 11.5 2.8" stroke={OUTLINE} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M27 9 Q30 5.5 28.5 2.8" stroke={OUTLINE} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <circle className="garden-sprite__glow" cx="11.5" cy="2.8" r="2" fill={`url(#${id}-signal)`} stroke={OUTLINE} strokeWidth="0.8" />
      <circle className="garden-sprite__glow" cx="28.5" cy="2.8" r="2" fill={`url(#${id}-signal)`} stroke={OUTLINE} strokeWidth="0.8" />
      <circle cx="10.9" cy="2.2" r="0.6" fill="#ffffff" opacity="0.8" />
      <circle cx="27.9" cy="2.2" r="0.6" fill="#ffffff" opacity="0.8" />

      {/* Alert, friendly face */}
      <ellipse cx="16.6" cy="27" rx="2" ry="2.5" fill={OUTLINE} />
      <ellipse cx="23.4" cy="27" rx="2" ry="2.5" fill={OUTLINE} />
      <circle cx="16.1" cy="26.2" r="0.7" fill="#ffffff" />
      <circle cx="22.9" cy="26.2" r="0.7" fill="#ffffff" />
      <path d="M18 31 Q20 32.6 22 31" stroke="#7e4d50" strokeWidth="1" fill="none" strokeLinecap="round" />
      <circle className="garden-sprite__glow" cx="20" cy="23" r="1.5" fill={`url(#${id}-signal)`} stroke={OUTLINE} strokeWidth="0.7" />
    </Frame>
  );
}

function VineLink({ size = 36, animated = false }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size} animated={animated} motion={animated ? "vine" : undefined}>
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#397056" />
          <stop offset="52%" stopColor="#68a968" />
          <stop offset="100%" stopColor="#a5cf76" />
        </linearGradient>
        <radialGradient id={`${id}-head`} cx="35%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#cce49a" />
          <stop offset="62%" stopColor="#79b76e" />
          <stop offset="100%" stopColor="#42805c" />
        </radialGradient>
        <linearGradient id={`${id}-fin`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e2e99a" />
          <stop offset="100%" stopColor="#4d9560" />
        </linearGradient>
        <radialGradient id={`${id}-bond`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fff7bd" />
          <stop offset="55%" stopColor="#f1b85b" />
          <stop offset="100%" stopColor="#d76b52" />
        </radialGradient>
      </defs>

      {/* Coiling vine body */}
      <path
        d="M7 32 C11 35 17 34 17.5 29 C18 24 12 23 13 18 C14 13 20 11 26 14"
        stroke={OUTLINE}
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 32 C11 35 17 34 17.5 29 C18 24 12 23 13 18 C14 13 20 11 26 14"
        stroke={`url(#${id}-body)`}
        strokeWidth="4.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 30 Q12 32 14 30" stroke="#b7da8a" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.7" />

      {/* Leaf fins make the silhouette creature-like */}
      <path d="M12.8 20 C7 20 4 16.5 3.5 12 C8.5 12.5 12.5 15 14 18.2 Z" fill={`url(#${id}-fin)`} stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />
      <path d="M16 14 C15 8.5 18 5 22 3 C22.8 7.5 21 11.5 18 14 Z" fill={`url(#${id}-fin)`} stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />
      <path d="M15.8 25 C11 27 8 25 6 22 C10 21.3 13.5 22 16 23.8 Z" fill="#5f9f65" stroke={OUTLINE} strokeWidth="0.9" strokeLinejoin="round" />
      <path d="M5.5 15 Q9 16 12.5 18.5 M19.5 6 Q19.5 10 17.5 13" stroke="#eff2b5" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.7" />

      {/* Small grasping feet */}
      <path d="M14 28 Q9 27 8 29.5 Q10 31 14.8 30.5" fill="#83bc70" stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />
      <path d="M14 18 Q10 17 9 19.5 Q11 21 14.5 20.3" fill="#83bc70" stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />

      {/* Rounded head and leaf antenna */}
      <path d="M23.5 10.5 C27 8.5 32 10 34 13 C36.3 16.5 33.8 21.5 29.3 21.8 C25 22 22 18.8 22 15 C22 13.2 22.5 11.7 23.5 10.5 Z" fill={`url(#${id}-head)`} stroke={OUTLINE} strokeWidth="1.2" />
      <path d="M27 10.2 Q28 6.2 32 4.5 Q33 8.2 29.5 11" fill={`url(#${id}-fin)`} stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />
      <path d="M29.7 6.8 Q29.2 8.5 28.3 10" stroke="#f0f2b2" strokeWidth="0.7" fill="none" strokeLinecap="round" />

      {/* Face and paired bond markings */}
      <ellipse cx="27.3" cy="15" rx="1.7" ry="2.1" fill={OUTLINE} />
      <ellipse cx="32" cy="15.4" rx="1.5" ry="1.9" fill={OUTLINE} />
      <circle cx="26.8" cy="14.3" r="0.65" fill="#ffffff" />
      <circle cx="31.5" cy="14.8" r="0.55" fill="#ffffff" />
      <path d="M29 18.8 Q31 20 32.5 18.3" stroke={OUTLINE} strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <circle className="garden-sprite__glow" cx="7" cy="32" r="2.7" fill={`url(#${id}-bond)`} stroke={OUTLINE} strokeWidth="1" />
      <circle className="garden-sprite__glow" cx="24" cy="18.2" r="1.8" fill={`url(#${id}-bond)`} stroke={OUTLINE} strokeWidth="0.8" />
      <circle cx="6.3" cy="31.3" r="0.7" fill="#ffffff" opacity="0.75" />
      <circle cx="23.5" cy="17.7" r="0.5" fill="#ffffff" opacity="0.75" />
    </Frame>
  );
}

function Magnifier({ size = 36, animated = false }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size} animated={animated} motion={animated ? "scout" : undefined}>
      <defs>
        <radialGradient id={`${id}-fur`} cx="35%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#d6b98e" />
          <stop offset="62%" stopColor="#9a6c50" />
          <stop offset="100%" stopColor="#604334" />
        </radialGradient>
        <radialGradient id={`${id}-lens`} cx="35%" cy="28%" r="68%">
          <stop offset="0%" stopColor="#f8ffff" />
          <stop offset="38%" stopColor="#aee4d5" />
          <stop offset="72%" stopColor="#4b9a83" />
          <stop offset="100%" stopColor="#245b52" />
        </radialGradient>
        <linearGradient id={`${id}-claw`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff4d4" />
          <stop offset="100%" stopColor="#c5a979" />
        </linearGradient>
      </defs>

      {/* Curled sensing tail */}
      <path d="M29 27 Q37 26 36 33 Q35.5 37 31 35.5" stroke={OUTLINE} strokeWidth="4.2" fill="none" strokeLinecap="round" />
      <path d="M29 27 Q37 26 36 33 Q35.5 37 31 35.5" stroke="#9a6c50" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M31 35.5 L28.8 32.5 M31 35.5 L28 35 M31 35.5 L29.5 38" stroke="#c5a979" strokeWidth="1.2" strokeLinecap="round" />

      {/* Burrowing feet and pale digging claws */}
      <ellipse cx="14" cy="34.5" rx="6" ry="2.7" fill="#75503d" stroke={OUTLINE} strokeWidth="1" transform="rotate(-5 14 34.5)" />
      <ellipse cx="25" cy="34.5" rx="5.5" ry="2.6" fill="#75503d" stroke={OUTLINE} strokeWidth="1" transform="rotate(5 25 34.5)" />
      <path d="M9.5 34 L6 35.5 M12 35 L9 37 M28.5 34 L32 35.5 M26 35 L29 37" stroke={`url(#${id}-claw)`} strokeWidth="1.4" strokeLinecap="round" />

      {/* Round scout body */}
      <path d="M10.5 19 C7.5 25 9 32 14 35 C18 37.2 26 36 29 31 C32 26 29 19 24 17 Z" fill={`url(#${id}-fur)`} stroke={OUTLINE} strokeWidth="1.3" />
      <path d="M12.5 25 Q13.5 21 17 19.5" stroke="#ead1aa" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.55" />

      {/* Wide ears frame the central lens eye */}
      <path d="M12 18 C6 19 3.5 14 5 9.5 C9.5 9.5 13 12 14.5 16 Z" fill="#b98563" stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M26 17 C30 12 34 11.5 37 14.5 C35.5 19 31 21 27 20 Z" fill="#b98563" stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M7.5 12 Q10 13 12 16 M34 15 Q31 16 29 19" stroke="#e6b99d" strokeWidth="1" fill="none" strokeLinecap="round" />

      {/* Lens-like eye is part of the creature, not a held tool */}
      <circle className="scout-creature__lens" cx="20" cy="16.5" r="10.2" fill="#d6c29c" stroke={OUTLINE} strokeWidth="1.5" />
      <circle cx="20" cy="16.5" r="7.7" fill={`url(#${id}-lens)`} stroke={OUTLINE} strokeWidth="1.1" />
      <ellipse cx="20.8" cy="17.3" rx="2.6" ry="4.3" fill="#173c38" />
      <circle cx="18" cy="13.5" r="2" fill="#ffffff" opacity="0.8" />
      <circle cx="22.5" cy="18.8" r="0.8" fill="#bff3dc" opacity="0.65" />
      <path d="M14 11 Q17 8.5 21 9" stroke="#ffffff" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.55" />

      {/* Nose and investigative whiskers */}
      <path d="M17.5 28 Q20 26.5 22.5 28 Q20 30.5 17.5 28 Z" fill="#dc846f" stroke={OUTLINE} strokeWidth="0.9" />
      <path d="M17 29 L10 28 M17.5 30.5 L11 32 M23 29 L30 28 M22.5 30.5 L29 32" stroke="#f0dfc3" strokeWidth="0.8" strokeLinecap="round" opacity="0.8" />
    </Frame>
  );
}

function BellFlower({ size = 36, animated = false }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size} animated={animated} motion={animated ? "messenger" : undefined}>
      <defs>
        <radialGradient id={`${id}-body`} cx="36%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#ffe5ca" />
          <stop offset="58%" stopColor="#ee9d7e" />
          <stop offset="100%" stopColor="#b75358" />
        </radialGradient>
        <linearGradient id={`${id}-petal`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffc3a4" />
          <stop offset="55%" stopColor="#df6b68" />
          <stop offset="100%" stopColor="#8f3d55" />
        </linearGradient>
        <linearGradient id={`${id}-leaf`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#b8d985" />
          <stop offset="100%" stopColor="#39715a" />
        </linearGradient>
        <radialGradient id={`${id}-chime`} cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#fffbd4" />
          <stop offset="55%" stopColor="#f4cf62" />
          <stop offset="100%" stopColor="#cf764d" />
        </radialGradient>
      </defs>

      {/* Root feet */}
      <path d="M16 32 Q11 34 10 37 Q14 37.5 18 35" fill="#d6b778" stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />
      <path d="M24 32 Q29 34 30 37 Q26 37.5 22 35" fill="#d6b778" stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />

      {/* Leaf wings, posed as if carrying a message */}
      <path d="M13 22 C7 19 3.5 21 3 25 C7.5 28 11 27 14.5 25 Z" fill={`url(#${id}-leaf)`} stroke={OUTLINE} strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M27 22 C33 19 36.5 21 37 25 C32.5 28 29 27 25.5 25 Z" fill={`url(#${id}-leaf)`} stroke={OUTLINE} strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M6 24 Q10 24 13 24.5 M34 24 Q30 24 27 24.5" stroke="#d9e8a2" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.7" />

      {/* Small bird-like body */}
      <path d="M13.5 19 C10.5 24 11.5 31.5 15.5 34.5 C18 36.5 22 36.5 24.5 34.5 C28.5 31.5 29.5 24 26.5 19 Z" fill={`url(#${id}-body)`} stroke={OUTLINE} strokeWidth="1.2" />
      <ellipse cx="16" cy="25" rx="2.2" ry="2.6" fill={OUTLINE} />
      <ellipse cx="24" cy="25" rx="2.2" ry="2.6" fill={OUTLINE} />
      <circle cx="15.4" cy="24.2" r="0.75" fill="#ffffff" />
      <circle cx="23.4" cy="24.2" r="0.75" fill="#ffffff" />
      <path d="M18.2 28.8 L20 30.2 L21.8 28.8 Q20 27.8 18.2 28.8 Z" fill="#7e3f4d" stroke={OUTLINE} strokeWidth="0.7" strokeLinejoin="round" />

      {/* Bell-shaped petal hood */}
      <path
        d="M20 3 C13 3 8.5 8.5 9.5 17.5 L7 20.5 Q11 22 14 19.5 Q16 22 18 19.5 Q20 22.5 22 19.5 Q24 22 26 19.5 Q29 22 33 20.5 L30.5 17.5 C31.5 8.5 27 3 20 3 Z"
        fill={`url(#${id}-petal)`}
        stroke={OUTLINE}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M13 11 Q16 6.5 21 7" stroke="#ffe1ca" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M20 3 Q20 0.8 22 0.5" stroke="#39715a" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M22 0.5 Q25 0 26 2.5 Q23.5 3.5 21.5 2" fill={`url(#${id}-leaf)`} stroke={OUTLINE} strokeWidth="0.8" strokeLinejoin="round" />

      {/* The throat chime glows when the creature calls */}
      <path d="M20 30 V32" stroke="#7e3f4d" strokeWidth="1" />
      <circle className="garden-sprite__glow" cx="20" cy="33" r="2.5" fill={`url(#${id}-chime)`} stroke={OUTLINE} strokeWidth="0.8" />
      <circle cx="19.3" cy="32.3" r="0.65" fill="#ffffff" opacity="0.8" />
    </Frame>
  );
}

function GardenGnome({ size = 36, animated = false }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size} animated={animated} motion={animated ? "guardian" : undefined}>
      <defs>
        <radialGradient id={`${id}-fur`} cx="35%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#b8d19b" />
          <stop offset="58%" stopColor="#6d9a6b" />
          <stop offset="100%" stopColor="#345c4b" />
        </radialGradient>
        <linearGradient id={`${id}-bark`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#aa7b52" />
          <stop offset="52%" stopColor="#755039" />
          <stop offset="100%" stopColor="#493326" />
        </linearGradient>
        <linearGradient id={`${id}-moss`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d7e58e" />
          <stop offset="100%" stopColor="#4f8759" />
        </linearGradient>
        <radialGradient id={`${id}-node`} cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#f5ffd5" />
          <stop offset="55%" stopColor="#93d6a0" />
          <stop offset="100%" stopColor="#3f8b72" />
        </radialGradient>
      </defs>

      {/* Heavy rooted paws */}
      <path d="M8 29 Q5 34 7.5 36.5 Q11 38 15 34 L14 29 Z" fill={`url(#${id}-fur)`} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M32 29 Q35 34 32.5 36.5 Q29 38 25 34 L26 29 Z" fill={`url(#${id}-fur)`} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M7.5 35 L5 36.5 M10.5 36 L9 38 M32.5 35 L35 36.5 M29.5 36 L31 38" stroke="#d8c795" strokeWidth="1.2" strokeLinecap="round" />

      {/* Low, sturdy guardian body */}
      <path d="M7 19 C4 25 6.5 32 12 34 C17 36 25 36 30 33 C35 30 35.5 22 31 18 Z" fill={`url(#${id}-fur)`} stroke={OUTLINE} strokeWidth="1.4" />

      {/* Bark shell with three completed-setup nodes */}
      <path d="M9 20 C11 11 17 7.5 24 9 C30 10.5 33 15 32 22 C26 19.5 17 18.5 9 20 Z" fill={`url(#${id}-bark)`} stroke={OUTLINE} strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M12 18 Q20 12 29 18 M15 12.5 Q19 16 18 19 M24 10.8 Q22 15 23 19" stroke="#c89b68" strokeWidth="0.8" fill="none" opacity="0.55" />
      <circle className="garden-sprite__glow" cx="14" cy="17" r="2.5" fill={`url(#${id}-node)`} stroke={OUTLINE} strokeWidth="0.8" />
      <circle className="garden-sprite__glow" cx="21" cy="13.8" r="2.5" fill={`url(#${id}-node)`} stroke={OUTLINE} strokeWidth="0.8" />
      <circle className="garden-sprite__glow" cx="27.7" cy="17.2" r="2.5" fill={`url(#${id}-node)`} stroke={OUTLINE} strokeWidth="0.8" />
      <path d="M16.4 16 L18.6 14.7 M23.4 14.8 L25.4 16" stroke="#d9efaa" strokeWidth="1" strokeLinecap="round" />
      <circle cx="13.3" cy="16.3" r="0.7" fill="#ffffff" opacity="0.75" />
      <circle cx="20.3" cy="13.1" r="0.7" fill="#ffffff" opacity="0.75" />
      <circle cx="27" cy="16.5" r="0.7" fill="#ffffff" opacity="0.75" />

      {/* Moss crest and broad creature face */}
      <path d="M10 18 C9 12 12 7 16 4 C17 7 18 8 20 9 C21 5 24 2.5 28 2 C28 7 26 11 30 16 Z" fill={`url(#${id}-moss)`} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M14 9 Q16 6 17 5 M24 8 Q26 5 26.5 3.5" stroke="#eef0ad" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.65" />
      <path d="M10.5 19 C8 23 10.5 29 15 31 C18 32.5 22 32.5 25 31 C29.5 29 32 23 29.5 19 C24 17.5 16 17.5 10.5 19 Z" fill="#98b77d" stroke={OUTLINE} strokeWidth="1.2" />
      <path d="M12.5 21 Q16 18.5 20 19" stroke="#d7e0a7" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6" />
      <ellipse cx="15.4" cy="24" rx="2.1" ry="2.5" fill={OUTLINE} />
      <ellipse cx="24.6" cy="24" rx="2.1" ry="2.5" fill={OUTLINE} />
      <circle cx="14.8" cy="23.2" r="0.7" fill="#ffffff" />
      <circle cx="24" cy="23.2" r="0.7" fill="#ffffff" />
      <path d="M17 28 Q20 30 23 28" stroke={OUTLINE} strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M19 26.5 L20 27.3 L21 26.5" fill="#5a4735" stroke={OUTLINE} strokeWidth="0.6" strokeLinejoin="round" />
    </Frame>
  );
}

function WateringCan({ size = 36, animated = false }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size} animated={animated} motion={animated ? "dew" : undefined}>
      <defs>
        <radialGradient id={`${id}-body`} cx="34%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#c9ead9" />
          <stop offset="60%" stopColor="#74b99c" />
          <stop offset="100%" stopColor="#39765f" />
        </radialGradient>
        <radialGradient id={`${id}-pearl`} cx="34%" cy="25%" r="70%">
          <stop offset="0%" stopColor="#f4ffff" />
          <stop offset="38%" stopColor="#a5e7df" />
          <stop offset="72%" stopColor="#4baca8" />
          <stop offset="100%" stopColor="#287578" />
        </radialGradient>
        <linearGradient id={`${id}-leaf`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d7e99d" />
          <stop offset="100%" stopColor="#599665" />
        </linearGradient>
      </defs>

      {/* Leaf-shaped tail */}
      <path d="M11 24 C6 24 3 20.5 3 16.5 C7.5 16 11.5 18.5 14 22 Z" fill={`url(#${id}-leaf)`} stroke={OUTLINE} strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M5.5 18 Q9 19.5 12 22" stroke="#eef2bb" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.7" />

      {/* Four small, grounded feet */}
      <ellipse cx="13" cy="33.5" rx="4.5" ry="2.5" fill="#4c896d" stroke={OUTLINE} strokeWidth="1" transform="rotate(-8 13 33.5)" />
      <ellipse cx="25" cy="34" rx="4.5" ry="2.5" fill="#4c896d" stroke={OUTLINE} strokeWidth="1" transform="rotate(8 25 34)" />
      <path d="M10.5 34.5 L8.5 36 M13 35 L12 37 M27.5 35 L29.5 36.5 M25 35.5 L26 37" stroke="#d9e8a9" strokeWidth="1" strokeLinecap="round" />

      {/* Soft quadruped body */}
      <path d="M10 20 C8 25 10.5 31 15 33.5 C19 35.5 26 34.5 29 31 C32 27.5 29.5 21 25 19 Z" fill={`url(#${id}-body)`} stroke={OUTLINE} strokeWidth="1.3" />
      <path d="M12.5 23 Q14 20.5 17 20" stroke="#d9efdc" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.6" />

      {/* Leaves cradle the water pearl */}
      <path d="M12 19 C10 14 12 10 15 8 C18 11 18 15 16.5 19 Z" fill={`url(#${id}-leaf)`} stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />
      <path d="M23 19 C22 14 25 10 29 9 C30 14 27.5 18 24.5 20 Z" fill={`url(#${id}-leaf)`} stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />
      <circle className="garden-sprite__glow" cx="20.5" cy="13.5" r="8" fill={`url(#${id}-pearl)`} stroke={OUTLINE} strokeWidth="1.3" />
      <circle cx="18" cy="10.5" r="2.1" fill="#ffffff" opacity="0.7" />
      <path d="M15 15 Q20 18 26 14.5" stroke="#d9fff8" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.55" />

      {/* Friendly head with fin ears */}
      <path d="M25 18 C29 14.5 35 16 36.5 21 C38 25.5 34 30 29.5 29.5 C25 30 22 26.5 22.5 22.5 C22.7 20.5 23.5 19 25 18 Z" fill={`url(#${id}-body)`} stroke={OUTLINE} strokeWidth="1.3" />
      <path d="M28 18 C28 13.5 31 11.5 34 12 C35 15.5 33 18.5 30 20 Z" fill={`url(#${id}-leaf)`} stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />
      <path d="M26 19 Q29 17 32 18" stroke="#def0d2" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.65" />
      <ellipse cx="28" cy="22.5" rx="1.8" ry="2.2" fill={OUTLINE} />
      <ellipse cx="33" cy="22.5" rx="1.8" ry="2.2" fill={OUTLINE} />
      <circle cx="27.5" cy="21.8" r="0.65" fill="#ffffff" />
      <circle cx="32.5" cy="21.8" r="0.65" fill="#ffffff" />
      <path d="M28.5 26 Q30.5 27.5 32.5 26" stroke="#285f54" strokeWidth="1" fill="none" strokeLinecap="round" />
      <ellipse cx="25.5" cy="25.5" rx="1.7" ry="0.9" fill="#e98e82" opacity="0.45" />
      <ellipse cx="35" cy="25.5" rx="1.5" ry="0.8" fill="#e98e82" opacity="0.45" />

      {/* A single dew drop signals its purpose */}
      <path d="M37 14 C35.5 16 35.5 18 37 19.2 C38.5 18 38.5 16 37 14 Z" fill="#69c5c0" stroke={OUTLINE} strokeWidth="0.6" />
    </Frame>
  );
}

function GhostOrchid({ size = 36, animated = false }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size} animated={animated} motion={animated ? "wisp" : undefined}>
      <defs>
        <radialGradient id={`${id}-body`} cx="38%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="58%" stopColor="#e4e7df" />
          <stop offset="100%" stopColor="#a9bcb2" />
        </radialGradient>
        <linearGradient id={`${id}-petal`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5eaff" />
          <stop offset="55%" stopColor="#c5abd5" />
          <stop offset="100%" stopColor="#75688e" />
        </linearGradient>
        <radialGradient id={`${id}-core`} cx="35%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#f5ffd5" />
          <stop offset="52%" stopColor="#9ce58e" />
          <stop offset="100%" stopColor="#4a9a69" />
        </radialGradient>
      </defs>

      {/* Fading wisp tail keeps the creature airborne */}
      <path d="M16 26 C14 31 15.5 35 12 38 C17 38 19 35.5 20 33 C21.5 36 24 37 27 36 C23.5 33 25 29 23.5 26 Z" fill={`url(#${id}-body)`} stroke={OUTLINE} strokeWidth="1.1" strokeLinejoin="round" opacity="0.9" />
      <path d="M17 31 Q18 34 16 36 M23 31 Q22 34 24 35" stroke="#ffffff" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.6" />

      {/* Orchid-petal wings */}
      <path d="M14 16 C8 9 3.5 10 3 15.5 C2.5 21 7 25 14.5 24 Z" fill={`url(#${id}-petal)`} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M26 16 C32 9 36.5 10 37 15.5 C37.5 21 33 25 25.5 24 Z" fill={`url(#${id}-petal)`} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M12 18 C7.5 16 5.5 18.5 7 22.5 C10 24.5 12.5 23.5 15 22 Z" fill="#eadff0" stroke={OUTLINE} strokeWidth="0.8" opacity="0.9" />
      <path d="M28 18 C32.5 16 34.5 18.5 33 22.5 C30 24.5 27.5 23.5 25 22 Z" fill="#eadff0" stroke={OUTLINE} strokeWidth="0.8" opacity="0.9" />
      <path d="M5.5 15 Q9 17 12.5 21 M34.5 15 Q31 17 27.5 21" stroke="#ffffff" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.65" />

      {/* Smooth floating body */}
      <path d="M14 12 C10.5 17 11 25 15.5 29 C18 31.2 22 31.2 24.5 29 C29 25 29.5 17 26 12 Z" fill={`url(#${id}-body)`} stroke={OUTLINE} strokeWidth="1.3" />
      <path d="M15.5 16 Q17 13 20 13" stroke="#ffffff" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.65" />

      {/* Tall petal ears form an orchid crown */}
      <path d="M18 14 C12 11 11 5 14 1.5 C18 4 20 8 20 13 Z" fill={`url(#${id}-petal)`} stroke={OUTLINE} strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M22 14 C28 11 29 5 26 1.5 C22 4 20 8 20 13 Z" fill={`url(#${id}-petal)`} stroke={OUTLINE} strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M16 4.5 Q18 8 19 12 M24 4.5 Q22 8 21 12" stroke="#ffffff" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.6" />

      {/* Calm face and relit core */}
      <path d="M15.5 19 Q17 17.5 18.5 19" stroke={OUTLINE} strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M21.5 19 Q23 17.5 24.5 19" stroke={OUTLINE} strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M18 22.5 Q20 24 22 22.5" stroke="#6e657f" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <path className="garden-sprite__glow" d="M20 24 C16.5 25.5 16.5 29 20 31 C23.5 29 23.5 25.5 20 24 Z" fill={`url(#${id}-core)`} stroke={OUTLINE} strokeWidth="0.8" />
      <circle cx="19.2" cy="26.2" r="0.7" fill="#ffffff" opacity="0.8" />

      {/* Returning signal motes */}
      <circle cx="7" cy="8" r="1.2" fill="#a8dd9a" opacity="0.75" />
      <circle cx="33.5" cy="7" r="0.9" fill="#d9f4bd" opacity="0.8" />
      <circle cx="36" cy="28" r="1.1" fill="#8fcf8b" opacity="0.6" />
    </Frame>
  );
}

function BatteryBush({ size = 36, animated = false }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size} animated={animated} motion={animated ? "beetle" : undefined}>
      <defs>
        <radialGradient id={`${id}-shell`} cx="35%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#8bc3a0" />
          <stop offset="58%" stopColor="#447b62" />
          <stop offset="100%" stopColor="#254b43" />
        </radialGradient>
        <radialGradient id={`${id}-head`} cx="35%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#c1d59c" />
          <stop offset="62%" stopColor="#719565" />
          <stop offset="100%" stopColor="#3d644d" />
        </radialGradient>
        <radialGradient id={`${id}-berry`} cx="32%" cy="25%" r="72%">
          <stop offset="0%" stopColor="#fff3b0" />
          <stop offset="45%" stopColor="#f3bd62" />
          <stop offset="100%" stopColor="#ce5f56" />
        </radialGradient>
        <linearGradient id={`${id}-leaf`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d6e58b" />
          <stop offset="100%" stopColor="#57945d" />
        </linearGradient>
      </defs>

      {/* Six sturdy beetle legs */}
      <path d="M12 20 Q6 18 4 15 M11 25 Q5 25 3 28 M14 29 Q9 32 8 36 M28 20 Q34 18 36 15 M29 25 Q35 25 37 28 M26 29 Q31 32 32 36" stroke={OUTLINE} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M12 20 Q6 18 4 15 M11 25 Q5 25 3 28 M14 29 Q9 32 8 36 M28 20 Q34 18 36 15 M29 25 Q35 25 37 28 M26 29 Q31 32 32 36" stroke="#638b62" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M4 15 L3 12 M3 28 L1 30 M8 36 L6 37 M36 15 L37 12 M37 28 L39 30 M32 36 L34 37" stroke="#d0d994" strokeWidth="1" strokeLinecap="round" />

      {/* Rounded energy shell */}
      <path d="M20 7 C11 7 8 15 9 24 C10 33 15 36 20 36 C25 36 30 33 31 24 C32 15 29 7 20 7 Z" fill={`url(#${id}-shell)`} stroke={OUTLINE} strokeWidth="1.4" />
      <path d="M20 10 V34" stroke="#b7d08f" strokeWidth="1" opacity="0.5" />
      <path d="M12 19 Q20 16 28 19 M11 26 Q20 23 29 26" stroke="#b7d08f" strokeWidth="0.8" fill="none" opacity="0.38" />
      <path d="M13 15 Q15 10 19 9.5" stroke="#d5e5b1" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.55" />

      {/* Leaf sockets hold three rechargeable fruit pods */}
      <path d="M12 14 C8 12 7 8.5 8.5 6 C12 7 14 9.5 14 13 Z" fill={`url(#${id}-leaf)`} stroke={OUTLINE} strokeWidth="0.9" strokeLinejoin="round" />
      <path d="M28 14 C32 12 33 8.5 31.5 6 C28 7 26 9.5 26 13 Z" fill={`url(#${id}-leaf)`} stroke={OUTLINE} strokeWidth="0.9" strokeLinejoin="round" />
      <circle className="garden-sprite__glow" cx="13.5" cy="14.5" r="3.1" fill={`url(#${id}-berry)`} stroke={OUTLINE} strokeWidth="0.9" />
      <circle className="garden-sprite__glow" cx="20" cy="11.5" r="3.3" fill={`url(#${id}-berry)`} stroke={OUTLINE} strokeWidth="0.9" />
      <circle className="garden-sprite__glow" cx="26.5" cy="14.5" r="3.1" fill={`url(#${id}-berry)`} stroke={OUTLINE} strokeWidth="0.9" />
      <circle cx="12.6" cy="13.6" r="0.8" fill="#ffffff" opacity="0.75" />
      <circle cx="19" cy="10.5" r="0.85" fill="#ffffff" opacity="0.75" />
      <circle cx="25.6" cy="13.6" r="0.8" fill="#ffffff" opacity="0.75" />
      <path d="M16.4 13 L17.2 12.6 M22.8 12.6 L23.6 13" stroke="#f5d77a" strokeWidth="1.1" strokeLinecap="round" />

      {/* Armored head and determined face */}
      <path d="M12 25 C12 21 15.5 19 20 19 C24.5 19 28 21 28 25 C28 30.5 24.5 33 20 33 C15.5 33 12 30.5 12 25 Z" fill={`url(#${id}-head)`} stroke={OUTLINE} strokeWidth="1.2" />
      <path d="M14 23 Q16 21 19 21" stroke="#d8e5aa" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M14.8 25 Q17 23.5 18.5 25" stroke={OUTLINE} strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M21.5 25 Q23 23.5 25.2 25" stroke={OUTLINE} strokeWidth="1" fill="none" strokeLinecap="round" />
      <circle cx="16.8" cy="25" r="0.55" fill="#ffffff" />
      <circle cx="23.2" cy="25" r="0.55" fill="#ffffff" />
      <path d="M18 29 Q20 30.5 22 29" stroke="#344f3d" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <path d="M19 27 L20 27.8 L21 27" fill="#d98268" stroke={OUTLINE} strokeWidth="0.6" strokeLinejoin="round" />
    </Frame>
  );
}

function CloverCluster({ size = 36, animated = false }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size} animated={animated} motion={animated ? "twins" : undefined}>
      <defs>
        <radialGradient id={`${id}-body`} cx="36%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#b9dda0" />
          <stop offset="60%" stopColor="#69a76c" />
          <stop offset="100%" stopColor="#38644f" />
        </radialGradient>
        <radialGradient id={`${id}-left`} cx="34%" cy="27%" r="72%">
          <stop offset="0%" stopColor="#d8eba6" />
          <stop offset="62%" stopColor="#83bb72" />
          <stop offset="100%" stopColor="#4d8057" />
        </radialGradient>
        <radialGradient id={`${id}-right`} cx="34%" cy="27%" r="72%">
          <stop offset="0%" stopColor="#c9e2a0" />
          <stop offset="62%" stopColor="#68a76b" />
          <stop offset="100%" stopColor="#35634e" />
        </radialGradient>
        <linearGradient id={`${id}-leaf`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e5ef9d" />
          <stop offset="100%" stopColor="#57965c" />
        </linearGradient>
        <radialGradient id={`${id}-bond`} cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#fff7c7" />
          <stop offset="58%" stopColor="#f1bd6a" />
          <stop offset="100%" stopColor="#d16c5d" />
        </radialGradient>
      </defs>

      {/* Shared root feet */}
      <path d="M14 31 Q9 32 7 36 Q11 37.5 17 35 L18 31 Z" fill="#77965e" stroke={OUTLINE} strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M26 31 Q31 32 33 36 Q29 37.5 23 35 L22 31 Z" fill="#668b59" stroke={OUTLINE} strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M10 35 L9 37 M14 35.5 L14 38 M30 35 L31 37 M26 35.5 L26 38" stroke="#d8d99a" strokeWidth="0.9" strokeLinecap="round" />

      {/* One sturdy body supports both companions */}
      <path d="M9 21 C7.5 27 10 33 15 35 C18 36.2 22 36.2 25 35 C30 33 32.5 27 31 21 C25 18.5 15 18.5 9 21 Z" fill={`url(#${id}-body)`} stroke={OUTLINE} strokeWidth="1.3" />
      <path d="M11.5 24 Q14 21 18 21" stroke="#d9eab2" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.55" />

      {/* Left leaf-eared head */}
      <path d="M8.5 11 C7 5.5 10 2.5 14 3.5 C16 6.5 15 10 12.5 13 Z" fill={`url(#${id}-leaf)`} stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />
      <path d="M16 10 C17 5 21 3.5 24 5.5 C23 9 20.5 11.5 17.5 13 Z" fill={`url(#${id}-leaf)`} stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />
      <path d="M7 15 C7 9.5 11 7 15 8 C19.5 9 21 14 19 18 C17 22 11 23 8 19.5 C7.2 18.3 7 16.8 7 15 Z" fill={`url(#${id}-left)`} stroke={OUTLINE} strokeWidth="1.2" />
      <path d="M10 11 Q13 9 15.5 10" stroke="#edf3bd" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.65" />

      {/* Right leaf-eared head */}
      <path d="M23 10 C22 5 18 3.5 15 5.5 C16 9 18.5 11.5 21.5 13 Z" fill={`url(#${id}-leaf)`} stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />
      <path d="M31.5 11 C33 5.5 30 2.5 26 3.5 C24 6.5 25 10 27.5 13 Z" fill={`url(#${id}-leaf)`} stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />
      <path d="M33 15 C33 9.5 29 7 25 8 C20.5 9 19 14 21 18 C23 22 29 23 32 19.5 C32.8 18.3 33 16.8 33 15 Z" fill={`url(#${id}-right)`} stroke={OUTLINE} strokeWidth="1.2" />
      <path d="M30 11 Q27 9 24.5 10" stroke="#e1efb5" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.65" />

      {/* Matching happy faces */}
      <ellipse cx="11.5" cy="15" rx="1.5" ry="2" fill={OUTLINE} />
      <ellipse cx="16" cy="15" rx="1.5" ry="2" fill={OUTLINE} />
      <circle cx="11.1" cy="14.4" r="0.5" fill="#ffffff" />
      <circle cx="15.6" cy="14.4" r="0.5" fill="#ffffff" />
      <path d="M12 18 Q14 19.5 16 18" stroke="#355443" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <ellipse cx="24" cy="15" rx="1.5" ry="2" fill={OUTLINE} />
      <ellipse cx="28.5" cy="15" rx="1.5" ry="2" fill={OUTLINE} />
      <circle cx="23.6" cy="14.4" r="0.5" fill="#ffffff" />
      <circle cx="28.1" cy="14.4" r="0.5" fill="#ffffff" />
      <path d="M24 18 Q26 19.5 28 18" stroke="#355443" strokeWidth="0.9" fill="none" strokeLinecap="round" />

      {/* Shared health bond */}
      <path className="garden-sprite__glow" d="M20 24 C16.5 21.5 13.5 25 15.5 28 C17 30 20 32 20 32 C20 32 23 30 24.5 28 C26.5 25 23.5 21.5 20 24 Z" fill={`url(#${id}-bond)`} stroke={OUTLINE} strokeWidth="0.9" />
      <circle cx="18.2" cy="25.3" r="0.7" fill="#ffffff" opacity="0.75" />
    </Frame>
  );
}

function FernPot({ size = 36, animated = false }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size} animated={animated} motion={animated ? "collector" : undefined}>
      <defs>
        <radialGradient id={`${id}-shell`} cx="34%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#d49a70" />
          <stop offset="58%" stopColor="#a85d4d" />
          <stop offset="100%" stopColor="#6c3d3b" />
        </radialGradient>
        <radialGradient id={`${id}-body`} cx="35%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#c7daa0" />
          <stop offset="62%" stopColor="#78a06b" />
          <stop offset="100%" stopColor="#41654f" />
        </radialGradient>
        <linearGradient id={`${id}-fern`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e2ec9d" />
          <stop offset="100%" stopColor="#4f9060" />
        </linearGradient>
        <radialGradient id={`${id}-bud`} cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#fff5bd" />
          <stop offset="55%" stopColor="#d9db79" />
          <stop offset="100%" stopColor="#77a45f" />
        </radialGradient>
      </defs>

      {/* Low collector body and feet */}
      <path d="M7 27 C5 31 8 34 13 34 H29 C34 34 37 31 35 27 C31 23 12 23 7 27 Z" fill={`url(#${id}-body)`} stroke={OUTLINE} strokeWidth="1.3" />
      <ellipse cx="13" cy="34" rx="4.5" ry="2.2" fill="#55775a" stroke={OUTLINE} strokeWidth="0.9" />
      <ellipse cx="29" cy="34" rx="4.5" ry="2.2" fill="#55775a" stroke={OUTLINE} strokeWidth="0.9" />
      <path d="M10.5 35 L9 37 M14 35.5 L13.5 37.5 M31.5 35 L33 37 M28 35.5 L28.5 37.5" stroke="#d8d29a" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M8 28 Q4 25 3 29 Q5 32 9 31" fill="#6d8e63" stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />

      {/* Terracotta-colored living shell */}
      <circle cx="17" cy="20" r="13" fill={`url(#${id}-shell)`} stroke={OUTLINE} strokeWidth="1.4" />
      <path d="M9 17 Q12 9 20 8" stroke="#efbd93" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.55" />
      <path d="M8 23 Q17 27 27 22" stroke="#703f3c" strokeWidth="1" fill="none" opacity="0.5" />

      {/* Four collected fern curls */}
      {[
        { x: 12, y: 15, flip: 1 },
        { x: 20, y: 13, flip: -1 },
        { x: 12.5, y: 23, flip: -1 },
        { x: 21, y: 21.5, flip: 1 },
      ].map(({ x, y, flip }, index) => (
        <g key={index} transform={`translate(${x} ${y}) scale(${flip} 1)`}>
          <path d="M0 4 C0 0 5 -1 5 2 C5 4 2 4 2 2.5" stroke={`url(#${id}-fern)`} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M0 4 L-2 1.5 M0.5 2 L-1 -0.3 M1.7 1 L1 -1.2" stroke="#dce9a0" strokeWidth="0.8" strokeLinecap="round" />
          <circle className="garden-sprite__glow" cx="2" cy="2.5" r="1.2" fill={`url(#${id}-bud)`} stroke={OUTLINE} strokeWidth="0.5" />
        </g>
      ))}

      {/* Curious collector head */}
      <path d="M26 22 C29 18 35 19 37 23 C39 27 36 32 31.5 32 C27 32 24.5 28.5 25 25 C25.2 23.8 25.5 22.8 26 22 Z" fill={`url(#${id}-body)`} stroke={OUTLINE} strokeWidth="1.2" />
      <path d="M29 20 Q28 15 30.5 13 M34 20 Q36 16 35 13.5" stroke={OUTLINE} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <circle cx="30.5" cy="13" r="1.5" fill={`url(#${id}-bud)`} stroke={OUTLINE} strokeWidth="0.7" />
      <circle cx="35" cy="13.5" r="1.5" fill={`url(#${id}-bud)`} stroke={OUTLINE} strokeWidth="0.7" />
      <ellipse cx="30" cy="25" rx="1.7" ry="2.1" fill={OUTLINE} />
      <ellipse cx="34.5" cy="25" rx="1.7" ry="2.1" fill={OUTLINE} />
      <circle cx="29.5" cy="24.3" r="0.6" fill="#ffffff" />
      <circle cx="34" cy="24.3" r="0.6" fill="#ffffff" />
      <path d="M30.5 28.5 Q32.5 30 34.5 28.5" stroke="#405844" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <ellipse cx="27.8" cy="28" rx="1.5" ry="0.8" fill="#e69176" opacity="0.45" />
    </Frame>
  );
}

function LabelStake({ size = 36, animated = false }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size} animated={animated} motion={animated ? "scribe" : undefined}>
      <defs>
        <radialGradient id={`${id}-body`} cx="35%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#f4e9c7" />
          <stop offset="62%" stopColor="#c9b78e" />
          <stop offset="100%" stopColor="#8b795f" />
        </radialGradient>
        <linearGradient id={`${id}-wing`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff9dd" />
          <stop offset="100%" stopColor="#b9c895" />
        </linearGradient>
        <linearGradient id={`${id}-bark`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a57a52" />
          <stop offset="100%" stopColor="#513b2d" />
        </linearGradient>
        <radialGradient id={`${id}-mark`} cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#eaffcc" />
          <stop offset="58%" stopColor="#85c984" />
          <stop offset="100%" stopColor="#3f785a" />
        </radialGradient>
      </defs>

      {/* Quill-like tail */}
      <path d="M24 29 Q30 31 35 37" stroke={OUTLINE} strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <path d="M24 29 Q30 31 35 37" stroke="#8b704f" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M31 32 C34 29 37 30 38 32.5 C36 35 33.5 35 31.5 34 Z" fill={`url(#${id}-wing)`} stroke={OUTLINE} strokeWidth="0.9" strokeLinejoin="round" />
      <path d="M33 33 L37 32" stroke="#6d8a5f" strokeWidth="0.7" strokeLinecap="round" />

      {/* Small rooted feet */}
      <path d="M15 32 Q10 33 9 36.5 Q13 37.5 18 35 L18.5 32 Z" fill="#8b795f" stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />
      <path d="M25 32 Q30 33 31 36.5 Q27 37.5 22 35 L21.5 32 Z" fill="#8b795f" stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />

      {/* Parchment-leaf wings */}
      <path d="M14 17 C8 12 3.5 14 4 20 C4.5 26 9 29 15 27 Z" fill={`url(#${id}-wing)`} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M26 17 C32 12 36.5 14 36 20 C35.5 26 31 29 25 27 Z" fill={`url(#${id}-wing)`} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M6.5 18 Q10 20 13.5 24 M5.5 22 H12 M33.5 18 Q30 20 26.5 24 M34.5 22 H28" stroke="#77906a" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.65" />

      {/* Upright scholar body */}
      <path d="M13 15 C10.5 21 11.5 30 16 34 C18.5 36 21.5 36 24 34 C28.5 30 29.5 21 27 15 Z" fill={`url(#${id}-body)`} stroke={OUTLINE} strokeWidth="1.3" />
      <path d="M15 19 Q16.5 16 20 16" stroke="#fff5da" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.65" />

      {/* Bark brow gives it a distinct, studious silhouette */}
      <path d="M11 14 C12 7 16 4 20 4 C24 4 28 7 29 14 C24 12 16 12 11 14 Z" fill={`url(#${id}-bark)`} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M14 10 Q20 6.5 26 10" stroke="#d4ad74" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.55" />
      <path d="M16 5 Q17 1.5 20 1 Q23 1.5 24 5" fill={`url(#${id}-wing)`} stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />

      {/* Wide observant eyes */}
      <circle cx="16" cy="16.5" r="4.1" fill="#eee2bd" stroke={OUTLINE} strokeWidth="1" />
      <circle cx="24" cy="16.5" r="4.1" fill="#eee2bd" stroke={OUTLINE} strokeWidth="1" />
      <ellipse cx="16.4" cy="17" rx="1.6" ry="2.2" fill={OUTLINE} />
      <ellipse cx="23.6" cy="17" rx="1.6" ry="2.2" fill={OUTLINE} />
      <circle cx="15.9" cy="16.2" r="0.6" fill="#ffffff" />
      <circle cx="23.1" cy="16.2" r="0.6" fill="#ffffff" />
      <path d="M18.5 21 L20 22.3 L21.5 21 Q20 20.2 18.5 21 Z" fill="#a86e54" stroke={OUTLINE} strokeWidth="0.7" strokeLinejoin="round" />

      {/* Botanical identification marks */}
      <path className="garden-sprite__glow" d="M20 25 C17 23.5 15.5 26 17 28 C18 29.5 20 31 20 31 C20 31 22 29.5 23 28 C24.5 26 23 23.5 20 25 Z" fill={`url(#${id}-mark)`} stroke={OUTLINE} strokeWidth="0.8" />
      <path d="M20 25.5 V30 M17.5 27 L20 28 M22.5 27 L20 28" stroke="#e7efb5" strokeWidth="0.7" strokeLinecap="round" />
    </Frame>
  );
}

function CameraSunflower({ size = 36, animated = false }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size} animated={animated} motion={animated ? "memory" : undefined}>
      <defs>
        <radialGradient id={`${id}-body`} cx="34%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#dce79a" />
          <stop offset="60%" stopColor="#91b765" />
          <stop offset="100%" stopColor="#4c7650" />
        </radialGradient>
        <linearGradient id={`${id}-crest`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe58a" />
          <stop offset="100%" stopColor="#d18b3f" />
        </linearGradient>
        <radialGradient id={`${id}-eye`} cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#ecfff4" />
          <stop offset="42%" stopColor="#83c5a5" />
          <stop offset="75%" stopColor="#356f62" />
          <stop offset="100%" stopColor="#173b38" />
        </radialGradient>
        <radialGradient id={`${id}-memory`} cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#fffbd1" />
          <stop offset="58%" stopColor="#f4c75f" />
          <stop offset="100%" stopColor="#dc7652" />
        </radialGradient>
      </defs>

      {/* Curled tail records three bright memories */}
      <path d="M13 28 C7 31 3 28 4 23 C5 18 11 19 11 23" stroke={OUTLINE} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M13 28 C7 31 3 28 4 23 C5 18 11 19 11 23" stroke="#6c9658" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <circle className="garden-sprite__glow" cx="5.2" cy="26.5" r="2.2" fill={`url(#${id}-memory)`} stroke={OUTLINE} strokeWidth="0.8" />
      <circle className="garden-sprite__glow" cx="5.3" cy="21.5" r="2" fill={`url(#${id}-memory)`} stroke={OUTLINE} strokeWidth="0.8" />
      <circle className="garden-sprite__glow" cx="9.7" cy="21.5" r="1.8" fill={`url(#${id}-memory)`} stroke={OUTLINE} strokeWidth="0.8" />
      <circle cx="4.6" cy="25.9" r="0.6" fill="#ffffff" opacity="0.75" />
      <circle cx="4.8" cy="21" r="0.55" fill="#ffffff" opacity="0.75" />
      <circle cx="9.2" cy="21" r="0.5" fill="#ffffff" opacity="0.75" />

      {/* Gripping lizard feet */}
      <path d="M16 30 Q12 32 11 36 M17 31 Q16 35 18 37 M28 30 Q32 31 34 35 M27 31 Q28 35 26 37" stroke={OUTLINE} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M16 30 Q12 32 11 36 M17 31 Q16 35 18 37 M28 30 Q32 31 34 35 M27 31 Q28 35 26 37" stroke="#719858" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M11 36 L8.5 36.5 M11 36 L10 38 M18 37 L16 38 M18 37 L19.5 38 M34 35 L36.5 35.5 M34 35 L35 37 M26 37 L24 38 M26 37 L27.5 38" stroke="#d9d992" strokeWidth="0.8" strokeLinecap="round" />

      {/* Low chameleon-like body */}
      <path d="M11 23 C9 28 12 33 18 34 C23 35 30 33 32 29 C34 25 30 20 25 19 Z" fill={`url(#${id}-body)`} stroke={OUTLINE} strokeWidth="1.3" />
      <path d="M14 25 Q17 21 22 21" stroke="#e0edb1" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M16 29 Q21 31 27 28" stroke="#557747" strokeWidth="0.8" fill="none" opacity="0.45" />

      {/* Sun-petal focusing crest */}
      {[205, 235, 265, 295, 325, 355, 25, 55].map((degrees) => {
        const radians = (degrees * Math.PI) / 180;
        const cx = 27 + Math.cos(radians) * 7;
        const cy = 15 + Math.sin(radians) * 7;
        return (
          <ellipse
            key={degrees}
            cx={cx}
            cy={cy}
            rx="2.3"
            ry="4"
            fill={`url(#${id}-crest)`}
            stroke={OUTLINE}
            strokeWidth="0.7"
            transform={`rotate(${degrees + 90} ${cx} ${cy})`}
          />
        );
      })}

      {/* Rounded head with a biological lens eye */}
      <path d="M21 10 C24 5.5 31 5.5 35 9 C39 12.5 37 19 32.5 22 C28 25 21 22 20 17 C19.5 14.5 20 12 21 10 Z" fill={`url(#${id}-body)`} stroke={OUTLINE} strokeWidth="1.3" />
      <circle cx="27" cy="14.5" r="6.3" fill="#dbc66f" stroke={OUTLINE} strokeWidth="1.1" />
      <circle cx="27" cy="14.5" r="4.5" fill={`url(#${id}-eye)`} stroke={OUTLINE} strokeWidth="0.8" />
      <path d="M27 11.2 L29.5 13 L28.5 16 L25.5 17 L23.8 14.5 L25 12 Z" fill="#193f39" opacity="0.9" />
      <circle cx="25.5" cy="12.8" r="1.1" fill="#ffffff" opacity="0.8" />
      <ellipse cx="34" cy="16" rx="1.4" ry="1.8" fill={OUTLINE} />
      <circle cx="33.6" cy="15.4" r="0.5" fill="#ffffff" />
      <path d="M31.5 19 Q33.5 20.5 35 19" stroke="#3f6145" strokeWidth="0.9" fill="none" strokeLinecap="round" />
    </Frame>
  );
}

function RainCloud({ size = 36, animated = false }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size} animated={animated} motion={animated ? "weather" : undefined}>
      <defs>
        <radialGradient id={`${id}-body`} cx="36%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#d7e6df" />
          <stop offset="60%" stopColor="#8ca9a5" />
          <stop offset="100%" stopColor="#526f70" />
        </radialGradient>
        <linearGradient id={`${id}-cloud`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#b8c9c6" />
        </linearGradient>
        <linearGradient id={`${id}-fin`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c7e4d8" />
          <stop offset="100%" stopColor="#638b86" />
        </linearGradient>
        <radialGradient id={`${id}-gem`} cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#f3fff3" />
          <stop offset="55%" stopColor="#82cba5" />
          <stop offset="100%" stopColor="#3b8170" />
        </radialGradient>
      </defs>

      {/* Three rain-ribbon tails */}
      <path d="M14 27 Q10 31 11 36 M20 28 Q18 32 20 37 M26 27 Q30 31 29 36" stroke={OUTLINE} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M14 27 Q10 31 11 36 M20 28 Q18 32 20 37 M26 27 Q30 31 29 36" stroke="#6aa2a0" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M11 34 C8.5 36.5 9.5 38.5 11 39 C13 38 13.5 36 11 34 Z" fill="#81c8c2" stroke={OUTLINE} strokeWidth="0.6" />
      <path d="M20 35 C17.5 37.5 18.5 39 20 39.5 C22 38.5 22.5 37 20 35 Z" fill="#70bab8" stroke={OUTLINE} strokeWidth="0.6" />
      <path d="M29 34 C26.5 36.5 27.5 38.5 29 39 C31 38 31.5 36 29 34 Z" fill="#81c8c2" stroke={OUTLINE} strokeWidth="0.6" />

      {/* Broad wind fins */}
      <path d="M14 13 C8 8 2.5 10 2 16 C2 21 7 25 15 24 Z" fill={`url(#${id}-fin)`} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M26 13 C32 8 37.5 10 38 16 C38 21 33 25 25 24 Z" fill={`url(#${id}-fin)`} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M4.5 15 Q9 16 13 21 M35.5 15 Q31 16 27 21" stroke="#e0f0e7" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.65" />

      {/* Floating ray body */}
      <path d="M11 12 C9 18 11 26 16 29 C18.5 30.5 21.5 30.5 24 29 C29 26 31 18 29 12 Z" fill={`url(#${id}-body)`} stroke={OUTLINE} strokeWidth="1.3" />
      <path d="M14 16 Q16 12.5 20 13" stroke="#e4f0e9" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.6" />

      {/* Cloud mantle grows from the creature's back */}
      <circle cx="12" cy="10" r="5" fill={`url(#${id}-cloud)`} stroke={OUTLINE} strokeWidth="1" />
      <circle cx="19" cy="7.5" r="6.5" fill={`url(#${id}-cloud)`} stroke={OUTLINE} strokeWidth="1" />
      <circle cx="27" cy="10" r="5.5" fill={`url(#${id}-cloud)`} stroke={OUTLINE} strokeWidth="1" />
      <ellipse cx="20" cy="12.5" rx="13" ry="5.2" fill={`url(#${id}-cloud)`} stroke={OUTLINE} strokeWidth="1.1" />
      <ellipse cx="15" cy="6.8" rx="2.5" ry="1.6" fill="#ffffff" opacity="0.65" />

      {/* Forecast gem and calm oracle face */}
      <path className="garden-sprite__glow" d="M20 4 C17.5 6 17.5 9 20 11 C22.5 9 22.5 6 20 4 Z" fill={`url(#${id}-gem)`} stroke={OUTLINE} strokeWidth="0.8" />
      <circle cx="19.3" cy="6.5" r="0.6" fill="#ffffff" opacity="0.8" />
      <ellipse cx="15.8" cy="19" rx="1.8" ry="2.2" fill={OUTLINE} />
      <ellipse cx="24.2" cy="19" rx="1.8" ry="2.2" fill={OUTLINE} />
      <circle cx="15.3" cy="18.3" r="0.6" fill="#ffffff" />
      <circle cx="23.7" cy="18.3" r="0.6" fill="#ffffff" />
      <path d="M17.5 23 Q20 24.5 22.5 23" stroke="#405e5d" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M19 21 L20 21.8 L21 21" fill="#cf8173" stroke={OUTLINE} strokeWidth="0.6" strokeLinejoin="round" />
    </Frame>
  );
}

function MirrorPond({ size = 36, animated = false }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size} animated={animated} motion={animated ? "identity" : undefined}>
      <defs>
        <radialGradient id={`${id}-body`} cx="35%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#b8ddd2" />
          <stop offset="60%" stopColor="#679c91" />
          <stop offset="100%" stopColor="#385f5d" />
        </radialGradient>
        <radialGradient id={`${id}-mirror`} cx="34%" cy="27%" r="72%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="34%" stopColor="#dcebea" />
          <stop offset="68%" stopColor="#9ebcba" />
          <stop offset="100%" stopColor="#658783" />
        </radialGradient>
        <linearGradient id={`${id}-fin`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d8dbed" />
          <stop offset="52%" stopColor="#9bb8bd" />
          <stop offset="100%" stopColor="#687695" />
        </linearGradient>
        <radialGradient id={`${id}-identity`} cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#fff0ca" />
          <stop offset="55%" stopColor="#eea571" />
          <stop offset="100%" stopColor="#ba5d66" />
        </radialGradient>
      </defs>

      {/* Water-ribbon tail */}
      <path d="M13 27 C7 31 3 28 4.5 23 C6 18 11 20 10 23" stroke={OUTLINE} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path d="M13 27 C7 31 3 28 4.5 23 C6 18 11 20 10 23" stroke="#7bb3aa" strokeWidth="2.7" fill="none" strokeLinecap="round" />
      <path d="M5 24 Q7 25 9 23" stroke="#ddf1ed" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.7" />

      {/* Soft fin feet */}
      <path d="M15 31 Q10 33 9 36.5 Q13 37.5 18 35 L18.5 31 Z" fill={`url(#${id}-fin)`} stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />
      <path d="M25 31 Q30 33 31 36.5 Q27 37.5 22 35 L21.5 31 Z" fill={`url(#${id}-fin)`} stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />
      <path d="M11.5 35 L10 37 M15 35.5 L14.5 37.5 M28.5 35 L30 37 M25 35.5 L25.5 37.5" stroke="#e2e8df" strokeWidth="0.8" strokeLinecap="round" />

      {/* Lake-spirit body */}
      <path d="M12 19 C9 24 10.5 32 15.5 35 C18 36.5 22 36.5 24.5 35 C29.5 32 31 24 28 19 Z" fill={`url(#${id}-body)`} stroke={OUTLINE} strokeWidth="1.3" />
      <path d="M14 23 Q16 19.5 20 20" stroke="#d5ece5" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.6" />

      {/* Iridescent ear fins frame the reflective face */}
      <path d="M13 14 C8 8 4 9 4 14 C4 19 8.5 22 14 20 Z" fill={`url(#${id}-fin)`} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M27 14 C32 8 36 9 36 14 C36 19 31.5 22 26 20 Z" fill={`url(#${id}-fin)`} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M6.5 13 Q10 15 12.5 18 M33.5 13 Q30 15 27.5 18" stroke="#edf2f1" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.65" />

      {/* Polished face plate */}
      <path d="M12 9 C15 4 25 4 28 9 C31.5 15 29 23 24 26 C21.5 27.5 18.5 27.5 16 26 C11 23 8.5 15 12 9 Z" fill={`url(#${id}-mirror)`} stroke={OUTLINE} strokeWidth="1.4" />
      <path d="M14 10 Q18 6.5 23 8" stroke="#ffffff" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.75" />
      <path d="M25 9 Q27 12 27 15" stroke="#d4e8e6" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.6" />

      {/* The reflected face remains warm and expressive */}
      <ellipse cx="16.5" cy="16" rx="2" ry="2.5" fill={OUTLINE} />
      <ellipse cx="23.5" cy="16" rx="2" ry="2.5" fill={OUTLINE} />
      <circle cx="15.9" cy="15.2" r="0.7" fill="#ffffff" />
      <circle cx="22.9" cy="15.2" r="0.7" fill="#ffffff" />
      <circle cx="17.1" cy="17" r="0.4" fill="#8ebdb1" />
      <circle cx="24.1" cy="17" r="0.4" fill="#8ebdb1" />
      <path d="M17.5 21 Q20 23 22.5 21" stroke="#496b68" strokeWidth="1" fill="none" strokeLinecap="round" />
      <ellipse cx="13.5" cy="20" rx="1.8" ry="0.9" fill="#df9182" opacity="0.4" />
      <ellipse cx="26.5" cy="20" rx="1.8" ry="0.9" fill="#df9182" opacity="0.4" />

      {/* Unique identity gem */}
      <path className="garden-sprite__glow" d="M20 27 L23 30 L20 33 L17 30 Z" fill={`url(#${id}-identity)`} stroke={OUTLINE} strokeWidth="0.8" strokeLinejoin="round" />
      <circle cx="19.3" cy="29" r="0.6" fill="#ffffff" opacity="0.75" />
    </Frame>
  );
}

function WeekWreath({ size = 36, animated = false }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size} animated={animated} motion={animated ? "streak" : undefined}>
      <defs>
        <radialGradient id={`${id}-segment`} cx="34%" cy="27%" r="72%">
          <stop offset="0%" stopColor="#cbe39d" />
          <stop offset="60%" stopColor="#76aa68" />
          <stop offset="100%" stopColor="#3d6b51" />
        </radialGradient>
        <radialGradient id={`${id}-head`} cx="34%" cy="27%" r="72%">
          <stop offset="0%" stopColor="#dce9a5" />
          <stop offset="62%" stopColor="#8ab66c" />
          <stop offset="100%" stopColor="#4d7653" />
        </radialGradient>
        <radialGradient id={`${id}-day`} cx="34%" cy="27%" r="70%">
          <stop offset="0%" stopColor="#fff8c5" />
          <stop offset="55%" stopColor="#f3c266" />
          <stop offset="100%" stopColor="#d66d58" />
        </radialGradient>
        <linearGradient id={`${id}-leaf`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e4ec9b" />
          <stop offset="100%" stopColor="#55915c" />
        </linearGradient>
      </defs>

      {/* Tiny walking legs follow the week-long curve */}
      <path d="M10 30 L7 35 M8 26 L4 28 M9 18 L5 16 M15 12 L13 7 M21 10 L22 5 M27 13 L31 9" stroke={OUTLINE} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M10 30 L7 35 M8 26 L4 28 M9 18 L5 16 M15 12 L13 7 M21 10 L22 5 M27 13 L31 9" stroke="#6f995f" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M7 35 L4.5 35.5 M4 28 L2 27 M5 16 L3 14.5 M13 7 L11 5.5 M22 5 L24 3.5 M31 9 L33 7" stroke="#dce1a0" strokeWidth="0.8" strokeLinecap="round" />

      {/* Six body segments curl upward */}
      {[
        { cx: 11, cy: 31, rx: 5.5, ry: 4.8, rotation: 12 },
        { cx: 8, cy: 25, rx: 5.2, ry: 5.5, rotation: -8 },
        { cx: 9.5, cy: 18.5, rx: 5.2, ry: 5.5, rotation: -18 },
        { cx: 14.5, cy: 13, rx: 5.4, ry: 5, rotation: -25 },
        { cx: 21, cy: 10.5, rx: 5.5, ry: 4.8, rotation: 5 },
        { cx: 27, cy: 13, rx: 5.2, ry: 5, rotation: 22 },
      ].map(({ cx, cy, rx, ry, rotation }, index) => (
        <g key={index} transform={`rotate(${rotation} ${cx} ${cy})`}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id}-segment)`} stroke={OUTLINE} strokeWidth="1.1" />
          <circle className="garden-sprite__glow" cx={cx - 0.7} cy={cy - 0.5} r="1.4" fill={`url(#${id}-day)`} stroke={OUTLINE} strokeWidth="0.55" />
          <circle cx={cx - 1.1} cy={cy - 0.9} r="0.4" fill="#ffffff" opacity="0.75" />
        </g>
      ))}

      {/* Leaf ridges make the body feel grown, not mechanical */}
      <path d="M6 21 C2.5 18 3 14.5 5 12.5 C8 14 9 17 8 20 Z" fill={`url(#${id}-leaf)`} stroke={OUTLINE} strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M14 10 C11 6 13 3 16 2 C18 5 17 8 15.5 10 Z" fill={`url(#${id}-leaf)`} stroke={OUTLINE} strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M23 9 C22 5 25 2.5 28 3 C28.5 6 26.5 9 24.5 10 Z" fill={`url(#${id}-leaf)`} stroke={OUTLINE} strokeWidth="0.8" strokeLinejoin="round" />

      {/* The seventh segment is the bright, alert head */}
      <path d="M27 12 C31 9.5 36 11.5 37 16 C38 20.5 34.5 24 30.5 23.5 C26.5 23 24 19.5 25 16 C25.3 14.3 26 13 27 12 Z" fill={`url(#${id}-head)`} stroke={OUTLINE} strokeWidth="1.2" />
      <circle cx="28" cy="14" r="1.5" fill={`url(#${id}-day)`} stroke={OUTLINE} strokeWidth="0.55" />
      <circle cx="27.6" cy="13.6" r="0.4" fill="#ffffff" opacity="0.75" />
      <path d="M30 12 Q31 8 34 6.5 Q35 10 32.5 13" fill={`url(#${id}-leaf)`} stroke={OUTLINE} strokeWidth="0.9" strokeLinejoin="round" />
      <ellipse cx="30.5" cy="17" rx="1.5" ry="1.9" fill={OUTLINE} />
      <ellipse cx="34.5" cy="17" rx="1.5" ry="1.9" fill={OUTLINE} />
      <circle cx="30.1" cy="16.4" r="0.5" fill="#ffffff" />
      <circle cx="34.1" cy="16.4" r="0.5" fill="#ffffff" />
      <path d="M31 20 Q33 21.5 35 20" stroke="#3c5940" strokeWidth="0.9" fill="none" strokeLinecap="round" />
    </Frame>
  );
}

function MonthSun({ size = 36, animated = false }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size} animated={animated} motion={animated ? "solar" : undefined}>
      <defs>
        <radialGradient id={`${id}-body`} cx="35%" cy="27%" r="72%">
          <stop offset="0%" stopColor="#e9e8aa" />
          <stop offset="60%" stopColor="#9eb56f" />
          <stop offset="100%" stopColor="#55754f" />
        </radialGradient>
        <linearGradient id={`${id}-wing`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff2a3" />
          <stop offset="52%" stopColor="#e6b95e" />
          <stop offset="100%" stopColor="#a9664d" />
        </linearGradient>
        <linearGradient id={`${id}-lower-wing`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d9df83" />
          <stop offset="100%" stopColor="#71915a" />
        </linearGradient>
        <radialGradient id={`${id}-sun`} cx="34%" cy="27%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="38%" stopColor="#fff4ad" />
          <stop offset="72%" stopColor="#efbd56" />
          <stop offset="100%" stopColor="#c77546" />
        </radialGradient>
      </defs>

      {/* Broad solar wings */}
      <path d="M18 18 C13 8 7 3 2.5 5 C1 11 5 19 16 23 Z" fill={`url(#${id}-wing)`} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M22 18 C27 8 33 3 37.5 5 C39 11 35 19 24 23 Z" fill={`url(#${id}-wing)`} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M17 22 C10 20 4 23 4 29 C8 34 14 31 18.5 26 Z" fill={`url(#${id}-lower-wing)`} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M23 22 C30 20 36 23 36 29 C32 34 26 31 21.5 26 Z" fill={`url(#${id}-lower-wing)`} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M4.5 7 Q10 12 16 20 M7 27 Q12 25 17 24 M35.5 7 Q30 12 24 20 M33 27 Q28 25 23 24" stroke="#fff1ae" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.55" />

      {/* Thirty pinprick lights mark the full month */}
      {Array.from({ length: 30 }, (_, index) => {
        const side = index < 15 ? -1 : 1;
        const position = index % 15;
        const row = Math.floor(position / 5);
        const column = position % 5;
        const cx = 20 + side * (7 + column * 2.15 - row * 0.45);
        const cy = 8.5 + row * 5.2 + (column % 2) * 1.2;
        return <circle className="solar-creature__light" key={index} cx={cx} cy={cy} r="0.48" fill="#fffbd0" opacity={0.72 + (index % 3) * 0.1} />;
      })}

      {/* Leaf-moth body */}
      <path d="M16 13 C14.5 20 15.5 31 20 36 C24.5 31 25.5 20 24 13 Z" fill={`url(#${id}-body)`} stroke={OUTLINE} strokeWidth="1.3" />
      <path d="M17.5 18 Q20 16.5 22.5 18 M17 24 Q20 22.5 23 24 M18 30 Q20 29 22 30" stroke="#e3dfa0" strokeWidth="0.8" fill="none" opacity="0.55" />

      {/* Antennae unfurl from the earlier streak creature */}
      <path d="M18 12 Q13 7 11 2 M22 12 Q27 7 29 2" stroke={OUTLINE} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M11 2 C7 2 6 5 8 7 C11 7 13 5 11 2 Z M29 2 C33 2 34 5 32 7 C29 7 27 5 29 2 Z" fill={`url(#${id}-lower-wing)`} stroke={OUTLINE} strokeWidth="0.8" strokeLinejoin="round" />

      {/* Bright face and solar heart */}
      <circle cx="20" cy="13" r="6" fill={`url(#${id}-body)`} stroke={OUTLINE} strokeWidth="1.2" />
      <ellipse cx="17.8" cy="13" rx="1.5" ry="1.9" fill={OUTLINE} />
      <ellipse cx="22.2" cy="13" rx="1.5" ry="1.9" fill={OUTLINE} />
      <circle cx="17.4" cy="12.4" r="0.5" fill="#ffffff" />
      <circle cx="21.8" cy="12.4" r="0.5" fill="#ffffff" />
      <path d="M18.5 16 Q20 17.2 21.5 16" stroke="#506045" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <circle className="garden-sprite__glow" cx="20" cy="23" r="3.2" fill={`url(#${id}-sun)`} stroke={OUTLINE} strokeWidth="0.8" />
      <circle cx="19.1" cy="22" r="0.8" fill="#ffffff" opacity="0.8" />
    </Frame>
  );
}

function PhoenixFern({ size = 36, animated = false }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size} animated={animated} motion={animated ? "recovery" : undefined}>
      <defs>
        <radialGradient id={`${id}-body`} cx="35%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#d6b17b" />
          <stop offset="60%" stopColor="#9a6b50" />
          <stop offset="100%" stopColor="#5f4438" />
        </radialGradient>
        <linearGradient id={`${id}-ember`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#9b493e" />
          <stop offset="55%" stopColor="#df8052" />
          <stop offset="100%" stopColor="#f4c76a" />
        </linearGradient>
        <linearGradient id={`${id}-renewal`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#35634d" />
          <stop offset="58%" stopColor="#68a562" />
          <stop offset="100%" stopColor="#c5dc83" />
        </linearGradient>
        <radialGradient id={`${id}-core`} cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#fffbd2" />
          <stop offset="55%" stopColor="#efc55d" />
          <stop offset="100%" stopColor="#d16a4d" />
        </radialGradient>
      </defs>

      {/* Fern tail curls from dry brown into living green */}
      <path d="M14 28 C7 33 3 29 5 24 C7 20 11 23 9 26" stroke={OUTLINE} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path d="M14 28 C7 33 3 29 5 24 C7 20 11 23 9 26" stroke={`url(#${id}-renewal)`} strokeWidth="2.7" fill="none" strokeLinecap="round" />
      <path d="M6 23 L3.5 20 M7 28 L4 29 M10 29 L8 32" stroke="#9fc276" strokeWidth="1.1" strokeLinecap="round" />

      {/* Grounded drake feet */}
      <path d="M15 31 Q11 33 10 37 Q14 38 18 35 L18 31 Z" fill="#74513f" stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />
      <path d="M25 31 Q29 33 30 37 Q26 38 22 35 L22 31 Z" fill="#74513f" stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />
      <path d="M12 36 L9 37 M15 36.5 L14 39 M28 36 L31 37 M25 36.5 L26 39" stroke="#e1c484" strokeWidth="1" strokeLinecap="round" />

      {/* Compact, resilient body */}
      <path d="M12 18 C9 24 10.5 32 15.5 35 C18 36.5 22 36.5 24.5 35 C29.5 32 31 24 28 18 Z" fill={`url(#${id}-body)`} stroke={OUTLINE} strokeWidth="1.3" />
      <path d="M14.5 22 Q16 18.5 20 19" stroke="#e7c995" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.55" />

      {/* Paired wings show damage and recovery */}
      <path d="M14 20 C8 17 4 12 3 5 C9 7 14 11 17 17 Z" fill={`url(#${id}-ember)`} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M26 20 C32 17 36 12 37 5 C31 7 26 11 23 17 Z" fill={`url(#${id}-renewal)`} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M6 9 Q11 12 15 17 M34 9 Q29 12 25 17" stroke="#fff0a8" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.65" />
      <path d="M8 13 L5 15 M11 15 L8 18 M32 13 L35 15 M29 15 L32 18" stroke="#e6bd73" strokeWidth="0.8" strokeLinecap="round" />

      {/* Bark-scaled head */}
      <path d="M12 10 C15 5.5 25 5.5 28 10 C31.5 15 29 22 24.5 24.5 C21.5 26 18.5 26 15.5 24.5 C11 22 8.5 15 12 10 Z" fill={`url(#${id}-body)`} stroke={OUTLINE} strokeWidth="1.3" />
      <path d="M14 11 Q17 7.5 21 8" stroke="#edcd96" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.6" />

      {/* Fresh fern crest */}
      <path d="M18 8 C14 5 14 1.5 16.5 0 C20 2 21 5 20 8 Z" fill={`url(#${id}-renewal)`} stroke={OUTLINE} strokeWidth="0.9" strokeLinejoin="round" />
      <path d="M22 8 C26 5 26 1.5 23.5 0 C20 2 19 5 20 8 Z" fill={`url(#${id}-renewal)`} stroke={OUTLINE} strokeWidth="0.9" strokeLinejoin="round" />
      <path d="M17 2.5 Q19 5 19.5 7 M23 2.5 Q21 5 20.5 7" stroke="#eef2ae" strokeWidth="0.7" fill="none" strokeLinecap="round" />

      {/* Focused face and rekindled heart */}
      <path d="M14.5 15 Q17 13 18.5 15" stroke={OUTLINE} strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M21.5 15 Q23 13 25.5 15" stroke={OUTLINE} strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <circle cx="16.8" cy="15" r="0.6" fill="#ffffff" />
      <circle cx="23.2" cy="15" r="0.6" fill="#ffffff" />
      <path d="M17.5 19.5 Q20 21 22.5 19.5" stroke="#5f4138" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <path className="garden-sprite__glow" d="M20 24 C16.5 25.5 16.5 29 20 31.5 C23.5 29 23.5 25.5 20 24 Z" fill={`url(#${id}-core)`} stroke={OUTLINE} strokeWidth="0.8" />
      <circle cx="19.2" cy="26" r="0.7" fill="#ffffff" opacity="0.8" />
    </Frame>
  );
}

function CompostBin({ size = 36, animated = false }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size} animated={animated} motion={animated ? "gobbler" : undefined}>
      <defs>
        <radialGradient id={`${id}-body`} cx="35%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#a9bd7f" />
          <stop offset="60%" stopColor="#66815b" />
          <stop offset="100%" stopColor="#3b5546" />
        </radialGradient>
        <linearGradient id={`${id}-leaf`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d9e38c" />
          <stop offset="100%" stopColor="#56885a" />
        </linearGradient>
        <linearGradient id={`${id}-message`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff9df" />
          <stop offset="100%" stopColor="#d8cfad" />
        </linearGradient>
        <radialGradient id={`${id}-belly`} cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#eef3b3" />
          <stop offset="58%" stopColor="#9abd72" />
          <stop offset="100%" stopColor="#527b55" />
        </radialGradient>
      </defs>

      {/* Rooted feet */}
      <path d="M14 31 Q9 33 8 37 Q12 38 18 35 L18 31 Z" fill="#546e4f" stroke={OUTLINE} strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M26 31 Q31 33 32 37 Q28 38 22 35 L22 31 Z" fill="#546e4f" stroke={OUTLINE} strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M10 36 L7 37 M14 36.5 L13 39 M30 36 L33 37 M26 36.5 L27 39" stroke="#d8d594" strokeWidth="0.9" strokeLinecap="round" />

      {/* Round decomposer body */}
      <path d="M20 8 C11 8 6 15 7.5 25 C8.5 34 14 37 20 37 C26 37 31.5 34 32.5 25 C34 15 29 8 20 8 Z" fill={`url(#${id}-body)`} stroke={OUTLINE} strokeWidth="1.4" />
      <path d="M11 17 Q14 11 20 11" stroke="#cad79b" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.55" />

      {/* Leaf ears and new sprout crest */}
      <path d="M12 12 C7 10 5 6 6.5 3 C11 3.5 14 7 15 11 Z" fill={`url(#${id}-leaf)`} stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />
      <path d="M28 12 C33 10 35 6 33.5 3 C29 3.5 26 7 25 11 Z" fill={`url(#${id}-leaf)`} stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />
      <path d="M20 9 V4 M20 5 C16 5 14.5 2.5 15 0.5 C18.5 0.5 20.5 2.5 20 5 Z M20 5 C24 5 25.5 2.5 25 0.5 C21.5 0.5 19.5 2.5 20 5 Z" fill={`url(#${id}-leaf)`} stroke={OUTLINE} strokeWidth="0.9" strokeLinejoin="round" />
      <path d="M8.5 5 Q11 7 13 10 M31.5 5 Q29 7 27 10" stroke="#edf0ad" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.65" />

      {/* Cheerful eyes */}
      <path d="M12.5 17 Q15 14.5 17.5 17" stroke={OUTLINE} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M22.5 17 Q25 14.5 27.5 17" stroke={OUTLINE} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <circle cx="15" cy="16.7" r="0.55" fill="#ffffff" />
      <circle cx="25" cy="16.7" r="0.55" fill="#ffffff" />

      {/* Wide mouth clears the final unread item */}
      <path d="M11 21 C14 19 26 19 29 21 C29 29 25 33 20 33 C15 33 11 29 11 21 Z" fill="#263c34" stroke={OUTLINE} strokeWidth="1.1" />
      <path d="M13 22 Q20 24 27 22" stroke="#f0e6c6" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M15 29 Q20 26 25 29 Q23 32 20 32 Q17 32 15 29 Z" fill="#c96862" />
      <path d="M18 31 Q20 29.5 22 31" stroke="#ef9b89" strokeWidth="0.7" fill="none" strokeLinecap="round" />

      {/* Cleared message being transformed */}
      <g className="gobbler-creature__message" transform="rotate(12 32 17)">
        <rect x="28.5" y="13.5" width="8" height="6" rx="1" fill={`url(#${id}-message)`} stroke={OUTLINE} strokeWidth="0.8" />
        <path d="M29.5 15 L32.5 17 L35.5 15" stroke="#7a8a70" strokeWidth="0.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <path d="M31 20 Q28 22 27 24" stroke="#d8e3a0" strokeWidth="0.8" fill="none" strokeLinecap="round" strokeDasharray="1.2 1.2" />

      {/* Compost glow shows successful renewal */}
      <ellipse cx="20" cy="35" rx="4.5" ry="1.5" fill={`url(#${id}-belly)`} opacity="0.75" />
    </Frame>
  );
}

function HourglassLeaf({ size = 36, animated = false }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size} animated={animated} motion={animated ? "seer" : undefined}>
      <defs>
        <radialGradient id={`${id}-body`} cx="35%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#d2c397" />
          <stop offset="60%" stopColor="#8f805f" />
          <stop offset="100%" stopColor="#564c3f" />
        </radialGradient>
        <linearGradient id={`${id}-wing`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a9c28d" />
          <stop offset="100%" stopColor="#4d725b" />
        </linearGradient>
        <linearGradient id={`${id}-tail`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d6b66e" />
          <stop offset="100%" stopColor="#8f5646" />
        </linearGradient>
        <radialGradient id={`${id}-time-eye`} cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#fffad1" />
          <stop offset="45%" stopColor="#e8c76d" />
          <stop offset="75%" stopColor="#9a7152" />
          <stop offset="100%" stopColor="#4f4b43" />
        </radialGradient>
      </defs>

      {/* Layered timeline tail */}
      <path d="M14 27 L12 37 Q15 39 18 36 L19 27 Z" fill={`url(#${id}-tail)`} stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />
      <path d="M18 27 L18 38 Q20 40 22 38 L22 27 Z" fill={`url(#${id}-tail)`} stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />
      <path d="M21 27 L22 36 Q25 39 28 37 L26 27 Z" fill={`url(#${id}-tail)`} stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />
      <path d="M14 31 H18 M18 33 H22 M22 30 H27 M13 35 H17 M23 34 H27" stroke="#f0d78c" strokeWidth="0.7" strokeLinecap="round" opacity="0.65" />

      {/* Leaf-feather wings */}
      <path d="M14 15 C8 11 3.5 14 4 21 C4.5 27 9.5 30 15.5 27 Z" fill={`url(#${id}-wing)`} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M26 15 C32 11 36.5 14 36 21 C35.5 27 30.5 30 24.5 27 Z" fill={`url(#${id}-wing)`} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M6.5 18 Q10 19 14 24 M6 23 Q10 23 14.5 26 M33.5 18 Q30 19 26 24 M34 23 Q30 23 25.5 26" stroke="#d6dfa4" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.6" />

      {/* Upright seer body */}
      <path d="M12 13 C9.5 20 11 29 16 33 C18.5 35 21.5 35 24 33 C29 29 30.5 20 28 13 Z" fill={`url(#${id}-body)`} stroke={OUTLINE} strokeWidth="1.3" />
      <path d="M14.5 18 Q16 14.5 20 15" stroke="#e6dab0" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M14 28 Q20 31 26 28" stroke="#665b48" strokeWidth="0.8" fill="none" opacity="0.5" />

      {/* Leaf ear tufts */}
      <path d="M13 12 C8 10 7 5 9 2 C13 3.5 16 7 16 11 Z" fill={`url(#${id}-wing)`} stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />
      <path d="M27 12 C32 10 33 5 31 2 C27 3.5 24 7 24 11 Z" fill={`url(#${id}-wing)`} stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round" />
      <path d="M10 4.5 Q13 7 14.5 10 M30 4.5 Q27 7 25.5 10" stroke="#e3e8ac" strokeWidth="0.8" fill="none" strokeLinecap="round" />

      {/* Broad owl-like face */}
      <path d="M11 11 C14 7 26 7 29 11 C32 16 29 23 24.5 25.5 C21.5 27 18.5 27 15.5 25.5 C11 23 8 16 11 11 Z" fill="#b5a57b" stroke={OUTLINE} strokeWidth="1.2" />
      <circle cx="15.5" cy="17" r="4.2" fill="#e7ddb8" stroke={OUTLINE} strokeWidth="0.9" />
      <circle cx="24.5" cy="17" r="4.2" fill="#e7ddb8" stroke={OUTLINE} strokeWidth="0.9" />
      <ellipse cx="15.8" cy="17.5" rx="1.6" ry="2.2" fill={OUTLINE} />
      <ellipse cx="24.2" cy="17.5" rx="1.6" ry="2.2" fill={OUTLINE} />
      <circle cx="15.3" cy="16.7" r="0.6" fill="#ffffff" />
      <circle cx="23.7" cy="16.7" r="0.6" fill="#ffffff" />
      <path d="M18 21 L20 23 L22 21 Q20 19.8 18 21 Z" fill="#a96750" stroke={OUTLINE} strokeWidth="0.7" strokeLinejoin="round" />

      {/* Third eye looks backward through the record */}
      <path className="seer-creature__time-eye" d="M15 10 Q20 5.5 25 10 Q20 14.5 15 10 Z" fill={`url(#${id}-time-eye)`} stroke={OUTLINE} strokeWidth="0.9" />
      <ellipse cx="20" cy="10" rx="1.2" ry="2" fill="#4c5548" />
      <circle cx="19.6" cy="9.3" r="0.45" fill="#ffffff" />
    </Frame>
  );
}

function MoonMushroom({ size = 36, animated = false }: SpriteProps) {
  const id = useId();
  return (
    <Frame size={size} animated={animated} motion={animated ? "prowler" : undefined}>
      <defs>
        <radialGradient id={`${id}-body`} cx="35%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#8b8da9" />
          <stop offset="58%" stopColor="#555a79" />
          <stop offset="100%" stopColor="#30384f" />
        </radialGradient>
        <linearGradient id={`${id}-ear`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#bbb4cf" />
          <stop offset="55%" stopColor="#777394" />
          <stop offset="100%" stopColor="#414861" />
        </linearGradient>
        <radialGradient id={`${id}-moon`} cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="42%" stopColor="#fff4b5" />
          <stop offset="100%" stopColor="#d8a854" />
        </radialGradient>
        <radialGradient id={`${id}-eye`} cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#fffbd6" />
          <stop offset="58%" stopColor="#eec966" />
          <stop offset="100%" stopColor="#aa684c" />
        </radialGradient>
        <radialGradient id={`${id}-gem`} cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#eaffd8" />
          <stop offset="58%" stopColor="#88c99d" />
          <stop offset="100%" stopColor="#477d70" />
        </radialGradient>
      </defs>

      {/* Crescent tail sweeps behind the prowler */}
      <path d="M12 27 C5 31 2 25 4.5 20 C6.5 16 11 17 12 20 C8.5 18.5 6 21 7 24 C8 27 10 27 13 25 Z" fill={`url(#${id}-moon)`} stroke={OUTLINE} strokeWidth="1.1" strokeLinejoin="round" />
      <circle cx="5" cy="17" r="0.8" fill="#fff4b5" opacity="0.75" />
      <circle cx="9" cy="13" r="0.55" fill="#ffffff" opacity="0.65" />

      {/* Quiet padded feet */}
      <ellipse cx="15" cy="35" rx="5" ry="2.4" fill="#3c445d" stroke={OUTLINE} strokeWidth="1" transform="rotate(-6 15 35)" />
      <ellipse cx="25" cy="35" rx="5" ry="2.4" fill="#3c445d" stroke={OUTLINE} strokeWidth="1" transform="rotate(6 25 35)" />
      <path d="M11.5 35 L10 37 M15 35.5 L15 38 M28.5 35 L30 37 M25 35.5 L25 38" stroke="#c9c5d0" strokeWidth="0.8" strokeLinecap="round" />

      {/* Sleek nocturnal body */}
      <path d="M12 18 C9.5 24 11 32 16 35 C18.5 36.5 21.5 36.5 24 35 C29 32 30.5 24 28 18 Z" fill={`url(#${id}-body)`} stroke={OUTLINE} strokeWidth="1.3" />
      <path d="M14.5 22 Q16 18.5 20 19" stroke="#a7a9be" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.55" />

      {/* Long crescent ears listen for the chosen alert hour */}
      <path d="M14 13 C8 9 8 3.5 11 1 C16 4 18 8 17 13 Z" fill={`url(#${id}-ear)`} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M26 13 C32 9 32 3.5 29 1 C24 4 22 8 23 13 Z" fill={`url(#${id}-ear)`} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M11 4 Q14 7 15.5 11 M29 4 Q26 7 24.5 11" stroke="#e2d7e6" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.65" />

      {/* Watchful round face */}
      <path d="M11 11 C14 7 26 7 29 11 C32 16 29 24 24.5 26.5 C21.5 28 18.5 28 15.5 26.5 C11 24 8 16 11 11 Z" fill={`url(#${id}-body)`} stroke={OUTLINE} strokeWidth="1.3" />
      <path d="M13.5 12 Q17 8.5 21 9.5" stroke="#afb0c4" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.6" />
      <ellipse cx="15.8" cy="17" rx="3" ry="3.6" fill={`url(#${id}-eye)`} stroke={OUTLINE} strokeWidth="0.9" />
      <ellipse cx="24.2" cy="17" rx="3" ry="3.6" fill={`url(#${id}-eye)`} stroke={OUTLINE} strokeWidth="0.9" />
      <ellipse cx="16.2" cy="17.5" rx="1.1" ry="1.8" fill="#283148" />
      <ellipse cx="23.8" cy="17.5" rx="1.1" ry="1.8" fill="#283148" />
      <circle cx="15.4" cy="15.8" r="0.7" fill="#ffffff" />
      <circle cx="23" cy="15.8" r="0.7" fill="#ffffff" />
      <path d="M18.5 22 L20 23.3 L21.5 22 Q20 21.2 18.5 22 Z" fill="#c17668" stroke={OUTLINE} strokeWidth="0.7" strokeLinejoin="round" />

      {/* Time-sense gem and star markings */}
      <circle className="garden-sprite__glow" cx="20" cy="10.5" r="2.4" fill={`url(#${id}-gem)`} stroke={OUTLINE} strokeWidth="0.8" />
      <path d="M20 8.8 V12.2 M18.3 10.5 H21.7" stroke="#effad8" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M15 28 L15.6 29.3 L17 29.5 L16 30.5 L16.2 32 L15 31.3 L13.8 32 L14 30.5 L13 29.5 L14.4 29.3 Z" fill="#d8d4a0" opacity="0.75" />
      <circle cx="25.5" cy="30" r="0.8" fill="#d8d4a0" opacity="0.7" />
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

export function GardenSprite({ element, size = 40, animated = false }: { element: GardenElementId; size?: number; animated?: boolean }) {
  const Comp = SPRITES[element] ?? Sprout;
  return <Comp size={size} animated={animated} />;
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
