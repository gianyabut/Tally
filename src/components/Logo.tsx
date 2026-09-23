/**
 * Tally-marks logo: 3 vertical strokes + 1 diagonal strike.
 * Drawn in `ink` by default; pass a color to override (e.g. paper ink in PDF).
 */
export function Logo({
  size = 26,
  color = "var(--ink)",
  strokeWidth = 2.4,
}: {
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 26 26"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 5v16M11 5v16M17 5v16M2.5 22.5L23.5 3.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
