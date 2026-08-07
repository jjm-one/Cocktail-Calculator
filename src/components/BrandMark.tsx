interface BrandMarkProps {
  size?: number;
  className?: string;
}

export function BrandMark({ size = 28, className }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="jjm.one"
    >
      <rect width="64" height="64" rx="15" fill="#16171a" />
      <text
        x="32"
        y="43"
        textAnchor="middle"
        fontFamily="'Segoe UI', Inter, Arial, sans-serif"
        fontWeight="800"
        fontSize="27"
        letterSpacing="-1"
      >
        <tspan fill="#21d6a4">j</tspan>
        <tspan fill="#29b6f6">j</tspan>
        <tspan fill="#ff3e82">m</tspan>
      </text>
    </svg>
  );
}
