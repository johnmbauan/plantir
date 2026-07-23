import type { IconProps } from "@/components/icons/types";

export default function IconCalibrate({ size = 15 }: IconProps) {
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
      <line x1="2.5" y1="4.5" x2="13.5" y2="4.5" />
      <circle cx="6" cy="4.5" r="1.4" fill="currentColor" stroke="none" />
      <line x1="2.5" y1="8" x2="13.5" y2="8" />
      <circle cx="10" cy="8" r="1.4" fill="currentColor" stroke="none" />
      <line x1="2.5" y1="11.5" x2="13.5" y2="11.5" />
      <circle cx="7.5" cy="11.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
