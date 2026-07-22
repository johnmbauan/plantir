import type { IconProps } from "@/components/icons/types";

export default function IconOffline({ size = 14 }: IconProps) {
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
      <circle cx="8" cy="13" r="1.1" fill="currentColor" stroke="none" />
      <path d="M5.5 10.5 C6.3 9.7 7.1 9.4 8 9.4 C8.9 9.4 9.7 9.7 10.5 10.5" />
      <path d="M3.5 8 C5 6.6 6.4 6 8 6 C9.6 6 11 6.6 12.5 8" />
      <line x1="2.5" y1="2.5" x2="13.5" y2="13.5" strokeWidth="1.6" />
    </svg>
  );
}
