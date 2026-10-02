// Sweeps the site's secondary colour hue (--accent-hue, used by
// var(--accent) in index.css) once around the colour wheel per minute,
// then repeats. It starts on the logo/favicon blue (hue 212, same as the
// default in index.css) and changes from there.
//
// Setting a plain inline custom property on <html> is an ordinary style
// change, so every browser re-resolves it everywhere it's used — including
// inside links and inline SVGs, which some browsers skipped with the
// earlier CSS-animation version.
const PERIOD_MS = 60_000;
const START_HUE = 212; // the blue of the logo and favicon (#85B3E8)
const MIN_STEP = 0.5; // degrees — smaller steps aren't visible, skip the work

export function startAccentCycle() {
  const root = document.documentElement;
  let last = -1;

  const tick = (now: number) => {
    const hue = (START_HUE + ((now % PERIOD_MS) / PERIOD_MS) * 360) % 360;
    if (hue < last || hue - last >= MIN_STEP) {
      root.style.setProperty('--accent-hue', hue.toFixed(1));
      last = hue;
    }
    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}
