import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
} as const;

interface TeamLogoProps {
  size?: keyof typeof sizes;
  className?: string;
}

export function TeamLogo({ size = "md", className }: TeamLogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(sizes[size], className)}
      aria-label="Speedy Cheetahs logo"
    >
      {/* Background circle */}
      <circle cx="32" cy="32" r="30" fill="#1e3a5f" stroke="#d97706" strokeWidth="3" />

      {/* Cheetah body - sleek running form */}
      <g transform="translate(8, 16)">
        {/* Body */}
        <ellipse cx="24" cy="18" rx="14" ry="8" fill="#d97706" />

        {/* Head */}
        <circle cx="40" cy="13" r="7" fill="#d97706" />

        {/* Ear */}
        <path d="M43 7 L46 3 L44 8Z" fill="#b45309" />
        <path d="M38 7 L36 2 L40 7Z" fill="#b45309" />

        {/* Eye */}
        <circle cx="42" cy="12" r="1.5" fill="#0f172a" />
        <circle cx="42.5" cy="11.5" r="0.5" fill="white" />

        {/* Nose */}
        <ellipse cx="45" cy="14" rx="1.2" ry="0.8" fill="#0f172a" />

        {/* Tear line (cheetah marking) */}
        <path d="M43 14.5 C43 16 42 19 41 20" stroke="#0f172a" strokeWidth="1" strokeLinecap="round" fill="none" />

        {/* Spots */}
        <circle cx="20" cy="14" r="1.2" fill="#b45309" />
        <circle cx="25" cy="12" r="1" fill="#b45309" />
        <circle cx="30" cy="15" r="1.3" fill="#b45309" />
        <circle cx="17" cy="18" r="1" fill="#b45309" />
        <circle cx="23" cy="20" r="1.1" fill="#b45309" />
        <circle cx="28" cy="19" r="0.9" fill="#b45309" />
        <circle cx="33" cy="12" r="1" fill="#b45309" />

        {/* Front legs - running */}
        <path d="M34 24 L38 32" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M30 25 L26 32" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />

        {/* Back legs - running */}
        <path d="M16 23 L10 30" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M14 22 L18 30" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />

        {/* Tail */}
        <path
          d="M10 16 C4 12 2 8 6 5"
          stroke="#d97706"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="6" cy="5" r="1.5" fill="#0f172a" />
      </g>
    </svg>
  );
}
