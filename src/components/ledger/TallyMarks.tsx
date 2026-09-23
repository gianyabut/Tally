import { buildTallyRow } from "@/lib/ledger/tally";

/**
 * A single tally-mark row: lit (earned/remaining) + dim (to-cap) + pending.
 * height differs desktop/mobile via the `height` prop; viewBox stays 26 tall.
 */
export function TallyMarks({
  lit,
  dim,
  pending = 0,
  litColor,
  height = 26,
}: {
  lit: number;
  dim: number;
  pending?: number;
  litColor: string;
  height?: number;
}) {
  const g = buildTallyRow(lit, dim, pending);
  return (
    <svg
      width={g.width}
      height={height}
      viewBox={`0 0 ${g.width} 26`}
      style={{ flex: "none" }}
      aria-hidden
    >
      <path
        d={g.dLit}
        style={{
          stroke: litColor,
          strokeWidth: 2.2,
          strokeLinecap: "round",
          fill: "none",
        }}
      />
      <path
        d={g.dDim}
        style={{
          stroke: "var(--hair)",
          strokeWidth: 2.2,
          strokeLinecap: "round",
          fill: "none",
        }}
      />
      {pending > 0 && (
        <path
          d={g.dPend}
          style={{
            stroke: "var(--sig)",
            strokeWidth: 2.2,
            strokeLinecap: "round",
            fill: "none",
            strokeDasharray: "3 3",
          }}
        />
      )}
    </svg>
  );
}
