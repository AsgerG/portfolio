import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import sbcHomePage from './assets/sbc_home_page.png';
import sbcSetPage from './assets/sbc_set_page.png';
import solutionView from './assets/solution_view.png';
import myClub from './assets/my_club.png';
import players from './assets/players.png';
import detailedPlayerView from './assets/detailed_player_view.png';
import evolutions from './assets/evolutions.png';
import evolutionBuilder from './assets/evolution_builder.png';
import tactics from './assets/tactics.png';
import squadBuilder from './assets/squad_builder.png';
import metaRatingExplainer from './assets/meta_rating_explainer.png';
import squadTactics from './assets/squad_tactics.png';

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

// case-study copy, one block per animation section — see sectionName
// below for how the boundaries line up with the scroll timeline
const sectionCopy = [
  `EasySBC needed a strong brand feel — something technical enough to match the calculations running underneath it. The interface also had to handle dense data tables and colorful EA artwork without turning cluttered, so I built around a dark blue-grey base that let those colors do the talking. It also happens to suit the low-light conditions most players use when grinding FIFA at night. Blue anchors the palette to match the logo, with an analogous scheme built around it — teal and purple — leaving green and red free for their classic job: clear, unambiguous signal colors.`,
  `As a third-party tool, EasySBC lives or dies on recognizability — a player needs to glance at a stat on the site and instantly know which in-game attribute it maps to. EA also reshuffles its own color coding almost every FC edition, so a handful of colors were deliberately built into the palette as known temporary placeholders — flagged from day one as due for revision, rather than treated as permanent parts of the system.`,
  `Every component was checked against the same bar: color contrast, colorblindness, sizing, and SEO compliance. Those checks became a living set of guidelines — exactly where and how each color and element was allowed to be used, so the system stayed consistent as it grew.`,
  `Wireframes were part of the process from day one of the MVP — sketching out structure and flow before any color or polish entered the picture, so the underlying logic held up on its own.`,
  `From there, those wireframes became the real thing. Here's a look at the finished product — from the home dashboard through squad building, evolutions, and match tactics — each screen built on the same consistent system laid out above.`,
];

function App() {
  useLenis();
  const { ref, progress } = useScrollProgress<HTMLDivElement>();

  // real rendered height of each text block, measured directly rather
  // than assumed — since the blocks wrap to different numbers of lines,
  // a fixed slot spacing means the *gap* between blocks (as opposed to
  // the spacing between their centers/tops) isn't actually equal. These
  // heights feed the cumulative stacking math below so the visual gap
  // between one block's bottom and the next one's top is a constant,
  // regardless of how tall either block is.
  const textRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const [textHeights, setTextHeights] = useState<number[]>(() => sectionCopy.map(() => 0));
  useLayoutEffect(() => {
    function measure() {
      setTextHeights(sectionCopy.map((_, i) => textRefs.current[i]?.offsetHeight ?? 0));
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // five equal sections now split the whole scroll — color palette,
  // color semantics, UI components, wireframes, and overview — each
  // exactly SECTION_LEN (1/5) of total progress, and each hands off to
  // the next after an identical SECTION_BREAK-long pause (nothing
  // animating) once its own content settles. Sections 1-3 are the circle
  // animation (0 -> TIMELINE_SCALE); sections 4-5 are the two halves of
  // the outro (TIMELINE_SCALE -> 1) — 4 is the illustration reveal, 5 is
  // the screenshot mosaic. Only section 5, being last, skips the pause
  // (nothing follows it here; the trailing buffer below handles holding
  // the very end of the page instead).
  //
  // sections 1-3 each hold their very last stage's finished state for a
  // brief pause before the next section's first stage begins — a moment
  // for the reader to take in what just happened. SECTION_BREAK is the
  // one shared constant controlling that pause's length, so all four
  // transitions (1->2, 2->3, 3->4, 4->5) are guaranteed identical, not
  // just approximately equal: each section's last stage is defined to
  // end exactly at SEC*_END below, derived directly from SECTION_BREAK,
  // rather than from an independently-rounded width that could drift out
  // of sync.
  const SECTION_LEN = 0.2; // every section is an equal fifth of total scroll
  const SECTION_BREAK = 0.025; // identical pause length before each of the 4 transitions
  const TIMELINE_SCALE = 3 * SECTION_LEN; // 0.6 — sections 1-3 (circle animation) end here, outro (sections 4-5) takes the rest
  const SEC1_END = SECTION_LEN - SECTION_BREAK; // 0.175 — section 1's last stage ends here
  const SEC2_END = 2 * SECTION_LEN - SECTION_BREAK; // 0.375 — section 2's last stage ends here
  const SEC3_END = 3 * SECTION_LEN - SECTION_BREAK; // 0.575 — section 3's last stage ends here
  const SEC4_END = 4 * SECTION_LEN - SECTION_BREAK; // 0.775 — section 4's (wireframes) last stage ends here
  const appearEnd = 0.042 * TIMELINE_SCALE;
  const moveT = clamp01((progress - appearEnd) / (0.024 * TIMELINE_SCALE));
  const spawnT = clamp01((progress - 0.066 * TIMELINE_SCALE) / (0.06 * TIMELINE_SCALE));
  const svgOpacity = 1 - moveT;

  // "Neutrals" fades in once the new shades of grey start appearing,
  // not while black and white are just settling into the grid
  const neutralsLabelLocal = spawnT;

  const stageD = clamp01((progress - 0.126 * TIMELINE_SCALE) / (0.048 * TIMELINE_SCALE));
  const blueMoveT = clamp01(stageD / 0.35);
  const blueLeftLocal = clamp01((stageD - 0.15) / 0.35);
  const blueRight1Local = clamp01((stageD - 0.45) / 0.35);
  const blueRight2Local = clamp01((stageD - 0.65) / 0.35);

  // "Brand" fades in as the blue row spawns
  const brandLabelLocal = clamp01(stageD / 0.6);

  // the teal row and the purple circle unfold together: the row cascades
  // left to right, while purple starts at the same moment as the first dot
  const stageRows = clamp01((progress - 0.174 * TIMELINE_SCALE) / (0.06 * TIMELINE_SCALE));
  const teal0Local = clamp01(stageRows / 0.5);
  const teal1Local = clamp01((stageRows - 0.15) / 0.5);
  const teal2Local = clamp01((stageRows - 0.3) / 0.5);
  const purpleLocal = clamp01(stageRows / 0.5);

  // "Analogous" fades in as the teal row and purple circle spawn
  const analogousLabelLocal = clamp01(stageRows / 0.5);

  // green and red spawn in together — the last stage of section 1. Its
  // downstream effects (greenLocal/redLocal/signalLabelLocal below) only
  // use the first 60% of stageSignal's own 0-1 range (they divide it by
  // 0.6), so pinning stageSignal's own end to SEC1_END isn't enough — the
  // content would actually finish at 60% of the way there, leaving an
  // extra, uneven gap on top of SECTION_BREAK. Dividing the width by 0.6
  // stretches stageSignal so that its 0.6 mark — where the visible
  // content actually settles — lands exactly on SEC1_END instead.
  const stageSignalStart = 0.234 * TIMELINE_SCALE;
  const stageSignal = clamp01(
    (progress - stageSignalStart) / ((SEC1_END - stageSignalStart) / 0.6),
  );
  const greenLocal = clamp01(stageSignal / 0.6);
  const redLocal = clamp01(stageSignal / 0.6);

  // "Signal" fades in as green and red spawn, then holds until SEC1_END
  // + SECTION_BREAK hands off to section 2
  const signalLabelLocal = clamp01(stageSignal / 0.6);

  // all five rows form together, then every claimed circle morphs into
  // its row's rectangular shape
  const stageRowAll = clamp01((progress - 0.3333 * TIMELINE_SCALE) / (0.1715 * TIMELINE_SCALE));
  const stageRow1 = stageRowAll;
  const stageRow2 = stageRowAll;
  const stageRow3 = stageRowAll;
  const stageRow4 = stageRowAll;
  const stageRow5 = stageRowAll;
  // the last stage of section 2 — same SEC2_END-pinning as stageSignal
  // above, so this section's pause is exactly SECTION_BREAK long too
  const morphTStart = 0.5048 * TIMELINE_SCALE;
  const morphT = clamp01((progress - morphTStart) / (SEC2_END - morphTStart));

  // row 1's swatches restack into overlapping cards, row 2's text frames
  // onto the first card, and row 3's buttons frame onto the duplicate stack
  const stackT = clamp01((progress - 0.6667 * TIMELINE_SCALE) / (0.08 * TIMELINE_SCALE));

  // only once that initial move settles does row 2's text duplicate and
  // the copy shift down to sit framed against the stack's second card
  const textDupT = clamp01((progress - 0.7467 * TIMELINE_SCALE) / (0.06 * TIMELINE_SCALE));

  // then, once that second copy settles, it duplicates again and the new
  // copy shifts down another 43px to sit framed against the third card
  const textDupT2 = clamp01((progress - 0.8067 * TIMELINE_SCALE) / (0.06 * TIMELINE_SCALE));

  // then, three words spawn in underneath the stacked groups, one at a time
  const wordsT = clamp01((progress - 0.8667 * TIMELINE_SCALE) / (0.05 * TIMELINE_SCALE));
  const word1Local = clamp01(wordsT / (1 / 3));
  const word2Local = clamp01((wordsT - 1 / 3) / (1 / 3));
  const word3Local = clamp01((wordsT - 2 / 3) / (1 / 3));

  // finally, once those words have all spawned, a green checkmark appears
  // to the left of each one, one at a time, and its text turns to match —
  // the last stage of section 3, same SEC3_END-pinning as the other two,
  // so its pause before the outro is exactly SECTION_BREAK long as well
  const checksTStart = 0.9167 * TIMELINE_SCALE;
  const checksT = clamp01((progress - checksTStart) / (SEC3_END - checksTStart));
  const check1Local = clamp01(checksT / (1 / 3));
  const check2Local = clamp01((checksT - 1 / 3) / (1 / 3));
  const check3Local = clamp01((checksT - 2 / 3) / (1 / 3));

  // outro is split into back-to-back parts of outroT — each stage waits
  // for the previous one to completely finish before it starts: base SVG
  // spawns + moves (baseT) -> detail SVG fades in on top (detailRevealT)
  // -> home-page image fades in (homePageRevealT) -> horizontal connector
  // line grows across the gap (lineT) -> set-page image fades in beside
  // it (setPageRevealT) -> vertical connector line grows down from
  // set-page (vLineT) -> solution-view image fades in underneath it
  // (solutionViewRevealT) -> two more connector lines grow at once — one
  // down from home-page, one right-to-left from solution-view — both
  // converging on my_club's position (convergeT) -> my_club fades in
  // where they meet (myClubRevealT) -> a connector line grows down from
  // my_club (playersLineT) -> players fades in underneath it
  // (playersRevealT) -> a horizontal connector line grows right from
  // players (detailLineT) -> detailed_player_view fades in beside it
  // (detailedPlayerViewRevealT) -> a connector line grows down from
  // players (evolutionsLineT) -> evolutions fades in underneath it
  // (evolutionsRevealT) -> two more connector lines grow at once — one
  // right from evolutions, one down from detailed_player_view — both
  // converging on evolution_builder's position (builderLinesT) ->
  // evolution_builder fades in where they meet (evolutionBuilderRevealT)
  // -> a connector line grows down from evolutions (tacticsLineT) ->
  // tactics fades in underneath it (tacticsRevealT) -> two more connector
  // lines grow at once — one right from tactics, one down from
  // evolution_builder — both converging on squad_builder's position
  // (squadBuilderLinesT) -> squad_builder fades in where they meet
  // (squadBuilderRevealT) -> two more connector lines grow at once, one
  // down from tactics, one down from squad_builder (row6LinesT) ->
  // meta_rating_explainer and squad_tactics fade in together underneath
  // them (row6RevealT). The vertical camera pan (cameraOffsetY, below)
  // is NOT one of these discrete stages — it's a separate, continuous
  // ramp that starts as soon as the next row is introduced and finishes
  // just before that row's own reveal, so each row ends up roughly
  // centered (in y) in the canvas as it spawns. No horizontal panning —
  // each column is already about canvas-width, so both columns read as
  // centered without any help. (Pacing across all these stages will get a
  // proper pass later — this is just wiring up the next image for now.)
  const outroT = clamp01((progress - TIMELINE_SCALE) / (1 - TIMELINE_SCALE));

  // section 4 (wireframes): base SVG spawn + detail SVG fade-in, split
  // evenly across this section's own active window, in outroT-local
  // terms — ending at WIREFRAMES_ACTIVE_END, then holding (nothing
  // animating) until OVERVIEW_START hands off to section 5. Both
  // boundaries are derived from SEC4_END/SECTION_LEN above (converted
  // from absolute progress into outroT's own 0-1 scale) rather than
  // hardcoded, so they stay correct if the section lengths ever change.
  const WIREFRAMES_ACTIVE_END = (SEC4_END - TIMELINE_SCALE) / (1 - TIMELINE_SCALE); // 0.4375
  const OVERVIEW_START = (4 * SECTION_LEN - TIMELINE_SCALE) / (1 - TIMELINE_SCALE); // 0.5
  const BASE_SVG_END = WIREFRAMES_ACTIVE_END / 2;
  const DETAIL_SVG_END = WIREFRAMES_ACTIVE_END;

  // section 5 (overview): the screenshot mosaic, spread uniformly across
  // its own remaining span (OVERVIEW_START -> 1, no pause carved out
  // since it's the last section) — same 2:1 reveal:line-growth ratio as
  // before (11 reveal stages, 10 connector-line stages): OVERVIEW_R for
  // every image/SVG reveal, OVERVIEW_L (half of that) for every
  // connector-line growth, so 11*R + 10*L = 11*R + 5*R = 16*R spans the
  // whole section — every reveal takes the same slice as every other
  // reveal, every line the same slice as every other line, keeping the
  // scroll speed consistent within this section same as before.
  const OVERVIEW_WIDTH = 1 - OVERVIEW_START;
  const OVERVIEW_R = OVERVIEW_WIDTH / 16;
  const OVERVIEW_L = OVERVIEW_R / 2;
  const HOME_PAGE_END = OVERVIEW_START + OVERVIEW_R; // home-page image
  const LINE_END = HOME_PAGE_END + OVERVIEW_L; // horizontal connector line
  const SET_PAGE_END = LINE_END + OVERVIEW_R; // set-page image
  const VLINE_END = SET_PAGE_END + OVERVIEW_L; // vertical connector line
  // (also where the continuous vertical camera pan begins — see cameraOffsetY below)
  const SOLUTION_VIEW_END = VLINE_END + OVERVIEW_R; // solution-view image
  const CONVERGE_LINES_END = SOLUTION_VIEW_END + OVERVIEW_L; // the two lines to my_club
  const MY_CLUB_END = CONVERGE_LINES_END + OVERVIEW_R; // my_club image
  const PLAYERS_LINE_END = MY_CLUB_END + OVERVIEW_L; // connector line down from my_club
  const PLAYERS_END = PLAYERS_LINE_END + OVERVIEW_R; // players image
  const DETAIL_LINE_END = PLAYERS_END + OVERVIEW_L; // connector line right from players
  const DETAILED_PLAYER_VIEW_END = DETAIL_LINE_END + OVERVIEW_R; // detailed_player_view image
  const EVOLUTIONS_LINE_END = DETAILED_PLAYER_VIEW_END + OVERVIEW_L; // connector line down from players
  const EVOLUTIONS_END = EVOLUTIONS_LINE_END + OVERVIEW_R; // evolutions image
  const BUILDER_LINES_END = EVOLUTIONS_END + OVERVIEW_L; // the two lines to evolution_builder
  const EVOLUTION_BUILDER_END = BUILDER_LINES_END + OVERVIEW_R; // evolution_builder image
  const TACTICS_LINE_END = EVOLUTION_BUILDER_END + OVERVIEW_L; // connector line down from evolutions
  const TACTICS_END = TACTICS_LINE_END + OVERVIEW_R; // tactics image
  const SQUAD_BUILDER_LINES_END = TACTICS_END + OVERVIEW_L; // the two lines to squad_builder
  const SQUAD_BUILDER_END = SQUAD_BUILDER_LINES_END + OVERVIEW_R; // squad_builder image
  const ROW6_LINES_END = SQUAD_BUILDER_END + OVERVIEW_L; // lines down from tactics and squad_builder
  // (also where the continuous camera pan finishes)
  // ROW6_LINES_END -> 1: meta_rating_explainer + squad_tactics images (together)
  const IMAGE_GAP = 50; // px gap between images, reused for every gap
  const IMAGE_HEIGHT = 308.25; // rendered height of the 450px-wide 1200x822
  // screenshots (sbc_set_page, solution_view, my_club, players,
  // detailed_player_view, evolutions, evolution_builder, tactics,
  // squad_builder, meta_rating_explainer, squad_tactics) at that aspect
  // ratio
  const ROW_HEIGHT = IMAGE_HEIGHT + IMAGE_GAP; // vertical spacing between rows
  const baseT = clamp01(outroT / BASE_SVG_END);
  const REVEAL_Y_START = 600; // illustration's own y position: travels from
  const REVEAL_Y_END = 140; // 600 (below the canvas) up to 140 (a bit lower than before)
  const revealY = lerp(REVEAL_Y_START, REVEAL_Y_END, baseT);
  const revealT = baseT;
  const detailRevealT = clamp01((outroT - BASE_SVG_END) / (DETAIL_SVG_END - BASE_SVG_END));
  const homePageRevealT = clamp01((outroT - DETAIL_SVG_END) / (HOME_PAGE_END - DETAIL_SVG_END));
  const lineT = clamp01((outroT - HOME_PAGE_END) / (LINE_END - HOME_PAGE_END));
  const setPageRevealT = clamp01((outroT - LINE_END) / (SET_PAGE_END - LINE_END));
  const vLineT = clamp01((outroT - SET_PAGE_END) / (VLINE_END - SET_PAGE_END));
  const solutionViewRevealT = clamp01((outroT - VLINE_END) / (SOLUTION_VIEW_END - VLINE_END));
  const convergeT = clamp01((outroT - SOLUTION_VIEW_END) / (CONVERGE_LINES_END - SOLUTION_VIEW_END));
  const myClubRevealT = clamp01((outroT - CONVERGE_LINES_END) / (MY_CLUB_END - CONVERGE_LINES_END));
  const playersLineT = clamp01((outroT - MY_CLUB_END) / (PLAYERS_LINE_END - MY_CLUB_END));
  const playersRevealT = clamp01((outroT - PLAYERS_LINE_END) / (PLAYERS_END - PLAYERS_LINE_END));
  const detailLineT = clamp01((outroT - PLAYERS_END) / (DETAIL_LINE_END - PLAYERS_END));
  const detailedPlayerViewRevealT = clamp01(
    (outroT - DETAIL_LINE_END) / (DETAILED_PLAYER_VIEW_END - DETAIL_LINE_END),
  );
  const evolutionsLineT = clamp01(
    (outroT - DETAILED_PLAYER_VIEW_END) / (EVOLUTIONS_LINE_END - DETAILED_PLAYER_VIEW_END),
  );
  const evolutionsRevealT = clamp01(
    (outroT - EVOLUTIONS_LINE_END) / (EVOLUTIONS_END - EVOLUTIONS_LINE_END),
  );
  const builderLinesT = clamp01((outroT - EVOLUTIONS_END) / (BUILDER_LINES_END - EVOLUTIONS_END));
  const evolutionBuilderRevealT = clamp01(
    (outroT - BUILDER_LINES_END) / (EVOLUTION_BUILDER_END - BUILDER_LINES_END),
  );
  const tacticsLineT = clamp01(
    (outroT - EVOLUTION_BUILDER_END) / (TACTICS_LINE_END - EVOLUTION_BUILDER_END),
  );
  const tacticsRevealT = clamp01((outroT - TACTICS_LINE_END) / (TACTICS_END - TACTICS_LINE_END));
  const squadBuilderLinesT = clamp01(
    (outroT - TACTICS_END) / (SQUAD_BUILDER_LINES_END - TACTICS_END),
  );
  const squadBuilderRevealT = clamp01(
    (outroT - SQUAD_BUILDER_LINES_END) / (SQUAD_BUILDER_END - SQUAD_BUILDER_LINES_END),
  );
  const row6LinesT = clamp01((outroT - SQUAD_BUILDER_END) / (ROW6_LINES_END - SQUAD_BUILDER_END));
  const row6RevealT = clamp01((outroT - ROW6_LINES_END) / (1 - ROW6_LINES_END));
  // continuous vertical-only camera pan: no horizontal panning — each row
  // is 450px wide same as the canvas, so column 1 and column 2 are both
  // already roughly centered horizontally without any help. Vertically,
  // this is ONE single continuous ramp — not separate pans per row
  // transition — from 0 (row 1's resting position) to rowCenterOffset(6)
  // (row 6's center on the canvas's vertical center), running at a single
  // constant speed across its whole span (VLINE_END, when row 2 is
  // introduced, through to ROW6_LINES_END, just before row 6's
  // reveal). Splitting this into separate per-row pans previously gave
  // each segment a different distance/duration ratio, so the scroll sped
  // up and slowed down at each row boundary — a single lerp guarantees a
  // constant rate throughout. Combined with the now-uniform stage
  // durations above (every reveal same length, every line-growth same
  // length), the whole outro should now feel like one consistent scroll
  // speed start to finish.
  const CANVAS_CENTER_Y = 280; // half of the canvas's 560px height
  const rowCenterOffset = (rowIndex: number) =>
    ROW_HEIGHT * (rowIndex - 1) + IMAGE_HEIGHT / 2 - CANVAS_CENTER_Y;
  const scrollT = clamp01((outroT - VLINE_END) / (ROW6_LINES_END - VLINE_END));
  const cameraOffsetY = lerp(0, rowCenterOffset(6), scrollT);
  // outgoing content rises the same distance (520px) over the same baseT
  // range as the base SVG above (both driven by baseT, not raw outroT),
  // so the two stay synced/matched-rate through the whole exit
  const EXIT_LIFT = REVEAL_Y_START - REVEAL_Y_END;

  // row 3's button label only shows up once the shape is mostly a rectangle
  const buttonTextT = clamp01((morphT - 0.6) / 0.4);

  // row 2's box backgrounds fade away on the same schedule, revealing the
  // colour-matched label underneath
  const row2BgAlpha = 1 - clamp01((morphT - 0.6) / 0.4);

  // everything not claimed by a row fades away early in that sequence
  const fade = 1 - clamp01((progress - 0.3333 * TIMELINE_SCALE) / (0.1286 * TIMELINE_SCALE));

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

  // five named sections across the whole scroll, for the readout next to
  // the progress counter below — every section is an equal SECTION_LEN
  // (0.2) wide, so the four boundaries below are just 1x/2x/3x/4x
  // SECTION_LEN in absolute progress terms (3x = TIMELINE_SCALE, where
  // the circle animation hands off to the outro).
  const OVERVIEW_SECTION_START = 4 * SECTION_LEN;
  const sectionName =
    progress < SECTION_LEN
      ? 'Part 1: Color palette'
      : progress < 2 * SECTION_LEN
        ? 'Part 2: Color semantics'
        : progress < TIMELINE_SCALE
          ? 'Part 3: UI components'
          : progress < OVERVIEW_SECTION_START
            ? 'Part 4: Wireframes'
            : 'Part 5: Overview';

  // which of the 5 sections is current, for highlighting below — all
  // five blocks are visible together, stacked underneath each other,
  // right from the start; only the active one is highlighted (full
  // opacity), the rest sit dimmed at 30%, no entrance/exit animation or
  // overlap
  const activeSection =
    progress < SECTION_LEN
      ? 0
      : progress < 2 * SECTION_LEN
        ? 1
        : progress < TIMELINE_SCALE
          ? 2
          : progress < OVERVIEW_SECTION_START
            ? 3
            : 4;
  // the animation canvas is 560px tall, centered in its own h-screen
  // column via flex items-center — so its own top edge sits at
  // calc(50% - 280px) of the viewport. The active section's text aligns
  // with that same edge, rather than a fixed pixel value, so it always
  // lines up with the top of the animation regardless of viewport height.
  const CANVAS_HEIGHT = 560;
  // constant visual gap between the bottom of one text block and the top
  // of the next — unlike a fixed slot spacing, this stays the same
  // regardless of how many lines either block wraps to, since it's added
  // on top of each block's own measured height (see cumulativeTop below)
  // rather than baked into one shared spacing value.
  const TEXT_GAP = 64;
  // running top position of each block if they were simply stacked one
  // after another (block 0 at 0, block 1 right after block 0's real
  // height + TEXT_GAP, and so on) — computed from the measured heights
  // above, so it automatically adapts to however long each paragraph
  // actually is.
  const cumulativeTop: number[] = [];
  {
    let acc = 0;
    for (let i = 0; i < sectionCopy.length; i++) {
      cumulativeTop.push(acc);
      acc += (textHeights[i] || 0) + TEXT_GAP;
    }
  }

  // continuous 0..4 position driving the text stack below — derived
  // directly from scroll progress (not a fixed-duration CSS transition),
  // so the roll-in speed always tracks how fast the reader scrolls, and
  // the text lands on its new slot at the exact moment that section's
  // own animation stage pauses (SEC*_END), not sooner and not later.
  // That way the reader watches the animation while it's actively
  // drawing, and the text finishes arriving right as it stops — cueing
  // the shift from watching to reading. The very first section has
  // nothing to roll in from, so it just sits at its slot the whole time.
  const sectionActiveEnd =
    activeSection === 0
      ? SEC1_END
      : activeSection === 1
        ? SEC2_END
        : activeSection === 2
          ? SEC3_END
          : activeSection === 3
            ? SEC4_END
            : 1;
  const sectionActiveStart = activeSection * SECTION_LEN;
  const sectionProgress =
    activeSection === 0
      ? 0
      : activeSection -
        1 +
        clamp01((progress - sectionActiveStart) / (sectionActiveEnd - sectionActiveStart));

  // where the "anchor" point of the stack currently sits, in the same
  // cumulativeTop px units — interpolated between the two neighboring
  // blocks' real cumulative positions using sectionProgress's fractional
  // part, so the whole stack still slides smoothly between real,
  // unevenly-sized blocks instead of jumping.
  const activeTopOffsetLowIndex = Math.max(
    0,
    Math.min(sectionCopy.length - 1, Math.floor(sectionProgress)),
  );
  const activeTopOffsetHighIndex = Math.min(sectionCopy.length - 1, activeTopOffsetLowIndex + 1);
  const activeTopOffsetFrac = sectionProgress - activeTopOffsetLowIndex;
  const activeTopOffset =
    cumulativeTop[activeTopOffsetLowIndex] +
    (cumulativeTop[activeTopOffsetHighIndex] - cumulativeTop[activeTopOffsetLowIndex]) *
      activeTopOffsetFrac;

  return (
    <div className="bg-[#15181D]">
      {/* live scroll-progress readout, fixed to the viewport, for lining
          up which stage of the timeline we're talking about while polishing */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-2 font-mono text-xs text-white/70 pointer-events-none">
        <span className="bg-black/50 px-2 py-1 rounded">{progress.toFixed(3)}</span>
        <span className="bg-black/50 px-2 py-1 rounded">{sectionName}</span>
      </div>
      <div ref={ref} className="grid grid-cols-2">
        <div className="sticky top-0 h-screen flex items-center justify-center">
          <div className="relative w-[460px] max-w-full h-[560px]">
            <div
              style={{
                position: 'relative',
                zIndex: 10,
                transform: `translateY(${-baseT * EXIT_LIFT}px)`,
                opacity: 1 - baseT,
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
              {/* camera-pan layer: everything below shares one coordinate
                  space (row 1 at y=0, row 2 at y=ROW_HEIGHT, row 3 at
                  y=2*ROW_HEIGHT, etc). Vertical-only pan (cameraOffsetY) —
                  as each new row spawns, this shifts up so that row's
                  center lands roughly on the canvas's own vertical
                  center, instead of the canvas just clipping/overflowing —
                  a slow, continuous scroll. */}
              <div style={{ transform: `translateY(${-cameraOffsetY}px)` }}>
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

              {/* second, more detailed SVG — same 450x309 size, absolutely
                  positioned at (0,0) of this same wrapper so it lands
                  exactly on top of the base illustration above. It shares
                  the wrapper's position, but has its own opacity
                  (detailRevealT) that only starts leaving 0 once the base
                  SVG has fully stopped moving and is fully visible. */}
              <svg
                width="450"
                height="309"
                viewBox="0 0 450 309"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 1,
                  opacity: detailRevealT,
                }}
              >
                <g filter="url(#filter0_i_345_28259)">
                  <path fillRule="evenodd" clipRule="evenodd" d="M450 103.5H0V126H450V103.5Z" fill="#282D34"/>
                  <path d="M22.5 9C22.5 11.8995 20.1495 14.25 17.25 14.25C14.3505 14.25 12 11.8995 12 9C12 6.10051 14.3505 3.75 17.25 3.75C20.1495 3.75 22.5 6.10051 22.5 9Z" fill="#0087CD"/>
                  <path d="M25.125 8.4375C25.125 6.78065 26.4681 5.4375 28.125 5.4375H69.75C71.4069 5.4375 72.75 6.78065 72.75 8.4375V9.5625C72.75 11.2194 71.4069 12.5625 69.75 12.5625H28.125C26.4681 12.5625 25.125 11.2194 25.125 9.5625V8.4375Z" fill="#0087CD"/>
                  <path d="M257.625 8.4375C257.625 6.78065 258.968 5.4375 260.625 5.4375H282C283.657 5.4375 285 6.78065 285 8.4375V9.5625C285 11.2194 283.657 12.5625 282 12.5625H260.625C258.968 12.5625 257.625 11.2194 257.625 9.5625V8.4375Z" fill="#9AA6B3"/>
                  <path d="M291.375 8.4375C291.375 6.78065 292.718 5.4375 294.375 5.4375H315.75C317.407 5.4375 318.75 6.78065 318.75 8.4375V9.5625C318.75 11.2194 317.407 12.5625 315.75 12.5625H294.375C292.718 12.5625 291.375 11.2194 291.375 9.5625V8.4375Z" fill="#9AA6B3"/>
                  <path d="M325.125 8.4375C325.125 6.78065 326.468 5.4375 328.125 5.4375H349.5C351.157 5.4375 352.5 6.78065 352.5 8.4375V9.5625C352.5 11.2194 351.157 12.5625 349.5 12.5625H328.125C326.468 12.5625 325.125 11.2194 325.125 9.5625V8.4375Z" fill="#9AA6B3"/>
                  <path d="M358.875 8.4375C358.875 6.78065 360.218 5.4375 361.875 5.4375H383.25C384.907 5.4375 386.25 6.78065 386.25 8.4375V9.5625C386.25 11.2194 384.907 12.5625 383.25 12.5625H361.875C360.218 12.5625 358.875 11.2194 358.875 9.5625V8.4375Z" fill="#9AA6B3"/>
                  <path d="M392.625 6.75C392.625 5.09315 393.968 3.75 395.625 3.75H435C436.657 3.75 438 5.09315 438 6.75V11.25C438 12.9069 436.657 14.25 435 14.25H395.625C393.968 14.25 392.625 12.9069 392.625 11.25V6.75Z" fill="#00786E"/>
                  <path d="M30 112.5C30 110.843 31.3431 109.5 33 109.5H92.625C94.2819 109.5 95.625 110.843 95.625 112.5V117C95.625 118.657 94.2819 120 92.625 120H33C31.3431 120 30 118.657 30 117V112.5Z" fill="#1A1E23"/>
                  <path d="M125.438 112.5C125.438 110.843 126.781 109.5 128.438 109.5H159.938C161.594 109.5 162.938 110.843 162.938 112.5V117C162.938 118.657 161.594 120 159.938 120H128.438C126.781 120 125.438 118.657 125.438 117V112.5Z" fill="#9AA6B3"/>
                  <path d="M165.938 112.5C165.938 110.843 167.281 109.5 168.938 109.5H200.438C202.094 109.5 203.438 110.843 203.438 112.5V117C203.438 118.657 202.094 120 200.438 120H168.938C167.281 120 165.938 118.657 165.938 117V112.5Z" fill="#9AA6B3"/>
                  <path d="M206.438 112.5C206.438 110.843 207.781 109.5 209.438 109.5H240.938C242.594 109.5 243.938 110.843 243.938 112.5V117C243.938 118.657 242.594 120 240.938 120H209.438C207.781 120 206.438 118.657 206.438 117V112.5Z" fill="#9AA6B3"/>
                  <path d="M246.938 112.5C246.938 110.843 248.281 109.5 249.938 109.5H281.438C283.094 109.5 284.438 110.843 284.438 112.5V117C284.438 118.657 283.094 120 281.438 120H249.938C248.281 120 246.938 118.657 246.938 117V112.5Z" fill="#9AA6B3"/>
                  <path d="M287.438 112.5C287.438 110.843 288.781 109.5 290.438 109.5H321.938C323.594 109.5 324.938 110.843 324.938 112.5V117C324.938 118.657 323.594 120 321.938 120H290.438C288.781 120 287.438 118.657 287.438 117V112.5Z" fill="#9AA6B3"/>
                  <path d="M390.375 112.5C390.375 110.843 391.718 109.5 393.375 109.5H417.375C419.032 109.5 420.375 110.843 420.375 112.5V117C420.375 118.657 419.032 120 417.375 120H393.375C391.718 120 390.375 118.657 390.375 117V112.5Z" fill="#515F6E"/>
                  <path d="M161 153C161 151.343 162.343 150 164 150H286C287.657 150 289 151.343 289 153V191.625V230.25C289 231.907 287.657 233.25 286 233.25H164C162.343 233.25 161 231.907 161 230.25V153Z" fill="#282D34"/>
                  <path d="M292 153C292 151.343 293.343 150 295 150H417C418.657 150 420 151.343 420 153V230.25C420 231.907 418.657 233.25 417 233.25H295C293.343 233.25 292 231.907 292 230.25V153Z" fill="#282D34"/>
                  <path d="M286 236.25H164C162.343 236.25 161 237.593 161 239.25V308.25H289V239.25C289 237.593 287.657 236.25 286 236.25Z" fill="#282D34"/>
                  <path d="M417 236.25H295C293.343 236.25 292 237.593 292 239.25V308.25H420V239.25C420 237.593 418.657 236.25 417 236.25Z" fill="#282D34"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M0 18H450V12C450 5.37258 444.627 0 438 0H12C5.37257 0 0 5.37258 0 12V18ZM17.25 14.25C20.1495 14.25 22.5 11.8995 22.5 9C22.5 6.10051 20.1495 3.75 17.25 3.75C14.3505 3.75 12 6.10051 12 9C12 11.8995 14.3505 14.25 17.25 14.25ZM69.75 5.4375H28.125C26.4681 5.4375 25.125 6.78065 25.125 8.4375V9.5625C25.125 11.2194 26.4681 12.5625 28.125 12.5625H69.75C71.4069 12.5625 72.75 11.2194 72.75 9.5625V8.4375C72.75 6.78065 71.4069 5.4375 69.75 5.4375ZM282 5.4375H260.625C258.968 5.4375 257.625 6.78065 257.625 8.4375V9.5625C257.625 11.2194 258.968 12.5625 260.625 12.5625H282C283.657 12.5625 285 11.2194 285 9.5625V8.4375C285 6.78065 283.657 5.4375 282 5.4375ZM315.75 5.4375H294.375C292.718 5.4375 291.375 6.78065 291.375 8.4375V9.5625C291.375 11.2194 292.718 12.5625 294.375 12.5625H315.75C317.407 12.5625 318.75 11.2194 318.75 9.5625V8.4375C318.75 6.78065 317.407 5.4375 315.75 5.4375ZM349.5 5.4375H328.125C326.468 5.4375 325.125 6.78065 325.125 8.4375V9.5625C325.125 11.2194 326.468 12.5625 328.125 12.5625H349.5C351.157 12.5625 352.5 11.2194 352.5 9.5625V8.4375C352.5 6.78065 351.157 5.4375 349.5 5.4375ZM383.25 5.4375H361.875C360.218 5.4375 358.875 6.78065 358.875 8.4375V9.5625C358.875 11.2194 360.218 12.5625 361.875 12.5625H383.25C384.907 12.5625 386.25 11.2194 386.25 9.5625V8.4375C386.25 6.78065 384.907 5.4375 383.25 5.4375ZM435 3.75H395.625C393.968 3.75 392.625 5.09315 392.625 6.75V11.25C392.625 12.9069 393.968 14.25 395.625 14.25H435C436.657 14.25 438 12.9069 438 11.25V6.75C438 5.09315 436.657 3.75 435 3.75Z" fill="#121212"/>
                  <path d="M155 236.25H33C31.3431 236.25 30 237.593 30 239.25V308.25H158V239.25C158 237.593 156.657 236.25 155 236.25Z" fill="#282D34"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M36 189.75H138.75C140.407 189.75 141.75 191.093 141.75 192.75V228C141.75 229.657 140.407 231 138.75 231H36C34.3431 231 33 229.657 33 228V192.75C33 191.093 34.3431 189.75 36 189.75ZM59.625 192.75H39C37.3431 192.75 36 194.093 36 195.75V225C36 226.657 37.3431 228 39 228H59.625C61.2819 228 62.625 226.657 62.625 225V195.75C62.625 194.093 61.2819 192.75 59.625 192.75ZM89.25 194.25H68.625C66.9681 194.25 65.625 195.593 65.625 197.25C65.625 198.907 66.9681 200.25 68.625 200.25H89.25C90.9069 200.25 92.25 198.907 92.25 197.25C92.25 195.593 90.9069 194.25 89.25 194.25ZM96.75 202.5H68.625C66.9681 202.5 65.625 203.843 65.625 205.5C65.625 207.157 66.9681 208.5 68.625 208.5H96.75C98.4069 208.5 99.75 207.157 99.75 205.5C99.75 203.843 98.4069 202.5 96.75 202.5ZM123.75 213H67.875C66.6324 213 65.625 214.007 65.625 215.25C65.625 216.493 66.6324 217.5 67.875 217.5H123.75C124.993 217.5 126 216.493 126 215.25C126 214.007 124.993 213 123.75 213ZM119.625 218.25H67.875C66.6324 218.25 65.625 219.257 65.625 220.5C65.625 221.743 66.6324 222.75 67.875 222.75H119.625C120.868 222.75 121.875 221.743 121.875 220.5C121.875 219.257 120.868 218.25 119.625 218.25Z" fill="#333A42"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M420 308.25H436.5C443.956 308.25 450 302.206 450 294.75V126H0V294.75C0 302.206 6.04416 308.25 13.5 308.25H30V239.25C30 237.593 31.3431 236.25 33 236.25H155C156.657 236.25 158 237.593 158 239.25V308.25H161V239.25C161 237.593 162.343 236.25 164 236.25H286C287.657 236.25 289 237.593 289 239.25V308.25H292V239.25C292 237.593 293.343 236.25 295 236.25H417C418.657 236.25 420 237.593 420 239.25V308.25ZM286 150H164C162.343 150 161 151.343 161 153V230.25C161 231.907 162.343 233.25 164 233.25H286C287.657 233.25 289 231.907 289 230.25V191.625V153C289 151.343 287.657 150 286 150ZM417 150H295C293.343 150 292 151.343 292 153V230.25C292 231.907 293.343 233.25 295 233.25H417C418.657 233.25 420 231.907 420 230.25V153C420 151.343 418.657 150 417 150ZM155 150H33C31.3431 150 30 151.343 30 153V230.25C30 231.907 31.3431 233.25 33 233.25H155C156.657 233.25 158 231.907 158 230.25V153C158 151.343 156.657 150 155 150ZM417 135H33C31.3431 135 30 136.343 30 138V144C30 145.657 31.3431 147 33 147H417C418.657 147 420 145.657 420 144V138C420 136.343 418.657 135 417 135Z" fill="#1A1E23"/>
                  <path d="M450 18H0V103.5H450V18Z" fill="#1A1E23"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M33 135H417C418.657 135 420 136.343 420 138V144C420 145.657 418.657 147 417 147H33C31.3431 147 30 145.657 30 144V138C30 136.343 31.3431 135 33 135ZM59.25 137.25H35.25C33.5931 137.25 32.25 138.593 32.25 140.25V141.75C32.25 143.407 33.5931 144.75 35.25 144.75H59.25C60.9069 144.75 62.25 143.407 62.25 141.75V140.25C62.25 138.593 60.9069 137.25 59.25 137.25ZM413.25 137.25H411.75C410.093 137.25 408.75 138.593 408.75 140.25V141.75C408.75 143.407 410.093 144.75 411.75 144.75H413.25C414.907 144.75 416.25 143.407 416.25 141.75V140.25C416.25 138.593 414.907 137.25 413.25 137.25Z" fill="#282D34"/>
                  <path d="M39 192.75H59.625C61.2819 192.75 62.625 194.093 62.625 195.75V225C62.625 226.657 61.2819 228 59.625 228H39C37.3431 228 36 226.657 36 225V195.75C36 194.093 37.3431 192.75 39 192.75Z" fill="#545F6D"/>
                  <path d="M67.875 218.25H119.625C120.868 218.25 121.875 219.257 121.875 220.5C121.875 221.743 120.868 222.75 119.625 222.75H67.875C66.6324 222.75 65.625 221.743 65.625 220.5C65.625 219.257 66.6324 218.25 67.875 218.25Z" fill="#9AA6B3"/>
                  <path d="M67.875 213H123.75C124.993 213 126 214.007 126 215.25C126 216.493 124.993 217.5 123.75 217.5H67.875C66.6324 217.5 65.625 216.493 65.625 215.25C65.625 214.007 66.6324 213 67.875 213Z" fill="#9AA6B3"/>
                  <path d="M68.625 202.5H96.75C98.4069 202.5 99.75 203.843 99.75 205.5C99.75 207.157 98.4069 208.5 96.75 208.5H68.625C66.9681 208.5 65.625 207.157 65.625 205.5C65.625 203.843 66.9681 202.5 68.625 202.5Z" fill="#9AA6B3"/>
                  <path d="M68.625 194.25H89.25C90.9069 194.25 92.25 195.593 92.25 197.25C92.25 198.907 90.9069 200.25 89.25 200.25H68.625C66.9681 200.25 65.625 198.907 65.625 197.25C65.625 195.593 66.9681 194.25 68.625 194.25Z" fill="#9AA6B3"/>
                  <path d="M147.375 211.125H150.375C152.032 211.125 153.375 212.468 153.375 214.125V218.625C153.375 220.282 152.032 221.625 150.375 221.625H147.375C145.718 221.625 144.375 220.282 144.375 218.625V214.125C144.375 212.468 145.718 211.125 147.375 211.125Z" fill="#9AA6B3"/>
                  <path d="M147.375 197.625H150.375C152.032 197.625 153.375 198.968 153.375 200.625V205.125C153.375 206.782 152.032 208.125 150.375 208.125H147.375C145.718 208.125 144.375 206.782 144.375 205.125V200.625C144.375 198.968 145.718 197.625 147.375 197.625Z" fill="#9AA6B3"/>
                  <path d="M101.812 181.125H126.188C127.741 181.125 129 182.384 129 183.938C129 185.491 127.741 186.75 126.188 186.75H101.812C100.259 186.75 99 185.491 99 183.938C99 182.384 100.259 181.125 101.812 181.125Z" fill="#9AA6B3"/>
                  <path d="M68.8125 181.125H93.1875C94.7408 181.125 96 182.384 96 183.938C96 185.491 94.7408 186.75 93.1875 186.75H68.8125C67.2592 186.75 66 185.491 66 183.938C66 182.384 67.2592 181.125 68.8125 181.125Z" fill="#9AA6B3"/>
                  <path d="M35.8125 181.125H60.1875C61.7408 181.125 63 182.384 63 183.938C63 185.491 61.7408 186.75 60.1875 186.75H35.8125C34.2592 186.75 33 185.491 33 183.938C33 182.384 34.2592 181.125 35.8125 181.125Z" fill="#9AA6B3"/>
                  <path d="M37.5 154.5H43.5C45.1569 154.5 46.5 155.843 46.5 157.5V166.5C46.5 168.157 45.1569 169.5 43.5 169.5H37.5C35.8431 169.5 34.5 168.157 34.5 166.5V157.5C34.5 155.843 35.8431 154.5 37.5 154.5Z" fill="#545F6D"/>
                  <path d="M51 162.75H63.375C65.0319 162.75 66.375 164.093 66.375 165.75V166.5C66.375 168.157 65.0319 169.5 63.375 169.5H51C49.3431 169.5 48 168.157 48 166.5V165.75C48 164.093 49.3431 162.75 51 162.75Z" fill="#9AA6B3"/>
                  <path d="M51 154.5H74.25C75.9069 154.5 77.25 155.843 77.25 157.5V158.25C77.25 159.907 75.9069 161.25 74.25 161.25H51C49.3431 161.25 48 159.907 48 158.25V157.5C48 155.843 49.3431 154.5 51 154.5Z" fill="#9AA6B3"/>
                  <path d="M142.625 153H150.5C152.157 153 153.5 154.343 153.5 156V157.5C153.5 159.157 152.157 160.5 150.5 160.5H142.625C140.968 160.5 139.625 159.157 139.625 157.5V156C139.625 154.343 140.968 153 142.625 153Z" fill="#4539D3"/>
                  <path d="M35.25 137.25H59.25C60.9069 137.25 62.25 138.593 62.25 140.25V141.75C62.25 143.407 60.9069 144.75 59.25 144.75H35.25C33.5931 144.75 32.25 143.407 32.25 141.75V140.25C32.25 138.593 33.5931 137.25 35.25 137.25Z" fill="#9AA6B3"/>
                  <path d="M411.75 137.25H413.25C414.907 137.25 416.25 138.593 416.25 140.25V141.75C416.25 143.407 414.907 144.75 413.25 144.75H411.75C410.093 144.75 408.75 143.407 408.75 141.75V140.25C408.75 138.593 410.093 137.25 411.75 137.25Z" fill="#515F6E"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M33 150H155C156.657 150 158 151.343 158 153V230.25C158 231.907 156.657 233.25 155 233.25H33C31.3431 233.25 30 231.907 30 230.25V153C30 151.343 31.3431 150 33 150ZM43.5 154.5H37.5C35.8431 154.5 34.5 155.843 34.5 157.5V166.5C34.5 168.157 35.8431 169.5 37.5 169.5H43.5C45.1569 169.5 46.5 168.157 46.5 166.5V157.5C46.5 155.843 45.1569 154.5 43.5 154.5ZM74.25 154.5H51C49.3431 154.5 48 155.843 48 157.5V158.25C48 159.907 49.3431 161.25 51 161.25H74.25C75.9069 161.25 77.25 159.907 77.25 158.25V157.5C77.25 155.843 75.9069 154.5 74.25 154.5ZM63.375 162.75H51C49.3431 162.75 48 164.093 48 165.75V166.5C48 168.157 49.3431 169.5 51 169.5H63.375C65.0319 169.5 66.375 168.157 66.375 166.5V165.75C66.375 164.093 65.0319 162.75 63.375 162.75ZM150.5 153H142.625C140.968 153 139.625 154.343 139.625 156V157.5C139.625 159.157 140.968 160.5 142.625 160.5H150.5C152.157 160.5 153.5 159.157 153.5 157.5V156C153.5 154.343 152.157 153 150.5 153ZM138.188 173.25H78.5625H35.8125C34.2592 173.25 33 174.322 33 175.875C33 177.428 34.2592 178.5 35.8125 178.5H78.5625H138.188C139.741 178.5 141 177.428 141 175.875C141 174.322 139.741 173.25 138.188 173.25ZM60.1875 181.125H35.8125C34.2592 181.125 33 182.384 33 183.938C33 185.491 34.2592 186.75 35.8125 186.75H60.1875C61.7408 186.75 63 185.491 63 183.938C63 182.384 61.7408 181.125 60.1875 181.125ZM93.1875 181.125H68.8125C67.2592 181.125 66 182.384 66 183.938C66 185.491 67.2592 186.75 68.8125 186.75H93.1875C94.7408 186.75 96 185.491 96 183.938C96 182.384 94.7408 181.125 93.1875 181.125ZM126.188 181.125H101.812C100.259 181.125 99 182.384 99 183.938C99 185.491 100.259 186.75 101.812 186.75H126.188C127.741 186.75 129 185.491 129 183.938C129 182.384 127.741 181.125 126.188 181.125ZM150.375 197.625H147.375C145.718 197.625 144.375 198.968 144.375 200.625V205.125C144.375 206.782 145.718 208.125 147.375 208.125H150.375C152.032 208.125 153.375 206.782 153.375 205.125V200.625C153.375 198.968 152.032 197.625 150.375 197.625ZM150.375 211.125H147.375C145.718 211.125 144.375 212.468 144.375 214.125V218.625C144.375 220.282 145.718 221.625 147.375 221.625H150.375C152.032 221.625 153.375 220.282 153.375 218.625V214.125C153.375 212.468 152.032 211.125 150.375 211.125ZM138.75 189.75H36C34.3431 189.75 33 191.093 33 192.75V228C33 229.657 34.3431 231 36 231H138.75C140.407 231 141.75 229.657 141.75 228V192.75C141.75 191.093 140.407 189.75 138.75 189.75Z" fill="#282D34"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M138.188 173.25H78.5625V178.5H138.188C139.741 178.5 141 177.428 141 175.875C141 174.322 139.741 173.25 138.188 173.25Z" fill="#9AA6B3"/>
                  <path d="M33 175.875C33 177.428 34.2592 178.5 35.8125 178.5H78.5625V173.25H35.8125C34.2592 173.25 33 174.322 33 175.875Z" fill="#0087CD"/>
                </g>
                <defs>
                  <filter id="filter0_i_345_28259" x="0" y="0" width="450" height="308.25" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                    <feOffset/>
                    <feGaussianBlur stdDeviation="0.5"/>
                    <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.3 0"/>
                    <feBlend mode="normal" in2="shape" result="effect1_innerShadow_345_28259"/>
                  </filter>
                </defs>
              </svg>

              {/* home-page screenshot — same 450px width, absolutely
                  positioned on top of both SVGs above, waiting until the
                  detail SVG is fully visible before it starts fading in */}
              <img
                src={sbcHomePage}
                alt=""
                width={450}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: 450,
                  height: 'auto',
                  zIndex: 2,
                  opacity: homePageRevealT,
                  filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.3))',
                }}
              />

              {/* connector line — grows from sbc_home_page's right edge
                  (x=450) across the 50px gap toward sbc_set_page's left
                  edge, vertically centered on the images (~154, half of
                  their ~308px rendered height). Once it's fully grown, the
                  set-page image below starts fading in. */}
              <div
                style={{
                  position: 'absolute',
                  top: 154,
                  left: 450,
                  width: lerp(0, IMAGE_GAP, lineT),
                  height: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  zIndex: 2,
                }}
              />

              {/* set-page screenshot — same 450px width, positioned with a
                  50px gap (IMAGE_GAP) after sbc_home_page. Waits until the
                  connector line above has fully reached its position
                  before it starts fading in. */}
              <img
                src={sbcSetPage}
                alt=""
                width={450}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 450 + IMAGE_GAP,
                  width: 450,
                  height: 'auto',
                  zIndex: 2,
                  opacity: setPageRevealT,
                  filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.3))',
                }}
              />

              {/* vertical connector line — grows from sbc_set_page's
                  bottom edge down across the 50px gap toward
                  solution_view's top edge, horizontally centered on that
                  column (left: 500 + 225 = 725). Once it's fully grown,
                  solution_view starts fading in underneath. */}
              <div
                style={{
                  position: 'absolute',
                  top: IMAGE_HEIGHT,
                  left: 450 + IMAGE_GAP + 225, // horizontal center of the 450-wide column
                  width: 2,
                  height: lerp(0, IMAGE_GAP, vLineT),
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  zIndex: 2,
                }}
              />

              {/* solution_view screenshot — same 450px width, same left
                  edge as sbc_set_page, sitting a 50px gap below it. Waits
                  until the vertical connector line above has fully grown
                  before it starts fading in. */}
              <img
                src={solutionView}
                alt=""
                width={450}
                style={{
                  position: 'absolute',
                  top: IMAGE_HEIGHT + IMAGE_GAP,
                  left: 450 + IMAGE_GAP,
                  width: 450,
                  height: 'auto',
                  zIndex: 2,
                  opacity: solutionViewRevealT,
                  filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.3))',
                }}
              />

              {/* two connector lines converging on my_club, growing at the
                  same time (convergeT): one straight down from
                  sbc_home_page's bottom edge, the other right-to-left from
                  solution_view's left edge (anchored on the right at
                  x=500, growing leftward) */}
              <div
                style={{
                  position: 'absolute',
                  top: IMAGE_HEIGHT,
                  left: 225, // horizontal center of the sbc_home_page column
                  width: 2,
                  height: lerp(0, IMAGE_GAP, convergeT),
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  zIndex: 2,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: IMAGE_HEIGHT + IMAGE_GAP + IMAGE_HEIGHT / 2, // vertical center of row 2
                  left: 500 - lerp(0, IMAGE_GAP, convergeT), // right edge fixed at 500, grows leftward
                  width: lerp(0, IMAGE_GAP, convergeT),
                  height: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  zIndex: 2,
                }}
              />

              {/* my_club screenshot — same 450px width, sits below
                  sbc_home_page (same left edge) and beside solution_view
                  (same row), where the two connector lines above meet.
                  Waits until both lines have fully grown before it starts
                  fading in. */}
              <img
                src={myClub}
                alt=""
                width={450}
                style={{
                  position: 'absolute',
                  top: IMAGE_HEIGHT + IMAGE_GAP,
                  left: 0,
                  width: 450,
                  height: 'auto',
                  zIndex: 2,
                  opacity: myClubRevealT,
                  filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.3))',
                }}
              />

              {/* connector line down from my_club to players (row 3),
                  same column (left: 225, center of the row 1/2/3 column) */}
              <div
                style={{
                  position: 'absolute',
                  top: ROW_HEIGHT + IMAGE_HEIGHT, // my_club's bottom edge
                  left: 225,
                  width: 2,
                  height: lerp(0, IMAGE_GAP, playersLineT),
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  zIndex: 2,
                }}
              />

              {/* players screenshot — row 3, same left edge as my_club and
                  sbc_home_page. Waits until the camera has finished
                  panning and the connector line above has fully grown. */}
              <img
                src={players}
                alt=""
                width={450}
                style={{
                  position: 'absolute',
                  top: ROW_HEIGHT * 2,
                  left: 0,
                  width: 450,
                  height: 'auto',
                  zIndex: 2,
                  opacity: playersRevealT,
                  filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.3))',
                }}
              />

              {/* connector line right from players to detailed_player_view,
                  same row (top: ROW_HEIGHT*2 + IMAGE_HEIGHT/2, vertical
                  center of row 3), growing left-to-right like the very
                  first connector line */}
              <div
                style={{
                  position: 'absolute',
                  top: ROW_HEIGHT * 2 + IMAGE_HEIGHT / 2,
                  left: 450,
                  width: lerp(0, IMAGE_GAP, detailLineT),
                  height: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  zIndex: 2,
                }}
              />

              {/* detailed_player_view screenshot — same 450px width, same
                  row as players, 50px gap to its right. Waits until the
                  connector line above has fully grown before fading in. */}
              <img
                src={detailedPlayerView}
                alt=""
                width={450}
                style={{
                  position: 'absolute',
                  top: ROW_HEIGHT * 2,
                  left: 450 + IMAGE_GAP,
                  width: 450,
                  height: 'auto',
                  zIndex: 2,
                  opacity: detailedPlayerViewRevealT,
                  filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.3))',
                }}
              />

              {/* connector line down from players to evolutions (row 4),
                  same column (left: 225, center of the column-1 images) */}
              <div
                style={{
                  position: 'absolute',
                  top: ROW_HEIGHT * 2 + IMAGE_HEIGHT, // players' bottom edge
                  left: 225,
                  width: 2,
                  height: lerp(0, IMAGE_GAP, evolutionsLineT),
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  zIndex: 2,
                }}
              />

              {/* evolutions screenshot — row 4, same left edge as players/
                  my_club/sbc_home_page. Waits until the connector line
                  above has fully grown before it starts fading in. */}
              <img
                src={evolutions}
                alt=""
                width={450}
                style={{
                  position: 'absolute',
                  top: ROW_HEIGHT * 3,
                  left: 0,
                  width: 450,
                  height: 'auto',
                  zIndex: 2,
                  opacity: evolutionsRevealT,
                  filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.3))',
                }}
              />

              {/* two connector lines growing at once, converging on
                  evolution_builder's position (row 4, column 2): one
                  right from evolutions, one down from
                  detailed_player_view */}
              <div
                style={{
                  position: 'absolute',
                  top: ROW_HEIGHT * 3 + IMAGE_HEIGHT / 2,
                  left: 450, // evolutions' right edge
                  width: lerp(0, IMAGE_GAP, builderLinesT),
                  height: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  zIndex: 2,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: ROW_HEIGHT * 2 + IMAGE_HEIGHT, // detailed_player_view's bottom edge
                  left: 725, // center of column 2 (500 + 225)
                  width: 2,
                  height: lerp(0, IMAGE_GAP, builderLinesT),
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  zIndex: 2,
                }}
              />

              {/* evolution_builder screenshot — row 4, column 2, same
                  left edge as sbc_set_page/solution_view/
                  detailed_player_view. Waits until both lines above have
                  fully grown before it starts fading in. */}
              <img
                src={evolutionBuilder}
                alt=""
                width={450}
                style={{
                  position: 'absolute',
                  top: ROW_HEIGHT * 3,
                  left: 500,
                  width: 450,
                  height: 'auto',
                  zIndex: 2,
                  opacity: evolutionBuilderRevealT,
                  filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.3))',
                }}
              />

              {/* connector line down from evolutions to tactics (row 5),
                  same column (left: 225, center of the column-1 images) */}
              <div
                style={{
                  position: 'absolute',
                  top: ROW_HEIGHT * 3 + IMAGE_HEIGHT, // evolutions' bottom edge
                  left: 225,
                  width: 2,
                  height: lerp(0, IMAGE_GAP, tacticsLineT),
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  zIndex: 2,
                }}
              />

              {/* tactics screenshot — row 5, same left edge as evolutions/
                  players/my_club/sbc_home_page. Waits until the connector
                  line above has fully grown before it starts fading in. */}
              <img
                src={tactics}
                alt=""
                width={450}
                style={{
                  position: 'absolute',
                  top: ROW_HEIGHT * 4,
                  left: 0,
                  width: 450,
                  height: 'auto',
                  zIndex: 2,
                  opacity: tacticsRevealT,
                  filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.3))',
                }}
              />

              {/* two connector lines growing at once, converging on
                  squad_builder's position (row 5, column 2): one right
                  from tactics, one down from evolution_builder */}
              <div
                style={{
                  position: 'absolute',
                  top: ROW_HEIGHT * 4 + IMAGE_HEIGHT / 2,
                  left: 450, // tactics' right edge
                  width: lerp(0, IMAGE_GAP, squadBuilderLinesT),
                  height: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  zIndex: 2,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: ROW_HEIGHT * 3 + IMAGE_HEIGHT, // evolution_builder's bottom edge
                  left: 725, // center of column 2 (500 + 225)
                  width: 2,
                  height: lerp(0, IMAGE_GAP, squadBuilderLinesT),
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  zIndex: 2,
                }}
              />

              {/* squad_builder screenshot — row 5, column 2, same left
                  edge as sbc_set_page/solution_view/detailed_player_view/
                  evolution_builder. Waits until both lines above have
                  fully grown before it starts fading in. */}
              <img
                src={squadBuilder}
                alt=""
                width={450}
                style={{
                  position: 'absolute',
                  top: ROW_HEIGHT * 4,
                  left: 500,
                  width: 450,
                  height: 'auto',
                  zIndex: 2,
                  opacity: squadBuilderRevealT,
                  filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.3))',
                }}
              />

              {/* two connector lines growing at once, down from tactics
                  (column 1) and down from squad_builder (column 2), each
                  leading to row 6's images */}
              <div
                style={{
                  position: 'absolute',
                  top: ROW_HEIGHT * 4 + IMAGE_HEIGHT, // tactics' bottom edge
                  left: 225,
                  width: 2,
                  height: lerp(0, IMAGE_GAP, row6LinesT),
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  zIndex: 2,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: ROW_HEIGHT * 4 + IMAGE_HEIGHT, // squad_builder's bottom edge
                  left: 725,
                  width: 2,
                  height: lerp(0, IMAGE_GAP, row6LinesT),
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  zIndex: 2,
                }}
              />

              {/* meta_rating_explainer — row 6, column 1, underneath
                  tactics. Fades in together with squad_tactics once both
                  lines above have fully grown. */}
              <img
                src={metaRatingExplainer}
                alt=""
                width={450}
                style={{
                  position: 'absolute',
                  top: ROW_HEIGHT * 5,
                  left: 0,
                  width: 450,
                  height: 'auto',
                  zIndex: 2,
                  opacity: row6RevealT,
                  filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.3))',
                }}
              />

              {/* squad_tactics — row 6, column 2, underneath
                  squad_builder. Fades in together with
                  meta_rating_explainer. */}
              <img
                src={squadTactics}
                alt=""
                width={450}
                style={{
                  position: 'absolute',
                  top: ROW_HEIGHT * 5,
                  left: 500,
                  width: 450,
                  height: 'auto',
                  zIndex: 2,
                  opacity: row6RevealT,
                  filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.3))',
                }}
              />
              </div>
            </div>

            {/* guiding grid — sits behind the animation (z-0, vs the
                animation's z-10/z-5) so it's a reference, not an obstruction,
                and lives outside the outro-transform wrapper so it stays put
                (doesn't scroll up or fade with the rest at the end) */}
            {SHOW_DEBUG_GRID && <DebugGrid width={460} height={560} />}
          </div>
        </div>

        {/* plain spacer column — these divs carry no text of their own
            anymore, they exist purely to give the ref container the total
            height it needs for the overall scroll pace (same ~544vh
            budget as before). Native CSS sticky can only hold an element
            in place for (containerHeight - 100vh) of scroll before
            releasing, which would need a MUCH taller container to cover a
            full 25% of a reasonably-sized page (checked: to make sticky
            alone last exactly until the next section, these would have to
            balloon to 350-400vh+ each, nearly tripling the page length) —
            so instead, the actual visible text is rendered separately
            below as fixed-position layers keyed directly to `progress`,
            which stays stuck for an entire section with no dependency on
            container height at all. */}
        <div className="flex flex-col max-w-md">
          <div style={{ height: '121vh' }} aria-hidden />
          <div style={{ height: '121vh' }} aria-hidden />
          <div style={{ height: '121vh' }} aria-hidden />
          <div style={{ height: '121vh' }} aria-hidden />
          {/* trailing buffer: without this, the sticky canvas unsticks and
              starts scrolling away the instant progress hits 1 (there's no
              container height left to keep it pinned), cutting the outro
              off right as it finishes. This holds progress at 1 for a bit
              so the finished state — grid included — stays on screen. */}
          <div className="h-[60vh]" aria-hidden />
        </div>
      </div>

      {/* the actual case-study text — all five blocks stacked underneath
          each other, same x-axis as before (left/width: 50%, unchanged —
          only the y-position moves). Each block's own `top` is
          calc(50% - 280px + (cumulativeTop[i] - activeTopOffset)), so the
          active one always lands exactly on the animation canvas's own
          top edge (calc(50% - CANVAS_HEIGHT/2), matching how the canvas
          is centered via flex items-center in its h-screen column)
          rather than a fixed pixel value — so it stays aligned with the
          top of the animation at any viewport height. Earlier sections
          sit above that, later ones sit below, spaced by each block's own
          measured height plus the constant TEXT_GAP — so the visual gap
          between blocks is the same everywhere even though the blocks
          themselves wrap to different heights. Sections above the active
          one fade to 0; sections below stay dimmed at 30%. */}
      <div
        className="fixed top-0 h-screen pointer-events-none"
        style={{ left: '50%', width: '50%', zIndex: 15 }}
      >
        <div className="relative h-full">
          {sectionCopy.map((text, i) => (
            <p
              key={i}
              ref={(el) => {
                textRefs.current[i] = el;
              }}
              className="absolute left-0 text-white text-lg max-w-md px-12"
              style={{
                top: `calc(50% - ${CANVAS_HEIGHT / 2}px + ${cumulativeTop[i] - activeTopOffset}px)`,
                opacity: i < activeSection ? 0 : i === activeSection ? 1 : 0.3,
                transition: 'opacity 1.5s ease',
              }}
            >
              {text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
