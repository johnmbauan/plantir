import type { IconProps } from "@/components/icons/types";

export default function IconBattery({ size = 14 }: IconProps) {
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
      <rect x="1" y="5.5" width="11.5" height="5" rx="1.5" />
      <path d="M12.5 7.5 L15 7.5 L15 8.5 L12.5 8.5" />
      <rect x="2.5" y="7" width="2.5" height="2" rx="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
