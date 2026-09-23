/** True when a keypress is going into a form field (so shortcuts shouldn't fire). */
export function typingInField(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA");
}
