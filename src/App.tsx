import { Fragment, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';

// drives smooth/eased scrolling site-wide. Lenis animates the native scroll
// position itself (window.scrollTo under the hood), so it still dispatches
// regular 'scroll' events — useScrollProgress below needs no changes to
// pick up the smoothed motion.
function useLenis() {
  useEffect(() => {
    const lenis = new Lenis();
    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);
}

function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    function handleScroll() {
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const value = total > 0 ? Math.min(Math.max(scrolled / total, 0), 1) : 0;
      setProgress(value);
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return { ref, progress };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp01(t: number) {
  return Math.min(Math.max(t, 0), 1);
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// smoothly blends between two hex colours, used to turn each word's text
// green as its checkmark spawns in
function lerpColor(hexA: string, hexB: string, t: number) {
  const ar = parseInt(hexA.slice(1, 3), 16);
  const ag = parseInt(hexA.slice(3, 5), 16);
  const ab = parseInt(hexA.slice(5, 7), 16);
  const br = parseInt(hexB.slice(1, 3), 16);
  const bg = parseInt(hexB.slice(3, 5), 16);
  const bb = parseInt(hexB.slice(5, 7), 16);
  const r = Math.round(lerp(ar, br, t));
  const g = Math.round(lerp(ag, bg, t));
  const b = Math.round(lerp(ab, bb, t));
  return `rgb(${r}, ${g}, ${b})`;
}

// a flat per-character width overestimates words with a lot of narrow
// letters (like "Tertiary", heavy on t/i/r), so this uses a rough per-letter
// width table for Inter medium instead — used to size any box to its text
const CHAR_WIDTH_EM: Record<string, number> = {
  i: 0.28,
  l: 0.28,
  j: 0.28,
  f: 0.32,
  t: 0.32,
  r: 0.35,
  a: 0.5,
  b: 0.55,
  c: 0.45,
  d: 0.55,
  e: 0.5,
  g: 0.55,
  h: 0.55,
  k: 0.5,
  n: 0.55,
  o: 0.56,
  p: 0.55,
  q: 0.55,
  s: 0.45,
  u: 0.55,
  v: 0.5,
  x: 0.5,
  y: 0.5,
  z: 0.45,
  m: 0.85,
  w: 0.78,
  D: 0.6,
  P: 0.6,
  S: 0.58,
  T: 0.55,
};
const DEFAULT_CHAR_WIDTH_EM = 0.55;

function estimateTextWidth(text: string, fontSize: number) {
  let em = 0;
  for (const ch of text) {
    em += CHAR_WIDTH_EM[ch] ?? DEFAULT_CHAR_WIDTH_EM;
  }
  return em * fontSize;
}

// ===== DEBUG GRID (temporary — delete this component and its one usage
// below when done sizing) =====
// Draws a 100px grid over the animation canvas with axis labels, purely as
// a sizing reference. It's absolutely positioned and pointer-events-none,
// so it never affects layout or interaction, and isn't part of the
// animation itself — nothing here reads scroll progress.
const SHOW_DEBUG_GRID = true;
const GRID_COLOR = '#9FD7F3';
function DebugGrid({ width, height, step = 100 }: { width: number; height: number; step?: number }) {
  const xLines: number[] = [];
  for (let x = 0; x <= width; x += step) xLines.push(x);
  const yLines: number[] = [];
  for (let y = 0; y <= height; y += step) yLines.push(y);

  return (
    <div className="absolute inset-0 pointer-events-none z-0" style={{ opacity: 0.2 }}>
      {/* each line is explicitly sized to `width`/`height` (not top-0/
          bottom-0 percentages), so it renders correctly regardless of
          whatever this sits inside — no dependency on an ancestor's own
          height. overall grid opacity is set once on the wrapper above. */}
      {xLines.map((x) => (
        <div key={`gx${x}`} className="absolute top-0" style={{ left: x, height }}>
          <div
            className="absolute top-0"
            style={{ width: 1, height, backgroundColor: GRID_COLOR }}
          />
          <span
            className="absolute top-0 left-1 text-[10px] leading-none font-mono"
            style={{ color: GRID_COLOR }}
          >
            {x}
          </span>
        </div>
      ))}
      {yLines.map((y) => (
        <div key={`gy${y}`} className="absolute left-0" style={{ top: y, width }}>
          <div
            className="absolute left-0"
            style={{ width, height: 1, backgroundColor: GRID_COLOR }}
          />
          <span
            className="absolute left-1 top-0 text-[10px] leading-none font-mono"
            style={{ color: GRID_COLOR }}
          >
            {y}
          </span>
        </div>
      ))}
    </div>
  );
}
// ===== END DEBUG GRID =====

type Point = { x: number; y: number };

// black, white, blue
const circleColors = ['#121212', '#FFFFFF', '#0284C7'];

// row layout while the circles are appearing, left to right:
// blue, black, white, then the logo — all with the same edge-to-edge gap.
const startPositions: Point[] = [
  { x: 116, y: 120 },
  { x: 164, y: 120 },
  { x: 68, y: 120 },
];

const ROW_Y = 90;
// left edge of the row grid / stacked cards / labels (BOX_START_X below) —
// everything in the rows-and-stacking phase of the animation is positioned
// relative to this, so shifting it shifts virtually the whole sequence.
// 37 here puts BOX_START_X (= ROW_START_X - 12) at 25.
const ROW_START_X = 37;
const ROW_SPACING = 26;
const rowX = (i: number) => ROW_START_X + i * ROW_SPACING;

// vertical gap between each group of rows (neutrals / brand / analogous),
// and the tighter gap between rows within the same group
const GROUP_GAP = 90;
const ROW_GAP = 32;
const BLUE_Y = ROW_Y + GROUP_GAP;

// black + white right next to each other on top, blue underneath aligned
// with black, on the left. White sits at the row's first slot so it can
// slide straight into the greyscale row from here.
const endPositions: Point[] = [
  { x: rowX(0), y: ROW_Y },
  { x: rowX(1), y: ROW_Y },
  { x: rowX(0), y: BLUE_Y },
];

// black, white, and blue all appear together
function circleAppear(progress: number, windowEnd: number) {
  const local = clamp01(progress / windowEnd);
  return {
    opacity: local,
    scale: 0.2 + local * 0.8,
  };
}

// full greyscale row: black (matches the existing circle) through white
// (matches the existing circle), evenly spaced along y = 90
const grayscaleRow = [
  '#121212',
  '#14191F',
  '#1A1E23',
  '#333A42',
  '#3E4651',
  '#545F6D',
  '#6A798A',
  '#8693A2',
  '#9CA6B2',
  '#D4D8DE',
  '#FFFFFF',
];

// the first 4 (darkest) circles in the greyscale row keep a subtle stroke,
// since they'd otherwise blend into the dark canvas background
const GREYSCALE_STROKE_COLORS = grayscaleRow.slice(0, 4);

const WHITE_START_X = endPositions[1].x; // rowX(1), right next to black
const WHITE_END_X = rowX(grayscaleRow.length - 1); // final resting spot, far right

// blue moves one step right (rowX(0) -> rowX(1)), then one new circle spawns
// to its left and two more to its right
const BLUE_START_X = endPositions[2].x; // rowX(0)
const BLUE_MOVED_X = rowX(1);
const blueRow = ['#0C4A6E', '#0284C7', '#0EA5E9', '#38BDF8'];

// teal row and the purple circle spawn together, underneath the blue row.
// they stay close to one another (same group), further below the blue row
const TEAL_Y = BLUE_Y + GROUP_GAP;
const PURPLE_Y = TEAL_Y + ROW_GAP;
const tealRow = ['#0F766E', '#0D9488', '#14B8A6'];
const purpleColor = '#4338CA';

// signal group: two single-colour rows, underneath the analogous group
const GREEN_Y = PURPLE_Y + GROUP_GAP;
const RED_Y = GREEN_Y + ROW_GAP;
const greenColor = '#21C45D';
const redColor = '#F83959';

// five new rows, formed by moving existing coloured circles (still
// circles, no shape change), each equally spaced from the next.
const ROW1_Y = ROW_Y;
const ROW2_Y = ROW1_Y + GROUP_GAP;
const ROW3_Y = ROW2_Y + GROUP_GAP;
const ROW4_Y = ROW3_Y + GROUP_GAP;
const ROW5_Y = ROW4_Y + GROUP_GAP;

// row 1: black, #1A1E23, #333A42
// row 2: #9CA6B2, #D4D8DE, #FFFFFF (white)
// row 3: #0284C7 (blue), #0F766E (teal), #545F6D, #333A42 (duplicate)
// row 4: #0C4A6E
// row 5: purple (same circle as the analogous purple), #21C45D (green), #F83959 (red)
const rowTargetY: Record<string, number> = {
  '#121212': ROW1_Y,
  '#1A1E23': ROW1_Y,
  '#333A42': ROW1_Y,
  '#9CA6B2': ROW2_Y,
  '#D4D8DE': ROW2_Y,
  '#FFFFFF': ROW2_Y,
  '#0284C7': ROW3_Y,
  '#0F766E': ROW3_Y,
  '#545F6D': ROW3_Y,
  '#0C4A6E': ROW4_Y,
  [purpleColor]: ROW5_Y,
  '#21C45D': ROW5_Y,
  '#F83959': ROW5_Y,
};
const rowTargetX: Record<string, number> = {
  '#121212': rowX(0),
  '#1A1E23': rowX(1),
  '#333A42': rowX(2),
  '#FFFFFF': rowX(0),
  '#D4D8DE': rowX(1),
  '#9CA6B2': rowX(2),
  '#0284C7': rowX(0),
  '#0F766E': rowX(1),
  '#545F6D': rowX(2),
  '#0C4A6E': rowX(0),
  [purpleColor]: rowX(0),
  '#21C45D': rowX(1),
  '#F83959': rowX(2),
};

// #545F6D is already part of the greyscale row and travels there like the
// others; #333A42 needs an extra instant duplicate for row 3 (the original
// stays in row 1), since it has no second circle to travel from
const NEW_ROW3_X2 = rowX(3); // #333A42 duplicate

// once each row has formed, every circle in it morphs into a rectangular
// element sized for that row. boxes are left-aligned starting at the same
// edge the original 24px circles rendered at (their centre minus their own
// radius), so the row headers — and the circles earlier in the animation —
// don't need to move to match; only the boxes shift to meet them.
const BOX_START_X = ROW_START_X - 12;
const MORPH_GAP = 8;
const SHAPE_RADIUS = 8;
const BUTTON_RADIUS = 4; // row 3's buttons get a tighter corner radius
const ROW1_RADIUS = 16; // row 1's elements get a rounder corner radius

// after row 1 settles into its 120x40 swatches, they restack into cards,
// left-aligned at the same edge, with the lowest card rendered on top.
// The top group's card size is derived from its margins around the row-2
// text framed on top of it: 16px left/right margin, 8px top/bottom margin,
// and a 12px overlap between successive cards.
const ROW1_STACK_MARGIN_X = 16;
const ROW1_STACK_MARGIN_TOP = 8;
const ROW1_STACK_MARGIN_BOTTOM = 8;
const ROW1_STACK_OVERLAP = 12;
const ROW1_STACK_CONTENT_HEIGHT = 27; // row-2 text line height (18px * 1.5)
// width of "Primary  Secondary  Tertiary" at their current sizes/spacing
const ROW1_STACK_CONTENT_WIDTH = 256;
const STACK_WIDTH =
  ROW1_STACK_MARGIN_X + ROW1_STACK_CONTENT_WIDTH + ROW1_STACK_MARGIN_X; // 288
const STACK_HEIGHT =
  ROW1_STACK_MARGIN_TOP +
  ROW1_STACK_CONTENT_HEIGHT +
  ROW1_STACK_MARGIN_BOTTOM +
  ROW1_STACK_OVERLAP; // 55
const STACK_GAP_Y = STACK_HEIGHT - ROW1_STACK_OVERLAP; // 43
const ROW1_TOP_EDGE = ROW1_Y - 12; // the fixed top edge row 1 already renders at

// once stacking begins, both the top and bottom card groups lift higher
// than their natural row position. The bottom group lifts an extra bit
// further still, closing up the gap between the two groups.
const GROUP_LIFT = 60;
const LOWER_GROUP_EXTRA_LIFT = 20;

// once the third text duplicate lands (Primary + Secondary only, no
// Tertiary), the last card narrows to fit just those two labels instead
// of anticipating all three
const ROW1_STACK_LAST_CONTENT_WIDTH = 176; // "Primary" + gap + "Secondary"
const ROW1_STACK_LAST_WIDTH =
  ROW1_STACK_MARGIN_X + ROW1_STACK_LAST_CONTENT_WIDTH + ROW1_STACK_MARGIN_X; // 208

function stackRow1(
  centerX: number,
  y: number,
  width: number,
  height: number,
  slotIndex: number,
  stackT: number,
  lastWidthT: number = 0,
) {
  const baseTopEdge = y - 12;
  const topEdge =
    baseTopEdge + slotIndex * STACK_GAP_Y * stackT - GROUP_LIFT * stackT;
  // only the last (third) card narrows, and only once lastWidthT ramps in
  const targetWidth =
    slotIndex === 2
      ? lerp(STACK_WIDTH, ROW1_STACK_LAST_WIDTH, lastWidthT)
      : STACK_WIDTH;
  const targetCenterX = BOX_START_X + targetWidth / 2;
  const newWidth = lerp(width, targetWidth, stackT);
  const newHeight = lerp(height, STACK_HEIGHT, stackT);
  return {
    x: lerp(centerX, targetCenterX, stackT),
    top: topEdge + newHeight / 2,
    width: newWidth,
    height: newHeight,
    zIndex: slotIndex + 1,
  };
}

// row 1 also spawns a duplicate of each element, sitting exactly on top of
// the original until the resize begins. Then, while the original stacks
// upward into overlapping cards, the duplicate grows to a wider card
// (left-aligned at the same edge) and stacks the same way, 220px further
// down the canvas. Same left/right margin and overlap as the top group,
// but a taller 16px top/bottom margin — sized here around the row-3
// buttons ("Primary Secondary Tertiary Disabled") framed on top of it
// instead of the row-2 text.
const DUPLICATE_ROW_Y_OFFSET = 220;
const DUPLICATE_MARGIN_TOP = 16;
const DUPLICATE_MARGIN_BOTTOM = 16;
const ROW3_STACK_CONTENT_HEIGHT = 28; // row-3 button height
// width of "Primary Secondary Tertiary Disabled" at their current sizes/spacing
const ROW3_STACK_CONTENT_WIDTH = 395;
const DUPLICATE_WIDTH =
  ROW1_STACK_MARGIN_X + ROW3_STACK_CONTENT_WIDTH + ROW1_STACK_MARGIN_X; // 427
const DUPLICATE_HEIGHT =
  DUPLICATE_MARGIN_TOP +
  ROW3_STACK_CONTENT_HEIGHT +
  DUPLICATE_MARGIN_BOTTOM +
  ROW1_STACK_OVERLAP; // 72
const DUPLICATE_GAP_Y = DUPLICATE_HEIGHT - ROW1_STACK_OVERLAP; // 60
const DUPLICATE_CENTER_X = BOX_START_X + DUPLICATE_WIDTH / 2;

const WARNING_ICON_SIZE = 20; // shared icon size for the checkmark badge

function duplicateRow1(
  centerX: number,
  y: number,
  width: number,
  height: number,
  slotIndex: number,
  stackT: number,
) {
  const newWidth = lerp(width, DUPLICATE_WIDTH, stackT);
  const newHeight = lerp(height, DUPLICATE_HEIGHT, stackT);
  const baseTopEdge = y - 12;
  // same overlapping-stack layout as stackRow1, just shifted down by the
  // fixed offset — the last (lowest) card still ends up on top
  const topEdge =
    baseTopEdge +
    DUPLICATE_ROW_Y_OFFSET * stackT +
    slotIndex * DUPLICATE_GAP_Y * stackT -
    GROUP_LIFT * stackT -
    LOWER_GROUP_EXTRA_LIFT * stackT;
  return {
    x: lerp(centerX, DUPLICATE_CENTER_X, stackT),
    top: topEdge + newHeight / 2,
    width: newWidth,
    height: newHeight,
    zIndex: slotIndex + 1,
  };
}

const rowShapeByY: Record<number, { width: number; height: number }> = {
  [ROW1_Y]: { width: 120, height: 40 }, // background
  [ROW2_Y]: { width: 85, height: 24 }, // text
  [ROW3_Y]: { width: 101, height: 28 }, // button
  [ROW4_Y]: { width: 101, height: 28 }, // chip
  [ROW5_Y]: { width: 40, height: 20 }, // tag
};

// recover a row's 0-based slot index from the pixel x-position it was
// assigned in rowTargetX (they're all just ROW_START_X + i * ROW_SPACING)
function slotIndexFromX(x: number) {
  return Math.round((x - ROW_START_X) / ROW_SPACING);
}

// interpolate a circle at `centerX` into its row's rectangular shape,
// left-aligned within the row using its slot index
function morphShape(
  centerX: number,
  targetY: number,
  slotIndex: number,
  morphT: number,
  endRadius: number = SHAPE_RADIUS,
  shapeOverride?: { width: number; height: number },
) {
  const shape = shapeOverride ?? rowShapeByY[targetY];
  const rectLeft = BOX_START_X + slotIndex * (shape.width + MORPH_GAP);
  const rectCenterX = rectLeft + shape.width / 2;
  return {
    x: lerp(centerX, rectCenterX, morphT),
    width: lerp(24, shape.width, morphT),
    height: lerp(24, shape.height, morphT),
    radius: lerp(12, endRadius, morphT),
  };
}

// row 3 becomes actual buttons: white "Button" label plus a matching-colour
// chevron, faded in only once the shape has mostly finished morphing
const ROW3_BUTTON_COLORS = ['#0284C7', '#0F766E', '#545F6D'];

function ButtonLabel({
  opacity,
  text = 'Button',
  color = '#FFFFFF',
}: {
  opacity: number;
  text?: string;
  color?: string;
}) {
  return (
    <span
      className="flex items-center justify-center gap-2 font-medium whitespace-nowrap"
      style={{ opacity, color, fontFamily: 'Inter, sans-serif', fontSize: 14 }}
    >
      {text}
      <svg
        width="8"
        height="8"
        viewBox="0 0 8 8"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5.46967 4.53033C5.76256 4.23744 5.76256 3.76256 5.46967 3.46967L3.28033 1.28033C2.80785 0.807855 2 1.14248 2 1.81066V6.18934C2 6.85752 2.80786 7.19214 3.28033 6.71967L5.46967 4.53033Z"
          fill={color}
        />
      </svg>
    </span>
  );
}

// each row-3 button is sized to fit its own label (text + gap + chevron)
// instead of sharing one fixed width, in slot order: Primary, Secondary,
// Tertiary, Disabled
const ROW3_TEXTS = ['Primary', 'Secondary', 'Tertiary', 'Disabled'];
const ROW3_FONT_SIZE = 14;
const ROW3_ICON_GAP = 8; // matches the flex gap-2 used in ButtonLabel
const ROW3_ICON_WIDTH = 8;
const ROW3_BUTTON_MARGIN_X = 12;
const ROW3_WIDTHS = ROW3_TEXTS.map((text) =>
  Math.round(
    estimateTextWidth(text, ROW3_FONT_SIZE) +
      ROW3_ICON_GAP +
      ROW3_ICON_WIDTH +
      ROW3_BUTTON_MARGIN_X * 2,
  ),
);
function row3Left(slotIndex: number) {
  let left = BOX_START_X;
  for (let i = 0; i < slotIndex; i++) {
    left += ROW3_WIDTHS[i] + MORPH_GAP;
  }
  return left;
}
// once row 1's duplicates stack, row 3's buttons also nudge up and right
// to sit framed in the corner of the duplicate stack's top card: 16px below
// its top edge (matching the duplicate stack's own top/bottom margin),
// 16px right of its left edge, keeping the buttons' own relative spacing
const ROW3_STACK_MARGIN_TOP = DUPLICATE_MARGIN_TOP;
const ROW3_STACK_MARGIN_LEFT = 16;
const ROW3_STACK_TOP_EDGE =
  ROW1_TOP_EDGE +
  DUPLICATE_ROW_Y_OFFSET +
  ROW3_STACK_MARGIN_TOP -
  GROUP_LIFT -
  LOWER_GROUP_EXTRA_LIFT;
const ROW3_STACK_LEFT_X = BOX_START_X + ROW3_STACK_MARGIN_LEFT;

function morphRow3(
  centerX: number,
  slotIndex: number,
  morphT: number,
  stackT: number,
  endRadius: number = BUTTON_RADIUS,
) {
  const targetWidth = ROW3_WIDTHS[slotIndex];
  const targetHeight = rowShapeByY[ROW3_Y].height;
  const baseLeft = row3Left(slotIndex);
  const stackedLeft = ROW3_STACK_LEFT_X + (baseLeft - BOX_START_X);
  const rectLeft = lerp(baseLeft, stackedLeft, stackT);
  const rectCenterX = rectLeft + targetWidth / 2;
  return {
    x: lerp(centerX, rectCenterX, morphT),
    width: lerp(24, targetWidth, morphT),
    height: lerp(24, targetHeight, morphT),
    radius: lerp(12, endRadius, morphT),
  };
}

// row 3's vertical position while framing against the duplicate stack (see
// morphRow3 above for the matching horizontal shift)
function row3StackTop(y: number, height: number, stackT: number) {
  const baseTopEdge = y - height / 2;
  const topEdge = lerp(baseTopEdge, ROW3_STACK_TOP_EDGE, stackT);
  return topEdge + height / 2;
}

// row 4 is styled like row 3's buttons, but with an added #0284C7 stroke:
// white "Chip" label plus a matching-colour close icon
const CHIP_STROKE_COLOR = '#0284C7';

function ChipLabel({ opacity }: { opacity: number }) {
  return (
    <span
      className="flex items-center justify-center gap-1 text-white font-medium whitespace-nowrap"
      style={{ opacity, fontFamily: 'Inter, sans-serif', fontSize: 14 }}
    >
      <svg
        width="20"
        height="12"
        viewBox="0 0 20 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="20" height="12" fill="white" />
        <rect x="9" y="7" width="11" height="5" fill="#F83959" />
        <rect y="7" width="7" height="5" fill="#F83959" />
        <rect x="9" width="11" height="5" fill="#F83959" />
        <rect width="7" height="5" fill="#F83959" />
      </svg>
      {ROW4_TEXT}
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2.75 9.25L9.25 2.75M2.75 2.75L9.25 9.25"
          stroke="white"
          strokeOpacity="0.6"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

// row 4's box is sized to fit its content (flag icon, text, close icon)
// with an 8px margin on each side, instead of sharing row 3's fixed width
const ROW4_TEXT = 'Denmark';
const ROW4_FONT_SIZE = 14;
const ROW4_GAP = 4; // matches the flex gap-1 used in ChipLabel
const ROW4_FLAG_WIDTH = 20;
const ROW4_CLOSE_ICON_WIDTH = 12;
const ROW4_MARGIN_X = 14;
rowShapeByY[ROW4_Y] = {
  width: Math.round(
    ROW4_FLAG_WIDTH +
      ROW4_GAP +
      estimateTextWidth(ROW4_TEXT, ROW4_FONT_SIZE) +
      ROW4_GAP +
      ROW4_CLOSE_ICON_WIDTH +
      ROW4_MARGIN_X * 2,
  ),
  height: rowShapeByY[ROW4_Y].height,
};

// row 5's tags each get their own content: purple gets a bold "NEW" label,
// green gets a checkmark, red gets a dash — all white, faded in on the same
// schedule as the other rows' labels
function NewLabel({ opacity }: { opacity: number }) {
  return (
    <span
      className="text-white font-bold whitespace-nowrap"
      style={{ opacity, fontFamily: 'Inter, sans-serif', fontSize: 11 }}
    >
      NEW
    </span>
  );
}

function CheckIcon({ opacity }: { opacity: number }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
    >
      <path
        d="M3.43744 10.5211L5.22721 8.73129L8.0113 11.5154L14.7727 4.75391L16.5624 6.54373L8.0113 15.0951L3.43744 10.5211Z"
        fill="white"
      />
    </svg>
  );
}

function DashIcon({ opacity }: { opacity: number }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
    >
      <rect x="2.50168" y="8.12524" width="15" height="3.75" fill="white" />
    </svg>
  );
}

// spawns to the left of each of the three words, one at a time, as the
// word's own text color turns green
const CHECK_GREEN = '#21C45D';
function SuccessIcon({ opacity }: { opacity: number }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20 10.0004C20 15.5232 15.5228 20.0004 10 20.0004C4.47715 20.0004 0 15.5232 0 10.0004C0 4.47752 4.47715 0.000366211 10 0.000366211C15.5228 0.000366211 20 4.47752 20 10.0004Z"
        fill={CHECK_GREEN}
      />
      <path
        d="M3.74995 10.4928L5.4545 8.78822L8.10601 11.4398L14.5454 5.00024L16.25 6.70484L8.10601 14.849L3.74995 10.4928Z"
        fill="white"
      />
    </svg>
  );
}

// row 2 becomes text swatches: each box's background fades away, leaving
// behind a label set in that same colour ("Primary"/"Secondary"/"Tertiary",
// left to right) so the colour itself becomes the visible element
const ROW2_TEXT_COLORS = ['#FFFFFF', '#D4D8DE', '#9CA6B2'];
// the last (third) duplicate only carries Primary + Secondary onto the
// last card — Tertiary doesn't get a third copy
const ROW2_LAST_DUP_COLORS = ['#FFFFFF', '#D4D8DE'];
const ROW2_LABELS = ['Primary', 'Secondary', 'Tertiary'];
const ROW2_FONT_SIZE = 18;

function ColorLabel({ text, color }: { text: string; color: string }) {
  return (
    <span
      className="flex items-center justify-center whitespace-nowrap font-medium"
      style={{ color, fontFamily: 'Inter, sans-serif', fontSize: ROW2_FONT_SIZE }}
    >
      {text}
    </span>
  );
}

// each row-2 box is sized to fit its own label instead of a shared width,
// using the shared per-letter width estimate (see estimateTextWidth above)
const ROW2_PADDING_X = 12;
const row2Widths = ROW2_LABELS.map((label) =>
  Math.round(estimateTextWidth(label, ROW2_FONT_SIZE) + ROW2_PADDING_X),
);
function row2Left(slotIndex: number) {
  let left = BOX_START_X;
  for (let i = 0; i < slotIndex; i++) {
    left += row2Widths[i] + MORPH_GAP;
  }
  return left;
}
// once row 1 restacks, row 2's text also nudges up and right to sit framed
// in the corner of row 1's first (black) card: 8px below its top edge,
// 20px right of its left edge, keeping the labels' own relative spacing
const ROW2_STACK_MARGIN_TOP = 8;
const ROW2_STACK_MARGIN_LEFT = 16;
const ROW2_STACK_TOP_EDGE = ROW1_TOP_EDGE + ROW2_STACK_MARGIN_TOP - GROUP_LIFT;
const ROW2_STACK_LEFT_X = BOX_START_X + ROW2_STACK_MARGIN_LEFT;

function morphRow2(
  centerX: number,
  slotIndex: number,
  morphT: number,
  stackT: number,
) {
  const targetWidth = row2Widths[slotIndex];
  const baseLeft = row2Left(slotIndex);
  const stackedLeft = ROW2_STACK_LEFT_X + (baseLeft - BOX_START_X);
  const rectLeft = lerp(baseLeft, stackedLeft, stackT);
  const rectCenterX = rectLeft + targetWidth / 2;
  const height = rowShapeByY[ROW2_Y].height;
  return {
    x: lerp(centerX, rectCenterX, morphT),
    width: lerp(24, targetWidth, morphT),
    height: lerp(24, height, morphT),
    radius: lerp(12, SHAPE_RADIUS, morphT),
  };
}

// row 2's vertical position while stacking (see morphRow2 above for the
// matching horizontal shift)
function row2StackTop(y: number, height: number, stackT: number) {
  const baseTopEdge = y - height / 2;
  const topEdge = lerp(baseTopEdge, ROW2_STACK_TOP_EDGE, stackT);
  return topEdge + height / 2;
}

// row 5 no longer shares one uniform width: purple stays the tag size,
// green and red shrink to 20x20 squares, so their spacing is computed from
// each element's own width instead of the generic per-row shared width
const ROW5_WIDTHS = [40, 20, 20]; // purple, green, red
function row5Left(slotIndex: number) {
  let left = BOX_START_X;
  for (let i = 0; i < slotIndex; i++) {
    left += ROW5_WIDTHS[i] + MORPH_GAP;
  }
  return left;
}
function morphRow5(
  centerX: number,
  slotIndex: number,
  targetHeight: number,
  endRadius: number,
  morphT: number,
) {
  const targetWidth = ROW5_WIDTHS[slotIndex];
  const rectLeft = row5Left(slotIndex);
  const rectCenterX = rectLeft + targetWidth / 2;
  return {
    x: lerp(centerX, rectCenterX, morphT),
    width: lerp(24, targetWidth, morphT),
    height: lerp(24, targetHeight, morphT),
    radius: lerp(12, endRadius, morphT),
  };
}

// a header labels each row as it spawns in, all sharing the same left edge
// so they line up with one another regardless of how wide each row is
const LABEL_OFFSET = 26;
const LABEL_X = BOX_START_X;
const NEUTRALS_LABEL_Y = ROW_Y - LABEL_OFFSET;
const BRAND_LABEL_Y = BLUE_Y - LABEL_OFFSET;
const ANALOGOUS_LABEL_Y = TEAL_Y - LABEL_OFFSET;
const SIGNAL_LABEL_Y = GREEN_Y - LABEL_OFFSET;

// each of the five new rows gets its own header, same left edge as above
const ROW1_LABEL_Y = ROW1_Y - LABEL_OFFSET;
const ROW2_LABEL_Y = ROW2_Y - LABEL_OFFSET;
const ROW3_LABEL_Y = ROW3_Y - LABEL_OFFSET;
const ROW4_LABEL_Y = ROW4_Y - LABEL_OFFSET;
const ROW5_LABEL_Y = ROW5_Y - LABEL_OFFSET;
const rowLabels = ['background', 'text', 'button', 'chip', 'tag'];

const paragraphs = [
  'Placeholder text goes here. Replace this with the first thing you want people to read as they scroll.',
  'A second block of placeholder copy. This is where the story continues while the visual stays put.',
  'Then the white circle slides right, and the full greyscale spawns in behind it.',
  'Blue takes a step right, and a few shades of blue spawn in around it.',
  'The teal row and the purple circle unfold together underneath it.',
  'Finally, the signal group spawns in with green and red.',
  'Then black, #1A1E23, and #333A42 regroup into the first row of five.',
  'Row two gathers #9CA6B2, #D4D8DE, and white.',
  'Row three gathers blue, teal, #545F6D, and a duplicate of #333A42.',
  'Row four is just #0C4A6E on its own.',
  'Row five closes it out with #4338CA, green, and red.',
];

function App() {
  useLenis();
  const { ref, progress } = useScrollProgress<HTMLDivElement>();

  // the whole original sequence below is compressed into 0 -> 0.85 (every
  // threshold and span scaled by TIMELINE_SCALE, preserving how each stage
  // hands off to the next), freeing up TIMELINE_SCALE -> 1 for the new
  // outro stage: everything scrolls up and vanishes, revealing the new
  // illustration underneath. TIMELINE_SCALE closer to 1 = a shorter,
  // faster outro (less of the scroll devoted to it).
  //
  // 0    -> 0.07: circles appear next to the logo
  // 0.07 -> 0.11: logo fades out, circles slide into their grid layout
  // 0.11 -> 0.21: white slides right, the greyscale spawns in along the way
  // 0.21 -> 0.29: blue steps right, three shades of blue spawn in around it
  // 0.29 -> 0.39: the teal row + purple circle spawn underneath the blue row
  // 0.39 -> 0.5:  the signal group (green + red) spawns underneath that
  // 0.5  -> 0.7:  all five rows form together, as everything unclaimed
  //               fades away
  // 0.7  -> 0.85: every circle in a row morphs into that row's shape
  // 0.85 -> 1:    row 1's swatches restack into overlapping cards
  // (all scaled by TIMELINE_SCALE)
  // 0.85 -> 1:    outro — everything scrolls up and fades out, the new
  //               illustration fades in underneath
  const TIMELINE_SCALE = 0.95; // was 0.85, then 0.93 — shrinks the outro's
  // scroll range further (7% -> 5% of the total). The exit/reveal still
  // travel the same pixel distances (EXIT_LIFT, REVEAL_Y_START/END below),
  // just packed into less scroll, closing the gap between them.
  const appearEnd = 0.07 * TIMELINE_SCALE;
  const moveT = clamp01((progress - appearEnd) / (0.04 * TIMELINE_SCALE));
  const spawnT = clamp01((progress - 0.11 * TIMELINE_SCALE) / (0.1 * TIMELINE_SCALE));
  const svgOpacity = 1 - moveT;

  // "Neutrals" fades in once the new shades of grey start appearing,
  // not while black and white are just settling into the grid
  const neutralsLabelLocal = spawnT;

  const stageD = clamp01((progress - 0.21 * TIMELINE_SCALE) / (0.08 * TIMELINE_SCALE));
  const blueMoveT = clamp01(stageD / 0.35);
  const blueLeftLocal = clamp01((stageD - 0.15) / 0.35);
  const blueRight1Local = clamp01((stageD - 0.45) / 0.35);
  const blueRight2Local = clamp01((stageD - 0.65) / 0.35);

  // "Brand" fades in as the blue row spawns
  const brandLabelLocal = clamp01(stageD / 0.6);

  // the teal row and the purple circle unfold together: the row cascades
  // left to right, while purple starts at the same moment as the first dot
  const stageRows = clamp01((progress - 0.29 * TIMELINE_SCALE) / (0.1 * TIMELINE_SCALE));
  const teal0Local = clamp01(stageRows / 0.5);
  const teal1Local = clamp01((stageRows - 0.15) / 0.5);
  const teal2Local = clamp01((stageRows - 0.3) / 0.5);
  const purpleLocal = clamp01(stageRows / 0.5);

  // "Analogous" fades in as the teal row and purple circle spawn
  const analogousLabelLocal = clamp01(stageRows / 0.5);

  // green and red spawn in together
  const stageSignal = clamp01((progress - 0.39 * TIMELINE_SCALE) / (0.11 * TIMELINE_SCALE));
  const greenLocal = clamp01(stageSignal / 0.6);
  const redLocal = clamp01(stageSignal / 0.6);

  // "Signal" fades in as green and red spawn
  const signalLabelLocal = clamp01(stageSignal / 0.6);

  // all five rows form together, then every claimed circle morphs into
  // its row's rectangular shape
  const stageRowAll = clamp01((progress - 0.5 * TIMELINE_SCALE) / (0.2 * TIMELINE_SCALE));
  const stageRow1 = stageRowAll;
  const stageRow2 = stageRowAll;
  const stageRow3 = stageRowAll;
  const stageRow4 = stageRowAll;
  const stageRow5 = stageRowAll;
  const morphT = clamp01((progress - 0.7 * TIMELINE_SCALE) / (0.15 * TIMELINE_SCALE));

  // row 1's swatches restack into overlapping cards, row 2's text frames
  // onto the first card, and row 3's buttons frame onto the duplicate stack
  const stackT = clamp01((progress - 0.85 * TIMELINE_SCALE) / (0.04 * TIMELINE_SCALE));

  // only once that initial move settles does row 2's text duplicate and
  // the copy shift down to sit framed against the stack's second card
  const textDupT = clamp01((progress - 0.89 * TIMELINE_SCALE) / (0.03 * TIMELINE_SCALE));

  // then, once that second copy settles, it duplicates again and the new
  // copy shifts down another 43px to sit framed against the third card
  const textDupT2 = clamp01((progress - 0.92 * TIMELINE_SCALE) / (0.03 * TIMELINE_SCALE));

  // then, three words spawn in underneath the stacked groups, one at a time
  const wordsT = clamp01((progress - 0.95 * TIMELINE_SCALE) / (0.025 * TIMELINE_SCALE));
  const word1Local = clamp01(wordsT / (1 / 3));
  const word2Local = clamp01((wordsT - 1 / 3) / (1 / 3));
  const word3Local = clamp01((wordsT - 2 / 3) / (1 / 3));

  // finally, once those words have all spawned, a green checkmark appears
  // to the left of each one, one at a time, and its text turns to match
  const checksT = clamp01((progress - 0.975 * TIMELINE_SCALE) / (0.025 * TIMELINE_SCALE));
  const check1Local = clamp01(checksT / (1 / 3));
  const check2Local = clamp01((checksT - 1 / 3) / (1 / 3));
  const check3Local = clamp01((checksT - 2 / 3) / (1 / 3));

  // outro: the SVG starts moving right at the top of the outro (progress =
  // TIMELINE_SCALE = 0.95), the same moment the exit starts — but it's
  // still invisible then (opacity 0), so there's no visible overlap. Only
  // once the exit has fully finished (first half of outroT) does the SVG's
  // own opacity leave 0, in the second half — it's already in position
  // (or close to it) by the time it's actually visible.
  const outroT = clamp01((progress - TIMELINE_SCALE) / (1 - TIMELINE_SCALE));
  const EXIT_FRACTION = 0.3; // was 0.5 — exit now finishes sooner (30% into
  // the outro instead of 50%), so the SVG's opacity gate opens earlier too
  const exitT = clamp01(outroT / EXIT_FRACTION);
  const EXIT_LIFT = 400; // px the outgoing content rises before it's fully
  // faded out (was 200 — needed more travel before it disappears)
  const revealLocalT = clamp01((outroT - EXIT_FRACTION) / (1 - EXIT_FRACTION));
  const REVEAL_Y_START = 600; // illustration's own y position: travels from
  const REVEAL_Y_END = 80; // 600 (below the canvas) up to 80 (near the top)
  const revealY = lerp(REVEAL_Y_START, REVEAL_Y_END, outroT); // moves across
  // the whole outro (starting at progress 0.95), not just the second half
  const revealT = revealLocalT;

  // row 3's button label only shows up once the shape is mostly a rectangle
  const buttonTextT = clamp01((morphT - 0.6) / 0.4);

  // row 2's box backgrounds fade away on the same schedule, revealing the
  // colour-matched label underneath
  const row2BgAlpha = 1 - clamp01((morphT - 0.6) / 0.4);

  // everything not claimed by a row fades away early in that sequence
  const fade = 1 - clamp01((progress - 0.5 * TIMELINE_SCALE) / (0.15 * TIMELINE_SCALE));

  const rowStageByColor: Record<string, number> = {
    '#121212': stageRow1,
    '#1A1E23': stageRow1,
    '#333A42': stageRow1,
    '#9CA6B2': stageRow2,
    '#D4D8DE': stageRow2,
    '#FFFFFF': stageRow2,
    '#0284C7': stageRow3,
    '#0F766E': stageRow3,
    '#545F6D': stageRow3,
    '#0C4A6E': stageRow4,
    [purpleColor]: stageRow5,
    '#21C45D': stageRow5,
    '#F83959': stageRow5,
  };

  return (
    <div className="bg-[#15181D]">
      {/* live scroll-progress readout, fixed to the viewport, for lining
          up which stage of the timeline we're talking about while polishing */}
      <div className="fixed top-4 left-4 z-50 font-mono text-xs text-white/70 bg-black/50 px-2 py-1 rounded pointer-events-none">
        {progress.toFixed(3)}
      </div>
      <div ref={ref} className="grid grid-cols-2">
        <div className="sticky top-0 h-screen flex items-center justify-center">
          <div className="relative w-[460px] max-w-full h-[560px]">
            <div
              style={{
                position: 'relative',
                zIndex: 10,
                transform: `translateY(${-exitT * EXIT_LIFT}px)`,
                opacity: 1 - exitT,
              }}
            >
            <svg
              width="200"
              height="200"
              viewBox="0 0 800 800"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute"
              style={{
                left: 300,
                top: 120,
                transform: 'translate(-50%, -50%)',
                opacity: svgOpacity,
              }}
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M400 328.324C503.031 328.324 598.079 293.99 674.419 236.093C642.402 188.496 620.327 166.226 573.854 134.104C524.041 167.314 464.27 186.66 400 186.66C336.096 186.66 276.641 167.534 226.998 134.67C185.572 159.994 163.108 181.521 125.246 235.838C201.643 293.889 296.818 328.324 400 328.324Z"
                fill="white"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M380.64 724.845C381.141 716.05 381.395 707.188 381.395 698.266C381.395 509.557 267.714 347.516 105.382 277.457C81.6975 327.456 74.6215 358.504 76.7442 420.9C169.822 472.179 234.282 569.344 239.942 682.081C291.767 711.842 322.275 722.154 380.64 724.845Z"
                fill="white"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M418.605 698.266C418.605 706.8 418.834 715.28 419.286 723.7C484.355 719.022 515.916 711.262 557.893 682.081C563.555 567.558 628.966 469.104 722.97 418.497C722.578 359.895 717.416 328.445 693.023 276.314C531.775 345.743 418.605 508.524 418.605 698.266Z"
                fill="white"
              />
              <path
                d="M800 400C800 620.914 620.914 800 400 800C179.086 800 0 620.914 0 400C0 179.086 179.086 0 400 0C620.914 0 800 179.086 800 400ZM38 400C38 599.927 200.073 762 400 762C599.927 762 762 599.927 762 400C762 200.073 599.927 38 400 38C200.073 38 38 200.073 38 400Z"
                fill="#209FF9"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M38 400C38 599.927 200.073 762 400 762C599.927 762 762 599.927 762 400C762 200.073 599.927 38 400 38C200.073 38 38 200.073 38 400ZM573.854 134.104C524.041 167.314 464.27 186.66 400 186.66C336.096 186.66 276.641 167.534 226.998 134.67C185.572 159.994 163.108 181.521 125.246 235.838C201.643 293.889 296.818 328.324 400 328.324C503.031 328.324 598.079 293.99 674.419 236.093C642.402 188.496 620.327 166.226 573.854 134.104ZM381.395 698.266C381.395 509.557 267.714 347.516 105.382 277.457C81.6975 327.456 74.6215 358.504 76.7442 420.9C169.822 472.179 234.282 569.344 239.942 682.081C291.767 711.842 322.275 722.154 380.64 724.845C381.141 716.05 381.395 707.188 381.395 698.266ZM418.605 698.266C418.605 706.8 418.834 715.28 419.286 723.7C484.355 719.022 515.916 711.262 557.893 682.081C563.555 567.558 628.966 469.104 722.97 418.497C722.578 359.895 717.416 328.445 693.023 276.314C531.775 345.743 418.605 508.524 418.605 698.266Z"
                fill="#121212"
              />
            </svg>

            {circleColors.map((color, i) => {
              const start = startPositions[i];
              const end = endPositions[i];
              const { opacity, scale } = circleAppear(progress, appearEnd);
              let x = lerp(start.x, end.x, moveT);
              let y = lerp(start.y, end.y, moveT);

              // the white circle keeps sliding right once the grid settles
              if (i === 1) {
                x += (WHITE_END_X - WHITE_START_X) * spawnT;
              }

              // blue takes one step right once the grid has settled
              if (i === 2) {
                x += (BLUE_MOVED_X - BLUE_START_X) * blueMoveT;
              }

              const rowStage = rowStageByColor[color];
              const isRow3Button = ROW3_BUTTON_COLORS.includes(color);
              const isRow2Text = ROW2_TEXT_COLORS.includes(color);
              const isRow1Color = rowTargetY[color] === ROW1_Y;
              let width = 24;
              let height = 24;
              let radius = 9999;
              let topStyle = y;
              let zIndexStyle: number | undefined;
              let duplicate: ReturnType<typeof duplicateRow1> | null = null;
              if (rowStage !== undefined) {
                x = lerp(x, rowTargetX[color], rowStage);
                y = lerp(y, rowTargetY[color], rowStage);
                const morphed = isRow2Text
                  ? morphRow2(x, slotIndexFromX(rowTargetX[color]), morphT, stackT)
                  : isRow3Button
                    ? morphRow3(x, slotIndexFromX(rowTargetX[color]), morphT, stackT)
                    : morphShape(
                        x,
                        rowTargetY[color],
                        slotIndexFromX(rowTargetX[color]),
                        morphT,
                        isRow1Color ? ROW1_RADIUS : SHAPE_RADIUS,
                      );
                x = morphed.x;
                width = morphed.width;
                height = morphed.height;
                radius = morphed.radius;
                topStyle = isRow2Text
                  ? row2StackTop(y, height, stackT)
                  : isRow3Button
                    ? row3StackTop(y, height, stackT)
                    : y + (height - 24) / 2;
                if (isRow1Color) {
                  const slotIndex = slotIndexFromX(rowTargetX[color]);
                  duplicate = duplicateRow1(x, y, width, height, slotIndex, stackT);
                  const stacked = stackRow1(x, y, width, height, slotIndex, stackT, textDupT2);
                  x = stacked.x;
                  width = stacked.width;
                  height = stacked.height;
                  topStyle = stacked.top;
                  zIndexStyle = stacked.zIndex;
                }
              }

              return (
                <Fragment key={color}>
                  <span
                    className={`absolute${isRow3Button || isRow2Text ? ' flex items-center justify-center overflow-hidden' : ''}`}
                    style={{
                      backgroundColor: isRow2Text
                        ? hexToRgba(color, row2BgAlpha)
                        : color,
                      left: x,
                      top: topStyle,
                      width,
                      height,
                      borderRadius: radius,
                      zIndex: isRow2Text || isRow3Button ? 10 : zIndexStyle,
                      opacity: rowStage !== undefined ? opacity : opacity * fade,
                      transform: `translate(-50%, -50%) scale(${scale})`,
                      boxShadow: isRow3Button
                        ? `0px 2px 1px rgba(0, 0, 0, ${0.25 * morphT})`
                        : isRow2Text
                          ? `inset 0 0 0 1px rgba(255, 255, 255, ${0.1 * row2BgAlpha})`
                          : GREYSCALE_STROKE_COLORS.includes(color)
                            ? `0 0 0 1px rgba(255, 255, 255, ${0.1 * (1 - morphT)}), inset 0 1px 1px rgba(255, 255, 255, ${0.08 * morphT})`
                            : undefined,
                    }}
                  >
                    {isRow3Button && (
                      <ButtonLabel opacity={buttonTextT} text="Primary" />
                    )}
                    {isRow2Text && (
                      <ColorLabel
                        text={ROW2_LABELS[slotIndexFromX(rowTargetX[color])]}
                        color={color}
                      />
                    )}
                  </span>
                  {isRow2Text && (
                    <span
                      className="absolute flex items-center justify-center overflow-hidden"
                      style={{
                        backgroundColor: hexToRgba(color, row2BgAlpha),
                        left: x,
                        top: topStyle + STACK_GAP_Y * textDupT,
                        width,
                        height,
                        borderRadius: radius,
                        zIndex: 10,
                        opacity: rowStage !== undefined ? opacity : opacity * fade,
                        transform: `translate(-50%, -50%) scale(${scale})`,
                        boxShadow: `inset 0 0 0 1px rgba(255, 255, 255, ${0.1 * row2BgAlpha})`,
                      }}
                    >
                      <ColorLabel
                        text={ROW2_LABELS[slotIndexFromX(rowTargetX[color])]}
                        color={color}
                      />
                    </span>
                  )}
                  {ROW2_LAST_DUP_COLORS.includes(color) && (
                    <span
                      className="absolute flex items-center justify-center overflow-hidden"
                      style={{
                        backgroundColor: hexToRgba(color, row2BgAlpha),
                        left: x,
                        top: topStyle + STACK_GAP_Y * (textDupT + textDupT2),
                        width,
                        height,
                        borderRadius: radius,
                        zIndex: 10,
                        opacity: rowStage !== undefined ? opacity : opacity * fade,
                        transform: `translate(-50%, -50%) scale(${scale})`,
                        boxShadow: `inset 0 0 0 1px rgba(255, 255, 255, ${0.1 * row2BgAlpha})`,
                      }}
                    >
                      <ColorLabel
                        text={ROW2_LABELS[slotIndexFromX(rowTargetX[color])]}
                        color={color}
                      />
                    </span>
                  )}
                  {isRow3Button && (
                    <span
                      className="absolute flex items-center justify-center overflow-hidden"
                      style={{
                        backgroundColor: color,
                        left: x,
                        top: topStyle + DUPLICATE_GAP_Y * textDupT,
                        width,
                        height,
                        borderRadius: radius,
                        zIndex: 10,
                        opacity: rowStage !== undefined ? opacity : opacity * fade,
                        transform: `translate(-50%, -50%) scale(${scale})`,
                        boxShadow: `0px 2px 1px rgba(0, 0, 0, ${0.25 * morphT})`,
                      }}
                    >
                      <ButtonLabel opacity={buttonTextT} text="Primary" />
                    </span>
                  )}
                  {isRow3Button && (
                    <span
                      className="absolute flex items-center justify-center overflow-hidden"
                      style={{
                        backgroundColor: color,
                        left: x,
                        top: topStyle + DUPLICATE_GAP_Y * (textDupT + textDupT2),
                        width,
                        height,
                        borderRadius: radius,
                        zIndex: 10,
                        opacity: rowStage !== undefined ? opacity : opacity * fade,
                        transform: `translate(-50%, -50%) scale(${scale})`,
                        boxShadow: `0px 2px 1px rgba(0, 0, 0, ${0.25 * morphT})`,
                      }}
                    >
                      <ButtonLabel opacity={buttonTextT} text="Primary" />
                    </span>
                  )}
                  {duplicate && (
                    <span
                      className="absolute"
                      style={{
                        backgroundColor: color,
                        left: duplicate.x,
                        top: duplicate.top,
                        width: duplicate.width,
                        height: duplicate.height,
                        borderRadius: radius,
                        zIndex: duplicate.zIndex,
                        opacity,
                        transform: `translate(-50%, -50%) scale(${scale})`,
                        boxShadow: GREYSCALE_STROKE_COLORS.includes(color)
                          ? `0 0 0 1px rgba(255, 255, 255, ${0.1 * (1 - morphT)}), inset 0 1px 1px rgba(255, 255, 255, ${0.08 * morphT})`
                          : undefined,
                      }}
                    />
                  )}
                </Fragment>
              );
            })}

            {grayscaleRow.slice(1, -1).map((color, gIndex) => {
              const i = gIndex + 1;
              let x = rowX(i);
              let y = ROW_Y;
              const spawnThreshold = clamp01(
                (x - WHITE_START_X) / (WHITE_END_X - WHITE_START_X),
              );
              const local = clamp01((spawnT - spawnThreshold) / 0.05);

              const rowStage = rowStageByColor[color];
              const isRow3Button = ROW3_BUTTON_COLORS.includes(color);
              const isRow2Text = ROW2_TEXT_COLORS.includes(color);
              const isRow1Color = rowTargetY[color] === ROW1_Y;
              let width = 24;
              let height = 24;
              let radius = 9999;
              let topStyle = y;
              let zIndexStyle: number | undefined;
              let duplicate: ReturnType<typeof duplicateRow1> | null = null;
              if (rowStage !== undefined) {
                x = lerp(x, rowTargetX[color], rowStage);
                y = lerp(y, rowTargetY[color], rowStage);
                const morphed = isRow2Text
                  ? morphRow2(x, slotIndexFromX(rowTargetX[color]), morphT, stackT)
                  : isRow3Button
                    ? morphRow3(x, slotIndexFromX(rowTargetX[color]), morphT, stackT)
                    : morphShape(
                        x,
                        rowTargetY[color],
                        slotIndexFromX(rowTargetX[color]),
                        morphT,
                        isRow1Color ? ROW1_RADIUS : SHAPE_RADIUS,
                      );
                x = morphed.x;
                width = morphed.width;
                height = morphed.height;
                radius = morphed.radius;
                topStyle = isRow2Text
                  ? row2StackTop(y, height, stackT)
                  : isRow3Button
                    ? row3StackTop(y, height, stackT)
                    : y + (height - 24) / 2;
                if (isRow1Color) {
                  const slotIndex = slotIndexFromX(rowTargetX[color]);
                  duplicate = duplicateRow1(x, y, width, height, slotIndex, stackT);
                  const stacked = stackRow1(x, y, width, height, slotIndex, stackT, textDupT2);
                  x = stacked.x;
                  width = stacked.width;
                  height = stacked.height;
                  topStyle = stacked.top;
                  zIndexStyle = stacked.zIndex;
                }
              }

              return (
                <Fragment key={i}>
                  <span
                    className={`absolute${isRow3Button || isRow2Text ? ' flex items-center justify-center overflow-hidden' : ''}`}
                    style={{
                      backgroundColor: isRow2Text
                        ? hexToRgba(color, row2BgAlpha)
                        : color,
                      left: x,
                      top: topStyle,
                      width,
                      height,
                      borderRadius: radius,
                      zIndex: isRow2Text || isRow3Button ? 10 : zIndexStyle,
                      opacity: rowStage !== undefined ? local : local * fade,
                      transform: `translate(-50%, -50%) scale(${0.2 + local * 0.8})`,
                      boxShadow: isRow3Button
                        ? `0px 2px 1px rgba(0, 0, 0, ${0.25 * morphT})`
                        : isRow2Text
                          ? `inset 0 0 0 1px rgba(255, 255, 255, ${0.1 * row2BgAlpha})`
                          : GREYSCALE_STROKE_COLORS.includes(color)
                            ? `0 0 0 1px rgba(255, 255, 255, ${0.1 * (1 - morphT)}), inset 0 1px 1px rgba(255, 255, 255, ${0.08 * morphT})`
                            : undefined,
                    }}
                  >
                    {isRow3Button && (
                      <ButtonLabel
                        opacity={buttonTextT}
                        text="Tertiary"
                        color="#D4D8DE"
                      />
                    )}
                    {isRow2Text && (
                      <ColorLabel
                        text={ROW2_LABELS[slotIndexFromX(rowTargetX[color])]}
                        color={color}
                      />
                    )}
                  </span>
                  {isRow2Text && (
                    <span
                      className="absolute flex items-center justify-center overflow-hidden"
                      style={{
                        backgroundColor: hexToRgba(color, row2BgAlpha),
                        left: x,
                        top: topStyle + STACK_GAP_Y * textDupT,
                        width,
                        height,
                        borderRadius: radius,
                        zIndex: 10,
                        opacity: rowStage !== undefined ? local : local * fade,
                        transform: `translate(-50%, -50%) scale(${0.2 + local * 0.8})`,
                        boxShadow: `inset 0 0 0 1px rgba(255, 255, 255, ${0.1 * row2BgAlpha})`,
                      }}
                    >
                      <ColorLabel
                        text={ROW2_LABELS[slotIndexFromX(rowTargetX[color])]}
                        color={color}
                      />
                    </span>
                  )}
                  {ROW2_LAST_DUP_COLORS.includes(color) && (
                    <span
                      className="absolute flex items-center justify-center overflow-hidden"
                      style={{
                        backgroundColor: hexToRgba(color, row2BgAlpha),
                        left: x,
                        top: topStyle + STACK_GAP_Y * (textDupT + textDupT2),
                        width,
                        height,
                        borderRadius: radius,
                        zIndex: 10,
                        opacity: rowStage !== undefined ? local : local * fade,
                        transform: `translate(-50%, -50%) scale(${0.2 + local * 0.8})`,
                        boxShadow: `inset 0 0 0 1px rgba(255, 255, 255, ${0.1 * row2BgAlpha})`,
                      }}
                    >
                      <ColorLabel
                        text={ROW2_LABELS[slotIndexFromX(rowTargetX[color])]}
                        color={color}
                      />
                    </span>
                  )}
                  {isRow3Button && (
                    <span
                      className="absolute flex items-center justify-center overflow-hidden"
                      style={{
                        backgroundColor: color,
                        left: x,
                        top: topStyle + DUPLICATE_GAP_Y * textDupT,
                        width,
                        height,
                        borderRadius: radius,
                        zIndex: 10,
                        opacity: rowStage !== undefined ? local : local * fade,
                        transform: `translate(-50%, -50%) scale(${0.2 + local * 0.8})`,
                        boxShadow: `0px 2px 1px rgba(0, 0, 0, ${0.25 * morphT})`,
                      }}
                    >
                      <ButtonLabel
                        opacity={buttonTextT}
                        text="Tertiary"
                        color="#D4D8DE"
                      />
                    </span>
                  )}
                  {isRow3Button && (
                    <span
                      className="absolute flex items-center justify-center overflow-hidden"
                      style={{
                        backgroundColor: color,
                        left: x,
                        top: topStyle + DUPLICATE_GAP_Y * (textDupT + textDupT2),
                        width,
                        height,
                        borderRadius: radius,
                        zIndex: 10,
                        opacity: rowStage !== undefined ? local : local * fade,
                        transform: `translate(-50%, -50%) scale(${0.2 + local * 0.8})`,
                        boxShadow: `0px 2px 1px rgba(0, 0, 0, ${0.25 * morphT})`,
                      }}
                    >
                      <ButtonLabel
                        opacity={buttonTextT}
                        text="Tertiary"
                        color="#D4D8DE"
                      />
                    </span>
                  )}
                  {duplicate && (
                    <span
                      className="absolute"
                      style={{
                        backgroundColor: color,
                        left: duplicate.x,
                        top: duplicate.top,
                        width: duplicate.width,
                        height: duplicate.height,
                        borderRadius: radius,
                        zIndex: duplicate.zIndex,
                        opacity: local,
                        transform: `translate(-50%, -50%) scale(${0.2 + local * 0.8})`,
                        boxShadow: GREYSCALE_STROKE_COLORS.includes(color)
                          ? `0 0 0 1px rgba(255, 255, 255, ${0.1 * (1 - morphT)}), inset 0 1px 1px rgba(255, 255, 255, ${0.08 * morphT})`
                          : undefined,
                      }}
                    />
                  )}
                </Fragment>
              );
            })}

            {(() => {
              const baseX = lerp(BLUE_START_X, rowTargetX[blueRow[0]], stageRow4);
              const baseY = lerp(BLUE_Y, rowTargetY[blueRow[0]], stageRow4);
              const morphed = morphShape(
                baseX,
                rowTargetY[blueRow[0]],
                slotIndexFromX(rowTargetX[blueRow[0]]),
                morphT,
                BUTTON_RADIUS,
              );
              return (
                <span
                  className="absolute flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundColor: blueRow[0],
                    left: morphed.x,
                    top: baseY + (morphed.height - 24) / 2,
                    width: morphed.width,
                    height: morphed.height,
                    borderRadius: morphed.radius,
                    opacity: blueLeftLocal * (1 - stackT),
                    transform: `translate(-50%, -50%) scale(${0.2 + blueLeftLocal * 0.8})`,
                    border: `1px solid ${hexToRgba(CHIP_STROKE_COLOR, morphT)}`,
                    boxShadow: `0px 2px 1px rgba(0, 0, 0, ${0.25 * morphT})`,
                  }}
                >
                  <ChipLabel opacity={buttonTextT} />
                </span>
              );
            })()}
            <span
              className="absolute w-6 h-6 rounded-full"
              style={{
                backgroundColor: blueRow[2],
                left: rowX(2),
                top: BLUE_Y,
                opacity: blueRight1Local * fade,
                transform: `translate(-50%, -50%) scale(${0.2 + blueRight1Local * 0.8})`,
              }}
            />
            <span
              className="absolute w-6 h-6 rounded-full"
              style={{
                backgroundColor: blueRow[3],
                left: rowX(3),
                top: BLUE_Y,
                opacity: blueRight2Local * fade,
                transform: `translate(-50%, -50%) scale(${0.2 + blueRight2Local * 0.8})`,
              }}
            />

            {tealRow.map((color, i) => {
              const local = [teal0Local, teal1Local, teal2Local][i];
              const rowStage = rowStageByColor[color];
              let x = rowX(i);
              let y = TEAL_Y;
              const isRow3Button = ROW3_BUTTON_COLORS.includes(color);
              let width = 24;
              let height = 24;
              let radius = 9999;
              let topStyle = y;
              if (rowStage !== undefined) {
                x = lerp(x, rowTargetX[color], rowStage);
                y = lerp(y, rowTargetY[color], rowStage);
                const morphed = isRow3Button
                  ? morphRow3(x, slotIndexFromX(rowTargetX[color]), morphT, stackT)
                  : morphShape(
                      x,
                      rowTargetY[color],
                      slotIndexFromX(rowTargetX[color]),
                      morphT,
                    );
                x = morphed.x;
                width = morphed.width;
                height = morphed.height;
                radius = morphed.radius;
                topStyle = isRow3Button
                  ? row3StackTop(y, height, stackT)
                  : y + (height - 24) / 2;
              }

              return (
                <Fragment key={color}>
                  <span
                    className={`absolute${isRow3Button ? ' flex items-center justify-center overflow-hidden' : ''}`}
                    style={{
                      backgroundColor: color,
                      left: x,
                      top: topStyle,
                      width,
                      height,
                      borderRadius: radius,
                      opacity: rowStage !== undefined ? local : local * fade,
                      transform: `translate(-50%, -50%) scale(${0.2 + local * 0.8})`,
                      boxShadow: isRow3Button
                        ? `0px 2px 1px rgba(0, 0, 0, ${0.25 * morphT})`
                        : undefined,
                      zIndex: isRow3Button ? 10 : undefined,
                    }}
                  >
                    {isRow3Button && (
                      <ButtonLabel opacity={buttonTextT} text="Secondary" />
                    )}
                  </span>
                  {isRow3Button && (
                    <span
                      className="absolute flex items-center justify-center overflow-hidden"
                      style={{
                        backgroundColor: color,
                        left: x,
                        top: topStyle + DUPLICATE_GAP_Y * textDupT,
                        width,
                        height,
                        borderRadius: radius,
                        zIndex: 10,
                        opacity: rowStage !== undefined ? local : local * fade,
                        transform: `translate(-50%, -50%) scale(${0.2 + local * 0.8})`,
                        boxShadow: `0px 2px 1px rgba(0, 0, 0, ${0.25 * morphT})`,
                      }}
                    >
                      <ButtonLabel opacity={buttonTextT} text="Secondary" />
                    </span>
                  )}
                  {isRow3Button && (
                    <span
                      className="absolute flex items-center justify-center overflow-hidden"
                      style={{
                        backgroundColor: color,
                        left: x,
                        top: topStyle + DUPLICATE_GAP_Y * (textDupT + textDupT2),
                        width,
                        height,
                        borderRadius: radius,
                        zIndex: 10,
                        opacity: rowStage !== undefined ? local : local * fade,
                        transform: `translate(-50%, -50%) scale(${0.2 + local * 0.8})`,
                        boxShadow: `0px 2px 1px rgba(0, 0, 0, ${0.25 * morphT})`,
                      }}
                    >
                      <ButtonLabel opacity={buttonTextT} text="Secondary" />
                    </span>
                  )}
                </Fragment>
              );
            })}

            {(() => {
              const baseX = lerp(rowX(0), rowTargetX[purpleColor], stageRow5);
              const baseY = lerp(PURPLE_Y, rowTargetY[purpleColor], stageRow5);
              const morphed = morphRow5(
                baseX,
                slotIndexFromX(rowTargetX[purpleColor]),
                rowShapeByY[ROW5_Y].height,
                BUTTON_RADIUS,
                morphT,
              );
              return (
                <span
                  className="absolute flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundColor: purpleColor,
                    left: morphed.x,
                    top: baseY + (morphed.height - 24) / 2,
                    width: morphed.width,
                    height: morphed.height,
                    borderRadius: morphed.radius,
                    opacity: purpleLocal * (1 - stackT),
                    transform: `translate(-50%, -50%) scale(${0.2 + purpleLocal * 0.8})`,
                  }}
                >
                  <NewLabel opacity={buttonTextT} />
                </span>
              );
            })()}

            <span
              className="absolute text-white/70 text-sm tracking-wide whitespace-nowrap"
              style={{
                left: LABEL_X,
                top: NEUTRALS_LABEL_Y,
                opacity: neutralsLabelLocal * fade,
                transform: 'translateY(-50%)',
              }}
            >
              Neutrals
            </span>

            <span
              className="absolute text-white/70 text-sm tracking-wide whitespace-nowrap"
              style={{
                left: LABEL_X,
                top: BRAND_LABEL_Y,
                opacity: brandLabelLocal * fade,
                transform: 'translateY(-50%)',
              }}
            >
              Brand
            </span>

            <span
              className="absolute text-white/70 text-sm tracking-wide whitespace-nowrap"
              style={{
                left: LABEL_X,
                top: ANALOGOUS_LABEL_Y,
                opacity: analogousLabelLocal * fade,
                transform: 'translateY(-50%)',
              }}
            >
              Analogous
            </span>

            {(() => {
              const baseX = lerp(rowX(0), rowTargetX[greenColor], stageRow5);
              const baseY = lerp(GREEN_Y, rowTargetY[greenColor], stageRow5);
              const morphed = morphRow5(
                baseX,
                slotIndexFromX(rowTargetX[greenColor]),
                20,
                20,
                morphT,
              );
              return (
                <span
                  className="absolute flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundColor: greenColor,
                    left: morphed.x,
                    top: baseY + (morphed.height - 24) / 2,
                    width: morphed.width,
                    height: morphed.height,
                    borderRadius: morphed.radius,
                    opacity: greenLocal * (1 - stackT),
                    transform: `translate(-50%, -50%) scale(${0.2 + greenLocal * 0.8})`,
                  }}
                >
                  <CheckIcon opacity={buttonTextT} />
                </span>
              );
            })()}
            {(() => {
              const baseX = lerp(rowX(0), rowTargetX[redColor], stageRow5);
              const baseY = lerp(RED_Y, rowTargetY[redColor], stageRow5);
              const morphed = morphRow5(
                baseX,
                slotIndexFromX(rowTargetX[redColor]),
                20,
                20,
                morphT,
              );
              return (
                <span
                  className="absolute flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundColor: redColor,
                    left: morphed.x,
                    top: baseY + (morphed.height - 24) / 2,
                    width: morphed.width,
                    height: morphed.height,
                    borderRadius: morphed.radius,
                    opacity: redLocal * (1 - stackT),
                    transform: `translate(-50%, -50%) scale(${0.2 + redLocal * 0.8})`,
                  }}
                >
                  <DashIcon opacity={buttonTextT} />
                </span>
              );
            })()}

            {/* row 3: a second #333A42 sits exactly on top of the original
                (same spawn position, same appear timing) so the two are
                indistinguishable until the rows start forming — then this
                copy peels off toward row 3 while the original heads to
                row 1 */}
            {(() => {
              const dupSpawnX = rowX(3);
              const spawnThreshold = clamp01(
                (dupSpawnX - WHITE_START_X) / (WHITE_END_X - WHITE_START_X),
              );
              const local = clamp01((spawnT - spawnThreshold) / 0.05);
              const baseX = lerp(dupSpawnX, NEW_ROW3_X2, stageRow3);
              const baseY = lerp(ROW_Y, ROW3_Y, stageRow3);
              const morphed = morphRow3(baseX, 3, morphT, stackT);
              const disabledTop = row3StackTop(baseY, morphed.height, stackT);
              return (
                <Fragment>
                  <span
                    className="absolute flex items-center justify-center overflow-hidden"
                    style={{
                      backgroundColor: '#333A42',
                      left: morphed.x,
                      top: disabledTop,
                      width: morphed.width,
                      height: morphed.height,
                      borderRadius: morphed.radius,
                      opacity: local,
                      transform: `translate(-50%, -50%) scale(${0.2 + local * 0.8})`,
                      zIndex: 10,
                    }}
                  >
                    <ButtonLabel
                      opacity={buttonTextT}
                      text="Disabled"
                      color="#545F6D"
                    />
                  </span>
                  <span
                    className="absolute flex items-center justify-center overflow-hidden"
                    style={{
                      backgroundColor: '#333A42',
                      left: morphed.x,
                      top: disabledTop + DUPLICATE_GAP_Y * textDupT,
                      width: morphed.width,
                      height: morphed.height,
                      borderRadius: morphed.radius,
                      opacity: local,
                      transform: `translate(-50%, -50%) scale(${0.2 + local * 0.8})`,
                      zIndex: 10,
                    }}
                  >
                    <ButtonLabel
                      opacity={buttonTextT}
                      text="Disabled"
                      color="#545F6D"
                    />
                  </span>
                  <span
                    className="absolute flex items-center justify-center overflow-hidden"
                    style={{
                      backgroundColor: '#333A42',
                      left: morphed.x,
                      top: disabledTop + DUPLICATE_GAP_Y * (textDupT + textDupT2),
                      width: morphed.width,
                      height: morphed.height,
                      borderRadius: morphed.radius,
                      opacity: local,
                      transform: `translate(-50%, -50%) scale(${0.2 + local * 0.8})`,
                      border: `1px solid ${hexToRgba('#545F6D', local * textDupT2)}`,
                      zIndex: 10,
                    }}
                  >
                    <ButtonLabel
                      opacity={buttonTextT}
                      text="Disabled"
                      color="#545F6D"
                    />
                  </span>
                </Fragment>
              );
            })()}

            <span
              className="absolute text-white/70 text-sm tracking-wide whitespace-nowrap"
              style={{
                left: LABEL_X,
                top: SIGNAL_LABEL_Y,
                opacity: signalLabelLocal * fade,
                transform: 'translateY(-50%)',
              }}
            >
              Signal
            </span>

            {rowLabels.map((text, i) => {
              const rowLabelY = [
                ROW1_LABEL_Y,
                ROW2_LABEL_Y,
                ROW3_LABEL_Y,
                ROW4_LABEL_Y,
                ROW5_LABEL_Y,
              ][i];
              const rowStage = [
                stageRow1,
                stageRow2,
                stageRow3,
                stageRow4,
                stageRow5,
              ][i];
              return (
                <span
                  key={text}
                  className="absolute text-white/70 text-sm tracking-wide whitespace-nowrap"
                  style={{
                    left: LABEL_X,
                    top: rowLabelY,
                    opacity: rowStage * (1 - stackT),
                    transform: 'translateY(-50%)',
                  }}
                >
                  {text}
                </span>
              );
            })}

            {/* three words spawn in underneath the stacked groups, one at a
                time, then a green checkmark spawns to the right of each one
                (one at a time) as its text turns to match */}
            {['Contrast', 'Color blindness', 'SEO'].map((word, i) => {
              const local = [word1Local, word2Local, word3Local][i];
              const checkLocal = [check1Local, check2Local, check3Local][i];
              const wordTop = 470 + i * 36;
              const wordWidth = estimateTextWidth(word, 24);
              return (
                <Fragment key={word}>
                  <span
                    className="absolute font-medium whitespace-nowrap"
                    style={{
                      left: LABEL_X,
                      top: wordTop,
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 24,
                      color: lerpColor('#FFFFFF', CHECK_GREEN, checkLocal),
                      opacity: local,
                      transform: `translateY(-50%) translateY(${(1 - local) * 12}px)`,
                    }}
                  >
                    {word}
                  </span>
                  <span
                    className="absolute"
                    style={{
                      left: LABEL_X + wordWidth + 16 + WARNING_ICON_SIZE / 2,
                      top: wordTop,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <SuccessIcon opacity={checkLocal} />
                  </span>
                </Fragment>
              );
            })}

            </div>

            {/* new illustration, revealed underneath as everything above
                scrolls up and vanishes — positioned by explicit top (not
                flex alignment) so its travel is a direct, readable
                REVEAL_Y_START -> REVEAL_Y_END lerp on revealY above, and
                only starts fading in via revealT once the outgoing text
                has mostly faded away. */}
            <div
              className="absolute pointer-events-none"
              style={{
                zIndex: 5,
                opacity: revealT,
                left: '50%',
                top: revealY,
                transform: 'translateX(-50%)',
              }}
            >
              <svg
                width="450"
                height="309"
                viewBox="0 0 450 309"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  // box-shadow follows the SVG's rectangular bounding box,
                  // so it was showing up in the transparent corners around
                  // the drawn (rounded-corner) shape. drop-shadow instead
                  // follows the actual painted alpha, so it hugs the shape
                  // itself. (no inset equivalent for filter, so that part
                  // is dropped — it wasn't visible at 0.05 opacity anyway.)
                  filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.3))',
                }}
              >
                <path fillRule="evenodd" clipRule="evenodd" d="M450 103.5H0V126H450V103.5Z" fill="#282D34"/>
                <path d="M161 153C161 151.343 162.343 150 164 150H286C287.657 150 289 151.343 289 153V191.625V230.25C289 231.907 287.657 233.25 286 233.25H164C162.343 233.25 161 231.907 161 230.25V153Z" fill="#282D34"/>
                <path d="M292 153C292 151.343 293.343 150 295 150H417C418.657 150 420 151.343 420 153V230.25C420 231.907 418.657 233.25 417 233.25H295C293.343 233.25 292 231.907 292 230.25V153Z" fill="#282D34"/>
                <path d="M286 236.25H164C162.343 236.25 161 237.593 161 239.25V308.25H289V239.25C289 237.593 287.657 236.25 286 236.25Z" fill="#282D34"/>
                <path d="M417 236.25H295C293.343 236.25 292 237.593 292 239.25V308.25H420V239.25C420 237.593 418.657 236.25 417 236.25Z" fill="#282D34"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M0 18H450V12C450 5.37258 444.627 0 438 0H12C5.37257 0 0 5.37258 0 12V18Z" fill="#121212"/>
                <path d="M155 236.25H33C31.3431 236.25 30 237.593 30 239.25V308.25H158V239.25C158 237.593 156.657 236.25 155 236.25Z" fill="#282D34"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M420 308.25H436.5C443.956 308.25 450 302.206 450 294.75V126H0V294.75C0 302.206 6.04416 308.25 13.5 308.25H30V239.25C30 237.593 31.3431 236.25 33 236.25H155C156.657 236.25 158 237.593 158 239.25V308.25H161V239.25C161 237.593 162.343 236.25 164 236.25H286C287.657 236.25 289 237.593 289 239.25V308.25H292V239.25C292 237.593 293.343 236.25 295 236.25H417C418.657 236.25 420 237.593 420 239.25V308.25ZM286 150H164C162.343 150 161 151.343 161 153V230.25C161 231.907 162.343 233.25 164 233.25H286C287.657 233.25 289 231.907 289 230.25V191.625V153C289 151.343 287.657 150 286 150ZM417 150H295C293.343 150 292 151.343 292 153V230.25C292 231.907 293.343 233.25 295 233.25H417C418.657 233.25 420 231.907 420 230.25V153C420 151.343 418.657 150 417 150ZM155 150H33C31.3431 150 30 151.343 30 153V230.25C30 231.907 31.3431 233.25 33 233.25H155C156.657 233.25 158 231.907 158 230.25V153C158 151.343 156.657 150 155 150ZM417 135H33C31.3431 135 30 136.343 30 138V144C30 145.657 31.3431 147 33 147H417C418.657 147 420 145.657 420 144V138C420 136.343 418.657 135 417 135Z" fill="#1A1E23"/>
                <path d="M450 18H0V103.5H450V18Z" fill="#1A1E23"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M33 135H417C418.657 135 420 136.343 420 138V144C420 145.657 418.657 147 417 147H33C31.3431 147 30 145.657 30 144V138C30 136.343 31.3431 135 33 135Z" fill="#282D34"/>
                <path d="M33 150H155C156.657 150 158 151.343 158 153V230.25C158 231.907 156.657 233.25 155 233.25H33C31.3431 233.25 30 231.907 30 230.25V153C30 151.343 31.3431 150 33 150Z" fill="#282D34"/>
                {/* inner shadow: same reason as the outer drop-shadow above
                    — a CSS inset box-shadow follows the rectangular DOM box,
                    not the drawn rounded-corner shape, so it'd bleed into
                    the transparent corners again. Drawing it as real SVG
                    geometry (a rounded rect just inside the shape's own
                    boundary, softened with a small blur) keeps it clipped
                    to the actual artwork. */}
                <defs>
                  <filter id="illustration-inner-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="0.5" />
                  </filter>
                </defs>
                <rect
                  x={1}
                  y={1}
                  width={448}
                  height={307}
                  rx={11}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeOpacity={0.15}
                  strokeWidth={1}
                  filter="url(#illustration-inner-glow)"
                />
              </svg>
            </div>

            {/* guiding grid — sits behind the animation (z-0, vs the
                animation's z-10/z-5) so it's a reference, not an obstruction,
                and lives outside the outro-transform wrapper so it stays put
                (doesn't scroll up or fade with the rest at the end) */}
            {SHOW_DEBUG_GRID && <DebugGrid width={460} height={560} />}
          </div>
        </div>

        <div className="flex flex-col gap-[40vh] py-[40vh] px-12 text-white/70 text-lg max-w-md">
          {paragraphs.map((text) => (
            <p key={text}>{text}</p>
          ))}
          {/* trailing buffer: without this, the sticky canvas unsticks and
              starts scrolling away the instant progress hits 1 (there's no
              container height left to keep it pinned), cutting the outro
              off right as it finishes. This holds progress at 1 for a bit
              so the finished state — grid included — stays on screen. */}
          <div className="h-[60vh]" aria-hidden />
        </div>
      </div>
    </div>
  );
}

export default App;
