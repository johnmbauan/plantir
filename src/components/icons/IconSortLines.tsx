import type { IconProps } from "@/components/icons/types";

export default function IconSortLines({ size = 15 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="2" y1="4.5" x2="14" y2="4.5" />
      <line x1="2" y1="8" x2="10.5" y2="8" />
      <line x1="2" y1="11.5" x2="7" y2="11.5" />
    </svg>
  );
}
