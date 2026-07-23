import type { IconProps } from "@/components/icons/types";

export default function IconTrash({ size = 15 }: IconProps) {
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
      <path d="M3.5 5 H12.5" />
      <path d="M6 5 V3.5 H10 V5" />
      <path d="M4.5 5 L5 13 H11 L11.5 5" />
      <path d="M7 7.5 V10.5" />
      <path d="M9 7.5 V10.5" />
    </svg>
  );
}
