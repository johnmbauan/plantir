import type { IconProps } from "@/components/icons/types";

export default function IconDrop({ size = 14 }: IconProps) {
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
      <path d="M8 2 C8 2 4 7.5 4 10.5 C4 12.4 5.8 14 8 14 C10.2 14 12 12.4 12 10.5 C12 7.5 8 2 8 2Z" />
    </svg>
  );
}
