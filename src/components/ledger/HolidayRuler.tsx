import { weekday } from "@/lib/ledger/dates";
import type { RulerView } from "@/lib/ledger/ruler";

const STEP = 5; // px per day in viewBox units
const H = 62;
const mono = { fontFamily: "var(--font-mono), monospace", fontSize: 8.5 };
const tick = { strokeLinecap: "butt", fill: "none" } as const;

/**
 * The look-ahead ruler: one tick per day. Holidays are tall ink ticks, filed
 * leave is ring2 with a bar beneath, weekends are shorter and quieter.
 * Scales to its container's width; the viewBox stays STEP px per day.
 */
export function HolidayRuler({ ruler }: { ruler: RulerView }) {
  const w = ruler.ticks.length * STEP;
  const nextIdx = ruler.ticks.findIndex((t) => t.holiday);
  const mmdd = (iso: string) => iso.slice(5);

  const label =
    `Next ${ruler.ticks.length} days: ${ruler.holidayCount} ` +
    `${ruler.holidayCount === 1 ? "holiday" : "holidays"}, ` +
    `${ruler.leaveCount} ${ruler.leaveCount === 1 ? "leave" : "leaves"} filed`;

  return (
    <svg
      viewBox={`-3 0 ${w + 6} ${H}`}
      role="img"
      aria-label={label}
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      {ruler.ticks.map((t, i) => {
        const x = i * STEP + STEP / 2;
        let mark;
        if (t.holiday) {
          mark = (
            <g>
              <title>{`${t.holiday.name} · ${mmdd(t.date)} · ${weekday(t.date)}`}</title>
              <rect x={i * STEP - 1} y={10} width={STEP + 2} height={32} fill="transparent" />
              <path d={`M${x} 12V40`} style={{ ...tick, stroke: "var(--ink)", strokeWidth: 2 }} />
            </g>
          );
        } else if (t.leave) {
          mark = (
            <g>
              <title>{`${t.leave} · ${mmdd(t.date)} · ${weekday(t.date)}`}</title>
              <rect x={i * STEP} y={20} width={STEP} height={28} fill="transparent" />
              <path d={`M${x} 22V40`} style={{ ...tick, stroke: "var(--ring2)", strokeWidth: 2 }} />
            </g>
          );
        } else {
          mark = (
            <path
              d={`M${x} ${t.weekend ? 30 : 24}V40`}
              style={{
                ...tick,
                stroke: t.weekend ? "var(--line)" : "var(--hair)",
                strokeWidth: 1.4,
              }}
            />
          );
        }
        return (
          <g key={t.date}>
            {mark}
            {t.leave && (
              <rect x={i * STEP} y={43} width={STEP} height={3} style={{ fill: "var(--ring2)" }} />
            )}
            {t.month && (
              <text
                x={i * STEP + 1}
                y={58}
                style={{ ...mono, fill: "var(--faint)", letterSpacing: "0.12em" }}
              >
                {t.month}
              </text>
            )}
          </g>
        );
      })}

      {nextIdx >= 0 && (
        <text
          x={nextIdx * STEP + STEP / 2}
          y={8}
          textAnchor={nextIdx < 3 ? "start" : nextIdx > ruler.ticks.length - 4 ? "end" : "middle"}
          style={{ ...mono, fill: "var(--ink)" }}
        >
          {mmdd(ruler.ticks[nextIdx].date)}
        </text>
      )}

      {/* today (a holiday today already carries the label slot) */}
      {nextIdx !== 0 && <path d={`M${STEP / 2} 0L${STEP / 2 + 3.5} 6H${STEP / 2 - 3.5}Z`} style={{ fill: "var(--mut)" }} />}
    </svg>
  );
}
