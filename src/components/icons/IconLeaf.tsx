import type { IconProps } from "@/components/icons/types";

export default function IconLeaf({ size = 14 }: IconProps) {
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
      <path d="M3.5 12.5 C3.5 12.5 3 7 8 4.5 C13 2 13 2 13 2 C13 2 12.5 6.5 9 9 C7 10.5 4.5 11.5 3.5 12.5Z" />
      <path d="M3.5 12.5 C5 10.5 7 8.5 10 6" />
    </svg>
  );
}
