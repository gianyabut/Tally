// Shown the instant a tab is clicked while the next screen's data loads, so
// navigation responds immediately (and lets Next prefetch this boundary).
// The header and tab bar stay put; the content area is simply empty.
export default function Loading() {
  return <div style={{ flex: 1 }} aria-busy="true" aria-label="Loading" />;
}
