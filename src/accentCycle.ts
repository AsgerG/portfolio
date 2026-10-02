// Sweeps the site's secondary colour hue (--accent-hue, used by
// var(--accent) in index.css) from 0 to 359 over one minute, then repeats.
//
// Setting a plain inline custom property on <html> is an ordinary style
// change, so every browser re-resolves it everywhere it's used — including
// inside links and inline SVGs, which some browsers skipped with the
// earlier CSS-animation version.
const PERIOD_MS = 60_000;
const MIN_STEP = 0.5; // degrees — smaller steps aren't visible, skip the work

export function startAccentCycle() {
  const root = document.documentElement;
  let last = -1;

  const tick = (now: number) => {
    const hue = ((now % PERIOD_MS) / PERIOD_MS) * 359;
    if (hue < last || hue - last >= MIN_STEP) {
      root.style.setProperty('--accent-hue', hue.toFixed(1));
      last = hue;
    }
    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}
