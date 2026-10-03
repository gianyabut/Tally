import { weekday } from "@/lib/ledger/dates";
import type { RulerView } from "@/lib/ledger/ruler";

const H = 62;
const mono = { fontFamily: "var(--font-mono), monospace", fontSize: 8.5 };
const tick = { strokeLinecap: "butt", fill: "none" } as const;

/**
 * The look-ahead ruler: one tick per day. Holidays are tall ink ticks, filed
 * leave is ring2 with a bar beneath, weekends are shorter and quieter.
 * Scales to its container's width; `step` is the viewBox width per day.
 * Compact (step 5) labels only the next holiday, MM-DD; wide rulers have room
 * to label every holiday with its day number.
 */
export function HolidayRuler({ ruler, step = 5 }: { ruler: RulerView; step?: number }) {
  const w = ruler.ticks.length * step;
  const c = step / 2;
  const wide = step >= 10;
  const nextIdx = ruler.ticks.findIndex((t) => t.holiday);
  const mmdd = (iso: string) => iso.slice(5);
  const anchor = (i: number) =>
    i < 3 ? "start" : i > ruler.ticks.length - 4 ? "end" : "middle";

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
        const x = i * step + c;
        let mark;
        if (t.holiday) {
          mark = (
            <g>
              <title>{`${t.holiday.name} · ${mmdd(t.date)} · ${weekday(t.date)}`}</title>
              <rect x={i * step - 1} y={10} width={step + 2} height={32} fill="transparent" />
              <path d={`M${x} 12V40`} style={{ ...tick, stroke: "var(--ink)", strokeWidth: 2 }} />
            </g>
          );
        } else if (t.leave) {
          mark = (
            <g>
              <title>{`${t.leave} · ${mmdd(t.date)} · ${weekday(t.date)}`}</title>
              <rect x={i * step} y={20} width={step} height={28} fill="transparent" />
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
              <rect x={i * step} y={43} width={step} height={3} style={{ fill: "var(--ring2)" }} />
            )}
            {t.month && (
              <text
                x={i * step + 1}
                y={58}
                style={{ ...mono, fill: "var(--faint)", letterSpacing: "0.12em" }}
              >
                {t.month}
              </text>
            )}
            {wide && t.holiday && (
              <text
                x={x}
                y={8}
                textAnchor={anchor(i)}
                style={{ ...mono, fill: i === nextIdx ? "var(--ink)" : "var(--faint)" }}
              >
                {t.date.slice(8)}
              </text>
            )}
          </g>
        );
      })}

      {!wide && nextIdx >= 0 && (
        <text x={nextIdx * step + c} y={8} textAnchor={anchor(nextIdx)} style={{ ...mono, fill: "var(--ink)" }}>
          {mmdd(ruler.ticks[nextIdx].date)}
        </text>
      )}

      {/* today (a holiday today already carries the label slot) */}
      {nextIdx !== 0 && (
        <path d={`M${c} 0L${c + 3.5} 6H${c - 3.5}Z`} style={{ fill: "var(--mut)" }} />
      )}
    </svg>
  );
}
