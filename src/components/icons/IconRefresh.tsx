import type { IconProps } from "@/components/icons/types";

export default function IconRefresh({ size = 15 }: IconProps) {
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
      <path d="M13.5 3 V6.5 H10" />
      <path d="M13.2 6 A5.5 5.5 0 1 0 12 11.5" />
    </svg>
  );
}