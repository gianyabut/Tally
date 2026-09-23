/**
 * Tally-mark SVG path geometry — ported verbatim from the design prototype.
 * Marks group in fives (4 verticals + a diagonal strike). A half is a short
 * horizontal dash. Returns the path `d` and the x-cursor after drawing.
 */
export function seg(startX: number, count: number): { d: string; x: number } {
  let d = "";
  let x = startX;
  let rem = Math.max(0, count);

  while (rem >= 5) {
    d +=
      "M" + (x + 4) + " 3v20" +
      "M" + (x + 12) + " 3v20" +
      "M" + (x + 20) + " 3v20" +
      "M" + (x + 28) + " 3v20" +
      "M" + x + " 21L" + (x + 34) + " 5";
    x += 46;
    rem -= 5;
  }

  const whole = Math.floor(rem);
  for (let k = 0; k < whole; k++) {
    d += "M" + (x + 4) + " 3v20";
    x += 8;
  }
  if (rem % 1 >= 0.49) {
    d += "M" + (x + 4) + " 13h7";
    x += 13;
  }
  if (count > 0) x += 12;
  return { d, x };
}

export type TallyRowGeometry = {
  dLit: string;
  dDim: string;
  dPend: string;
  width: number;
};

/**
 * Build the three path layers for a tally row:
 * - lit: filled/earned marks (in litColor)
 * - dim: remaining-to-cap marks (hair color)
 * - pend: pending marks (signal, dashed)
 */
export function buildTallyRow(
  lit: number,
  dim: number,
  pend: number,
): TallyRowGeometry {
  const a = seg(0, lit);
  const d2 = seg(a.x, dim);
  const p = pend > 0 ? seg(d2.x, pend) : { d: "", x: d2.x };
  return {
    dLit: a.d,
    dDim: d2.d,
    dPend: p.d,
    width: Math.max(p.x, 20),
  };
}
