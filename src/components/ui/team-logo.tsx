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
      aria-label="3D Printed Diamonds logo"
    >
      {/* Background circle */}
      <circle cx="32" cy="32" r="30" fill="#1e3a5f" stroke="#d97706" strokeWidth="3" />

      {/* 3D Diamond shape */}
      <g transform="translate(32, 32)">
        {/* Diamond crown (top facets) */}
        {/* Top point */}
        <polygon points="0,-20 -12,-6 12,-6" fill="#f59e0b" />
        {/* Left crown facet */}
        <polygon points="0,-20 -12,-6 -18,-6" fill="#d97706" />
        {/* Right crown facet */}
        <polygon points="0,-20 12,-6 18,-6" fill="#eab308" />

        {/* Girdle (middle band) */}
        <polygon points="-18,-6 -12,-6 -8,-2 -14,-2" fill="#b45309" />
        <polygon points="-12,-6 0,-6 4,-2 -8,-2" fill="#d97706" />
        <polygon points="0,-6 12,-6 8,-2 4,-2" fill="#ca8a04" />
        <polygon points="12,-6 18,-6 14,-2 8,-2" fill="#b45309" />

        {/* Pavilion (bottom facets) */}
        {/* Left facet */}
        <polygon points="-14,-2 -8,-2 0,22" fill="#92400e" />
        {/* Center-left facet */}
        <polygon points="-8,-2 4,-2 0,22" fill="#b45309" />
        {/* Center-right facet */}
        <polygon points="4,-2 8,-2 0,22" fill="#a16207" />
        {/* Right facet */}
        <polygon points="8,-2 14,-2 0,22" fill="#78350f" />

        {/* Highlight sparkle (top-left) */}
        <polygon points="-4,-14 -2,-10 -6,-10" fill="white" opacity="0.5" />
        {/* Small sparkle */}
        <circle cx="6" cy="-12" r="1" fill="white" opacity="0.4" />
      </g>
    </svg>
  );
}
