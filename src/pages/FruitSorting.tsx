import { useLayoutEffect, useRef, useState } from 'react';
import apple1 from '../assets/Fruit/apple_1.svg';
import apple2 from '../assets/Fruit/apple_2.svg';
import apple3 from '../assets/Fruit/apple_3.svg';
import banana1 from '../assets/Fruit/banana_1.svg';
import banana2 from '../assets/Fruit/banana_2.svg';
import banana3 from '../assets/Fruit/banana_3.svg';
import orange1 from '../assets/Fruit/orange_1.svg';
import orange2 from '../assets/Fruit/orange_2.svg';
import orange3 from '../assets/Fruit/orange_3.svg';
import pear1 from '../assets/Fruit/pear_1.svg';
import pear2 from '../assets/Fruit/pear_2.svg';
import rottenApple1 from '../assets/Fruit/rotten_apple_1.svg';
import rottenApple2 from '../assets/Fruit/rotten_apple_2.svg';
import rottenBanana1 from '../assets/Fruit/rotten_banana_1.svg';
import rottenBanana2 from '../assets/Fruit/rotten_banana_2.svg';
import rottenOrange1 from '../assets/Fruit/rotten_orange_1.svg';
import rottenOrange2 from '../assets/Fruit/rotten_orange_2.svg';
import rottenPear1 from '../assets/Fruit/rotten_pear_1.svg';
import rottenPear2 from '../assets/Fruit/rotten_pear_2.svg';
import tube from '../assets/Humble/Tube.svg';
import trash from '../assets/Humble/trash.svg';
import approved from '../assets/Humble/approved.svg';
import humbleCoding from '../assets/Humble/humble_coding.png';
import humblePrototype from '../assets/Humble/humble_prototype.png';
import dtuLogo from '../assets/Humble/dtu_logo.png';
import humbleLogo from '../assets/Humble/humble_logo.png';
import legoLogo from '../assets/Humble/lego_logo.png';

// every fruit image available to the schedule below, plus its display size
// (all 80px, same as everything else).
const FRUITS = {
  apple1: { src: apple1, size: 80 },
  apple2: { src: apple2, size: 80 },
  apple3: { src: apple3, size: 80 },
  banana1: { src: banana1, size: 80 },
  banana2: { src: banana2, size: 80 },
  banana3: { src: banana3, size: 80 },
  orange1: { src: orange1, size: 80 },
  orange2: { src: orange2, size: 80 },
  orange3: { src: orange3, size: 80 },
  pear1: { src: pear1, size: 80 },
  pear2: { src: pear2, size: 80 },
  rottenApple1: { src: rottenApple1, size: 80 },
  rottenApple2: { src: rottenApple2, size: 80 },
  rottenBanana1: { src: rottenBanana1, size: 80 },
  rottenBanana2: { src: rottenBanana2, size: 80 },
  rottenOrange1: { src: rottenOrange1, size: 80 },
  rottenOrange2: { src: rottenOrange2, size: 80 },
  rottenPear1: { src: rottenPear1, size: 80 },
  rottenPear2: { src: rottenPear2, size: 80 },
} as const;

type FruitKey = keyof typeof FRUITS;

// ── Animation length ────────────────────────────────────────────────────
// The whole thing loops on repeat with this length. Every "at" value below
// is a position within one loop, in seconds.
const ANIMATION_DURATION = 30;

// ── Spawn schedule ──────────────────────────────────────────────────────
// This is the part to edit. Each line is one fruit drop:
//   fruit — which image, from the FRUITS list above
//   at    — when it starts falling, in seconds into the loop (0-30)
//   x     — its horizontal position, in pixels from the box's left edge.
//           The box is about 628px wide at typical desktop sizes (narrower
//           on small screens). Safe range: 0 to 548 (every fruit is 80px)
//           — that keeps it fully inside the box on a normal-width screen.
// Add as many lines as you like, in any order, and reuse the same fruit
// as many times as you like at different times/positions. Every drop
// falls at the same speed — an "at" too close to 30 just lets the fall
// continue seamlessly into the start of the next loop instead of rushing.
// sorted by "at" (spawn time), ascending — easier to scan for gaps/clumps
// than grouping by fruit type
const SCHEDULE: { fruit: FruitKey; at: number; x: number }[] = [
  { fruit: 'rottenApple1', at: 0, x: 155 },
  { fruit: 'rottenOrange2', at: 0, x: 300 },
  { fruit: 'apple2', at: 1, x: 420 },
  { fruit: 'pear2', at: 1.1, x: 110 },
  { fruit: 'banana1', at: 1.2, x: 210 },
  { fruit: 'orange1', at: 2, x: 410 },
  { fruit: 'pear1', at: 2.2, x: 220 },
  { fruit: 'rottenBanana2', at: 2.8, x: 420 },
  { fruit: 'apple3', at: 2.3, x: 320 },
  { fruit: 'banana2', at: 2.9, x: 110 },
  { fruit: 'rottenPear1', at: 3.3, x: 270 },
  { fruit: 'apple3', at: 4.1, x: 252 },
  { fruit: 'orange2', at: 4.2, x: 150 },
  { fruit: 'pear2', at: 4.2, x: 430 },
  { fruit: 'banana1', at: 4.3, x: 330 },
  { fruit: 'apple1', at: 5, x: 110 },
  { fruit: 'pear1', at: 5, x: 230 },
  { fruit: 'rottenOrange1', at: 5.2, x: 380 },
  { fruit: 'pear2', at: 5.7, x: 130 },
  { fruit: 'apple3', at: 6.2, x: 452 },
  { fruit: 'banana1', at: 5.9, x: 210 },
  { fruit: 'orange2', at: 6.4, x: 290 },
  { fruit: 'apple1', at: 6.7, x: 200 },
  { fruit: 'orange3', at: 7.2, x: 450 },
  { fruit: 'apple2', at: 6.7, x: 95 },
  { fruit: 'rottenApple2', at: 7, x: 370 },
  { fruit: 'orange1', at: 7.5, x: 145 },
  { fruit: 'rottenBanana2', at: 7.5, x: 270 },
  { fruit: 'apple3', at: 8.2, x: 210 },
  { fruit: 'banana2', at: 8.4, x: 110 },
  { fruit: 'banana3', at: 8.5, x: 400 },
  { fruit: 'pear2', at: 8.7, x: 320 },
  { fruit: 'pear1', at: 9.2, x: 210 },
  { fruit: 'apple3', at: 9.3, x: 95 },
  { fruit: 'rottenApple1', at: 9.6, x: 410 },
  { fruit: 'banana1', at: 10.1, x: 300 },
  { fruit: 'apple2', at: 10.2, x: 135 },
  { fruit: 'rottenOrange2', at: 10.7, x: 442 },
  { fruit: 'apple2', at: 10.9, x: 350 },
  { fruit: 'apple1', at: 10.4, x: 230 },
  { fruit: 'orange2', at: 11, x: 135 },
  { fruit: 'apple1', at: 12, x: 410 },
  { fruit: 'banana3', at: 12.2, x: 105},
  { fruit: 'pear2', at: 12.3, x: 215 },
  { fruit: 'orange1', at: 12.7, x: 250 },
  { fruit: 'rottenPear2', at: 11.5, x: 240 },
  { fruit: 'banana1', at: 13.5, x: 350 },
  { fruit: 'orange2', at: 13.6, x: 110 },
  { fruit: 'apple1', at: 13.5, x: 220 },
  { fruit: 'apple2', at: 14.2, x: 270 },
  { fruit: 'pear2', at: 14, x: 430 },
  { fruit: 'apple3', at: 14.9, x: 105 },
  { fruit: 'banana2', at: 15.1, x: 200 },
  { fruit: 'orange1', at: 15.2, x: 250 },
  { fruit: 'apple3', at: 15.5, x: 350 },
  { fruit: 'rottenPear1', at: 15.8, x: 110 },
  { fruit: 'apple2', at: 16, x: 410 },
  { fruit: 'banana2', at: 16.6, x: 250 },
  { fruit: 'orange1', at: 16.8, x: 210 },
  { fruit: 'rottenBanana1', at: 17, x: 420 },
  { fruit: 'apple1', at: 17.2, x: 280 },
  { fruit: 'banana3', at: 17.6, x: 110 },
  { fruit: 'apple3', at: 18.4, x: 97 },
  { fruit: 'apple2', at: 18, x: 160 },
  { fruit: 'orange2', at: 18, x: 370 },
  { fruit: 'pear2', at: 18.1, x: 270 },
  { fruit: 'apple3', at: 18.9, x: 410 },
  { fruit: 'pear1', at: 19.3, x: 240 },
  { fruit: 'banana3', at: 19.7, x: 400 },
  { fruit: 'orange1', at: 19.8, x: 94 },

  // repeats the first 10s' density/variety, shifted +20s, to fill the
  // newly-extended back third of the loop at the same pace as the rest
  { fruit: 'rottenApple1', at: 20, x: 155 },
  { fruit: 'rottenOrange2', at: 20, x: 300 },
  { fruit: 'apple2', at: 21, x: 420 },
  { fruit: 'pear2', at: 21.1, x: 110 },
  { fruit: 'banana1', at: 21.2, x: 210 },
  { fruit: 'orange1', at: 22, x: 410 },
  { fruit: 'pear1', at: 22.2, x: 220 },
  { fruit: 'rottenBanana2', at: 22.8, x: 420 },
  { fruit: 'apple3', at: 22.3, x: 320 },
  { fruit: 'banana2', at: 22.9, x: 110 },
  { fruit: 'rottenPear1', at: 23.3, x: 270 },
  { fruit: 'apple3', at: 24.1, x: 252 },
  { fruit: 'orange2', at: 24.2, x: 150 },
  { fruit: 'pear2', at: 24.2, x: 430 },
  { fruit: 'banana1', at: 24.3, x: 330 },
  { fruit: 'apple1', at: 25, x: 110 },
  { fruit: 'pear1', at: 25, x: 230 },
  { fruit: 'rottenOrange1', at: 25.2, x: 380 },
  { fruit: 'pear2', at: 25.7, x: 130 },
  { fruit: 'apple3', at: 26.2, x: 452 },
  { fruit: 'banana1', at: 25.9, x: 210 },
  { fruit: 'orange2', at: 26.4, x: 290 },
  { fruit: 'apple1', at: 26.7, x: 200 },
  { fruit: 'orange3', at: 27.2, x: 450 },
  { fruit: 'apple2', at: 26.7, x: 95 },
  { fruit: 'rottenApple2', at: 27, x: 370 },
  { fruit: 'orange1', at: 27.5, x: 145 },
  { fruit: 'rottenBanana2', at: 27.5, x: 270 },
  { fruit: 'apple3', at: 28.2, x: 210 },
  { fruit: 'banana2', at: 28.4, x: 110 },
  { fruit: 'banana3', at: 28.5, x: 400 },
  { fruit: 'pear2', at: 28.7, x: 320 },
  { fruit: 'pear1', at: 29.2, x: 210 },
  { fruit: 'apple3', at: 29.3, x: 95 },
  { fruit: 'rottenApple1', at: 29.6, x: 410 },
];

// how far into the box fruit falls before disappearing behind it, and how
// fast it falls — both relative to the box's own top edge (0). Same value
// for every drop, so the fall speed never varies.
const END_TOP = 80;
const FALL_SPEED = 40; // px/s

// a handful of extra drops, timed dynamically (below, once fallDuration is
// known) to be exactly halfway through their fall at the instant the loop
// restarts. Every SCHEDULE entry above eventually finishes falling and
// just rests behind the box until its next "at" comes around — without
// this, everything can end up resting at once right as the loop wraps,
// which reads as a stutter. These guarantee something is always visibly
// mid-fall right at the seam, regardless of screen size (which is what
// fallDuration depends on).
const SEAM_BRIDGE_FRUITS: { fruit: FruitKey; x: number }[] = [
  { fruit: 'apple3', x: 140 },
  { fruit: 'banana1', x: 300 },
  { fruit: 'orange1', x: 440 },
];

// ── Side-traveling fruit ─────────────────────────────────────────────────
// Spawns hidden behind the box, flush with one of its edges, then traces
// a right-angle trip with rounded turns — out, then down, then back — each
// leg SIDE_STEP px. Appears as soon as it clears the box's edge, and
// disappears again once the final leg brings it back behind the box. Each
// trip is its own fully independent, seamlessly-looping animation (same
// wrap-across-the-boundary trick as the drops above), so every entry
// completes on its own schedule — they don't all snap back at once just
// because the master loop restarts. Each line is one trip:
//   fruit — which image, from the FRUITS list above
//   at    — when it starts moving, in seconds into the loop (0-30)
//   y     — its vertical position when it starts (top of the path), in
//           pixels from the box's top edge (0-750 keeps the whole
//           250px-tall path inside the box)
//   side  — 'right' travels out past the box's right edge (right, down,
//           left); 'left' is the mirror image, out past the left edge
//           (left, down, right)
const SIDE_SPEED = 40; // px/s along the path
const SIDE_STEP = 250; // px traveled on each of the three legs
const SIDE_RADIUS = 40; // corner rounding at the two turns
// spaced 2s apart — keeps going at the same cadence across the full 30s
// loop (was only filled out to 18s, back when the loop was 20s)
const SIDE_SCHEDULE: { fruit: FruitKey; at: number; y: number; side: 'left' | 'right' }[] = [
  { fruit: 'rottenBanana1', at: 0, y: 100, side: 'right' },
  { fruit: 'apple2', at: 2, y: 100, side: 'right' },
  { fruit: 'orange1', at: 4, y: 100, side: 'right' },
  { fruit: 'apple1', at: 6, y: 100, side: 'right' },
  { fruit: 'apple3', at: 8, y: 100, side: 'right' },
  { fruit: 'orange2', at: 10, y: 100, side: 'right' },
  { fruit: 'apple3', at: 12, y: 100, side: 'right' },
  { fruit: 'pear2', at: 14, y: 100, side: 'right' },
  { fruit: 'rottenApple1', at: 16, y: 100, side: 'right' },
  { fruit: 'apple2', at: 18, y: 100, side: 'right' },
  { fruit: 'apple3', at: 20, y: 100, side: 'right' },
  { fruit: 'apple2', at: 22, y: 100, side: 'right' },
  { fruit: 'orange1', at: 24, y: 100, side: 'right' },
  { fruit: 'rottenOrange2', at: 26, y: 100, side: 'right' },
  { fruit: 'apple3', at: 28, y: 100, side: 'right' },

  { fruit: 'banana1', at: 0, y: 100 + SIDE_STEP, side: 'left' }, // spawns where the right trip ends
  { fruit: 'orange1', at: 2, y: 100 + SIDE_STEP, side: 'left' }, // spawns where the right trip ends
  { fruit: 'rottenApple2', at: 4, y: 100 + SIDE_STEP, side: 'left' }, // spawns where the right trip ends
  { fruit: 'banana2', at: 6, y: 100 + SIDE_STEP, side: 'left' }, // spawns where the right trip ends
  { fruit: 'apple3', at: 8, y: 100 + SIDE_STEP, side: 'left' }, // spawns where the right trip ends
  { fruit: 'pear2', at: 10, y: 100 + SIDE_STEP, side: 'left' }, // spawns where the right trip ends
  { fruit: 'apple1', at: 12, y: 100 + SIDE_STEP, side: 'left' }, // spawns where the right trip ends
  { fruit: 'rottenOrange1', at: 14, y: 100 + SIDE_STEP, side: 'left' }, // spawns where the right trip ends
  { fruit: 'apple3', at: 16, y: 100 + SIDE_STEP, side: 'left' }, // spawns where the right trip ends
  { fruit: 'apple2', at: 18, y: 100 + SIDE_STEP, side: 'left' }, // spawns where the right trip ends
  { fruit: 'pear1', at: 20, y: 100 + SIDE_STEP, side: 'left' }, // spawns where the right trip ends
  { fruit: 'orange1', at: 22, y: 100 + SIDE_STEP, side: 'left' }, // spawns where the right trip ends
  { fruit: 'rottenBanana2', at: 24, y: 100 + SIDE_STEP, side: 'left' }, // spawns where the right trip ends
  { fruit: 'banana2', at: 26, y: 100 + SIDE_STEP, side: 'left' }, // spawns where the right trip ends
  { fruit: 'apple3', at: 28, y: 100 + SIDE_STEP, side: 'left' }, // spawns where the right trip ends
];

// ── Rotten fruit → trash ────────────────────────────────────────────────
// A straight horizontal trip from behind the box, past the trash icon
// (z-order beneath it), and across the fading rectangle (z-order above
// it) until it disappears into the fade. Only rotten fruit spawns here.
const TRASH_SPEED = 40; // px/s
const TRASH_Y_CENTER = 835; // vertical center of both the trash icon and the rectangle
const TRASH_FADE_LENGTH = 100; // px of travel, at the end, over which it fades out
const TRASH_FADE_IN_LENGTH = 10; // px of travel, at the start, over which it fades in
// spawns every 2s, cycling through all 8 rotten-fruit variants
const TRASH_SCHEDULE: { fruit: FruitKey; at: number }[] = [
  { fruit: 'rottenApple1', at: 0 },
  { fruit: 'rottenApple2', at: 2 },
  { fruit: 'rottenBanana1', at: 4 },
  { fruit: 'rottenBanana2', at: 6 },
  { fruit: 'rottenOrange1', at: 8 },
  { fruit: 'rottenOrange2', at: 10 },
  { fruit: 'rottenPear1', at: 12 },
  { fruit: 'rottenPear2', at: 14 },
  { fruit: 'rottenApple1', at: 16 },
  { fruit: 'rottenApple2', at: 18 },
  { fruit: 'rottenBanana1', at: 20 },
  { fruit: 'rottenBanana2', at: 22 },
  { fruit: 'rottenOrange1', at: 24 },
  { fruit: 'rottenOrange2', at: 26 },
  { fruit: 'rottenPear1', at: 28 },
];

// ── Fruit → approved rectangles ─────────────────────────────────────────
// Vertical mirror of the trash trip above: straight down from behind the
// box, past the "approved" icon (z-order beneath it), and down the first
// rectangle (z-order above it) until it disappears into the fade.
const APPROVE_SPEED = 40; // px/s
const APPROVE_RECT_WIDTH = 90;
const APPROVE_RECT_GAP = 20;
const APPROVE_RECT_COUNT = 4;
const APPROVE_GROUP_WIDTH = APPROVE_RECT_COUNT * APPROVE_RECT_WIDTH + (APPROVE_RECT_COUNT - 1) * APPROVE_RECT_GAP;
const APPROVE_FADE_LENGTH = 100; // px of travel, at the end, over which it fades out
const APPROVE_FADE_IN_LENGTH = 10; // px of travel, at the start, over which it fades in
// rectangle 0 (leftmost) — spawns every 2s, cycling through the 3 apple
// variants. Rectangle 1 (second from left) — same cadence, bananas only.
// Rectangle 2 (third from left) — same cadence, oranges only. Rectangle 3
// (rightmost) — same cadence, alternating the 2 pear variants.
const APPROVE_SCHEDULE: { fruit: FruitKey; at: number; rectIndex: number }[] = [
  { fruit: 'apple1', at: 0, rectIndex: 0 },
  { fruit: 'apple2', at: 2, rectIndex: 0 },
  { fruit: 'apple3', at: 4, rectIndex: 0 },
  { fruit: 'apple1', at: 6, rectIndex: 0 },
  { fruit: 'apple2', at: 8, rectIndex: 0 },
  { fruit: 'apple3', at: 10, rectIndex: 0 },
  { fruit: 'apple1', at: 12, rectIndex: 0 },
  { fruit: 'apple2', at: 14, rectIndex: 0 },
  { fruit: 'apple3', at: 16, rectIndex: 0 },
  { fruit: 'apple1', at: 18, rectIndex: 0 },
  { fruit: 'apple2', at: 20, rectIndex: 0 },
  { fruit: 'apple3', at: 22, rectIndex: 0 },
  { fruit: 'apple1', at: 24, rectIndex: 0 },
  { fruit: 'apple2', at: 26, rectIndex: 0 },
  { fruit: 'apple3', at: 28, rectIndex: 0 },

  { fruit: 'banana1', at: 0, rectIndex: 1 },
  { fruit: 'banana2', at: 2, rectIndex: 1 },
  { fruit: 'banana3', at: 4, rectIndex: 1 },
  { fruit: 'banana1', at: 6, rectIndex: 1 },
  { fruit: 'banana2', at: 8, rectIndex: 1 },
  { fruit: 'banana3', at: 10, rectIndex: 1 },
  { fruit: 'banana1', at: 12, rectIndex: 1 },
  { fruit: 'banana2', at: 14, rectIndex: 1 },
  { fruit: 'banana3', at: 16, rectIndex: 1 },
  { fruit: 'banana1', at: 18, rectIndex: 1 },
  { fruit: 'banana2', at: 20, rectIndex: 1 },
  { fruit: 'banana3', at: 22, rectIndex: 1 },
  { fruit: 'banana1', at: 24, rectIndex: 1 },
  { fruit: 'banana2', at: 26, rectIndex: 1 },
  { fruit: 'banana3', at: 28, rectIndex: 1 },

  { fruit: 'orange1', at: 0, rectIndex: 2 },
  { fruit: 'orange2', at: 2, rectIndex: 2 },
  { fruit: 'orange3', at: 4, rectIndex: 2 },
  { fruit: 'orange1', at: 6, rectIndex: 2 },
  { fruit: 'orange2', at: 8, rectIndex: 2 },
  { fruit: 'orange3', at: 10, rectIndex: 2 },
  { fruit: 'orange1', at: 12, rectIndex: 2 },
  { fruit: 'orange2', at: 14, rectIndex: 2 },
  { fruit: 'orange3', at: 16, rectIndex: 2 },
  { fruit: 'orange1', at: 18, rectIndex: 2 },
  { fruit: 'orange2', at: 20, rectIndex: 2 },
  { fruit: 'orange3', at: 22, rectIndex: 2 },
  { fruit: 'orange1', at: 24, rectIndex: 2 },
  { fruit: 'orange2', at: 26, rectIndex: 2 },
  { fruit: 'orange3', at: 28, rectIndex: 2 },

  { fruit: 'pear1', at: 0, rectIndex: 3 },
  { fruit: 'pear2', at: 2, rectIndex: 3 },
  { fruit: 'pear1', at: 4, rectIndex: 3 },
  { fruit: 'pear2', at: 6, rectIndex: 3 },
  { fruit: 'pear1', at: 8, rectIndex: 3 },
  { fruit: 'pear2', at: 10, rectIndex: 3 },
  { fruit: 'pear1', at: 12, rectIndex: 3 },
  { fruit: 'pear2', at: 14, rectIndex: 3 },
  { fruit: 'pear1', at: 16, rectIndex: 3 },
  { fruit: 'pear2', at: 18, rectIndex: 3 },
  { fruit: 'pear1', at: 20, rectIndex: 3 },
  { fruit: 'pear2', at: 22, rectIndex: 3 },
  { fruit: 'pear1', at: 24, rectIndex: 3 },
  { fruit: 'pear2', at: 26, rectIndex: 3 },
  { fruit: 'pear1', at: 28, rectIndex: 3 },
];

// traces the out/down/back path described above, starting at distance 0
// (flush with the box's edge) and ending at distance `total` (back at the
// same edge). `dir` is +1 for a rightward trip (out past the right edge)
// or -1 for the mirrored leftward trip (out past the left edge) — it just
// flips the sign on every horizontal offset, so the vertical (down) leg
// and the corner curves stay identical either way. Distances outside
// [0, total] clamp to the nearest end — this is a one-shot trip, not a
// loop, so it doesn't wrap like roundedRectPath would.
function sidePath(startX: number, startY: number, step: number, radius: number, dir: 1 | -1) {
  const far = startX + dir * step; // x of the vertical (down) leg
  const bottom = startY + step;
  const r = Math.max(0, Math.min(radius, step / 2));
  const legLen = step - r; // length of the outward and return straights
  const midLegLen = step - 2 * r; // length of the vertical straight
  const arcLen = (Math.PI * r) / 2;
  const total = legLen + arcLen + midLegLen + arcLen + legLen;

  function pointAt(distance: number) {
    let d = Math.max(0, Math.min(distance, total));

    if (d <= legLen) return { x: startX + dir * d, y: startY }; // outward
    d -= legLen;

    if (d <= arcLen) {
      // outward curving to ↓
      const angle = -Math.PI / 2 + (d / arcLen) * (Math.PI / 2);
      const center = { x: startX + dir * legLen, y: startY + r };
      return { x: center.x + dir * r * Math.cos(angle), y: center.y + r * Math.sin(angle) };
    }
    d -= arcLen;

    if (d <= midLegLen) return { x: far, y: startY + r + d }; // down ↓
    d -= midLegLen;

    if (d <= arcLen) {
      // ↓ curving to the return leg
      const angle = (d / arcLen) * (Math.PI / 2);
      const center = { x: far - dir * r, y: bottom - r };
      return { x: center.x + dir * r * Math.cos(angle), y: center.y + r * Math.sin(angle) };
    }
    d -= arcLen;

    return { x: far - dir * (r + d), y: bottom }; // return leg
  }

  return { total, pointAt };
}

// a plain straight-line path, same { total, pointAt } shape as sidePath
// above, so it can be fed into buildSideKeyframe's wraparound logic (used
// for the horizontal trash-bound trip, which has no corners to round)
function straightPath(startX: number, y: number, distance: number) {
  return {
    total: distance,
    pointAt: (d: number) => ({ x: startX + Math.max(0, Math.min(d, distance)), y }),
  };
}

// same idea as straightPath, but traveling straight down instead of
// sideways — used for the vertical version below the box
function verticalPath(x: number, startY: number, distance: number) {
  return {
    total: distance,
    pointAt: (d: number) => ({ x, y: startY + Math.max(0, Math.min(d, distance)) }),
  };
}

// samples the trip at even time (= even arc-length, since speed is
// constant) steps between `at` and `at + duration`, so the corners curve
// instead of cutting straight across. Outside that window it just holds
// at whichever end of the path is relevant — hidden behind the box both
// before the trip starts and after it finishes. Each trip is its own
// fully independent, seamlessly-looping animation — exactly like each
// drop above — so with many entries sharing the same `at` spacing, they
// each still complete (and disappear) on their own schedule instead of
// all snapping back at once when the loop restarts.
function buildSideKeyframe(
  i: number,
  at: number,
  path: { total: number; pointAt: (d: number) => { x: number; y: number } },
  duration: number,
  name: string = 'fruit-side',
) {
  const STEPS = 60;
  const rest0 = path.pointAt(0);
  const restEnd = path.pointAt(path.total);
  const rawEnd = at + duration;
  const startPercent = (at / ANIMATION_DURATION) * 100;

  function stop(percent: number, pt: { x: number; y: number }) {
    return `${percent}% { transform: translate(${pt.x}px, ${pt.y}px); }`;
  }

  if (rawEnd <= ANIMATION_DURATION) {
    const endPercent = (rawEnd / ANIMATION_DURATION) * 100;
    const stops = [stop(0, rest0), stop(startPercent, rest0)];
    for (let s = 1; s < STEPS; s++) {
      const t = s / STEPS;
      const percent = startPercent + t * (endPercent - startPercent);
      stops.push(stop(percent, path.pointAt(t * path.total)));
    }
    stops.push(stop(endPercent, restEnd), stop(100, restEnd));
    return `@keyframes ${name}-${i} {\n${stops.join('\n')}\n}`;
  }

  // wraps across the loop boundary, same tail/head split as buildKeyframe:
  // the tail of an already-in-progress trip plays out first (0% to
  // overflowPercent%), then it rests at restEnd until startPercent%, then
  // jumps back to rest0 and the next trip begins, ending back at the same
  // wrap point at 100% so it lines up exactly with 0%
  const wrapFraction = (ANIMATION_DURATION - at) / duration;
  const wrapDistance = wrapFraction * path.total;
  const wrapPoint = path.pointAt(wrapDistance);
  const overflowPercent = ((rawEnd - ANIMATION_DURATION) / ANIMATION_DURATION) * 100;

  const stops = [stop(0, wrapPoint)];
  for (let s = 1; s < STEPS; s++) {
    const t = s / STEPS;
    const percent = t * overflowPercent;
    const pt = path.pointAt(wrapDistance + t * (path.total - wrapDistance));
    stops.push(stop(percent, pt));
  }
  stops.push(stop(overflowPercent, restEnd));
  stops.push(stop(startPercent, restEnd));
  // instant jump back to the start of the path — a tiny +0.01% offset
  // (same trick as buildKeyframe) instead of letting the sampling loop's
  // first step smear the jump across 1/60th of the remaining timeline,
  // which was rendering as a fast but visible glide from end to start
  stops.push(stop(startPercent + 0.01, rest0));
  for (let s = 1; s < STEPS; s++) {
    const t = s / STEPS;
    const percent = startPercent + 0.01 + t * (100 - startPercent - 0.01);
    stops.push(stop(percent, path.pointAt(t * wrapDistance)));
  }
  stops.push(stop(100, wrapPoint));

  return `@keyframes ${name}-${i} {\n${stops.join('\n')}\n}`;
}

// same wraparound trick as buildSideKeyframe, but for a straight path plus
// an opacity fade-in over the first `fadeInLength` px and a fade-out over
// the last `fadeLength` px of travel — used for the rotten fruit easing
// into view as it emerges, then fading away as it disappears into the
// trash rectangle
function buildTrashKeyframe(
  i: number,
  at: number,
  path: { total: number; pointAt: (d: number) => { x: number; y: number } },
  duration: number,
  fadeLength: number,
  fadeInLength: number,
  name: string = 'fruit-trash',
) {
  const STEPS = 60;
  const rest0 = path.pointAt(0);
  const restEnd = path.pointAt(path.total);
  const rawEnd = at + duration;
  const startPercent = (at / ANIMATION_DURATION) * 100;
  const fadeStart = path.total - fadeLength;

  function opacityAt(d: number) {
    if (d < fadeInLength) return Math.max(0, d / fadeInLength);
    if (d <= fadeStart) return 1;
    return 1 - Math.min(1, Math.max(0, (d - fadeStart) / fadeLength));
  }

  function stop(percent: number, pt: { x: number; y: number }, opacity: number) {
    return `${percent}% { transform: translate(${pt.x}px, ${pt.y}px); opacity: ${opacity}; }`;
  }

  if (rawEnd <= ANIMATION_DURATION) {
    const endPercent = (rawEnd / ANIMATION_DURATION) * 100;
    const stops = [stop(0, rest0, opacityAt(0)), stop(startPercent, rest0, opacityAt(0))];
    for (let s = 1; s < STEPS; s++) {
      const t = s / STEPS;
      const percent = startPercent + t * (endPercent - startPercent);
      const d = t * path.total;
      stops.push(stop(percent, path.pointAt(d), opacityAt(d)));
    }
    stops.push(
      stop(endPercent, restEnd, opacityAt(path.total)),
      stop(100, restEnd, opacityAt(path.total)),
    );
    return `@keyframes ${name}-${i} {\n${stops.join('\n')}\n}`;
  }

  const wrapFraction = (ANIMATION_DURATION - at) / duration;
  const wrapDistance = wrapFraction * path.total;
  const wrapPoint = path.pointAt(wrapDistance);
  const overflowPercent = ((rawEnd - ANIMATION_DURATION) / ANIMATION_DURATION) * 100;

  const stops = [stop(0, wrapPoint, opacityAt(wrapDistance))];
  for (let s = 1; s < STEPS; s++) {
    const t = s / STEPS;
    const percent = t * overflowPercent;
    const d = wrapDistance + t * (path.total - wrapDistance);
    stops.push(stop(percent, path.pointAt(d), opacityAt(d)));
  }
  stops.push(stop(overflowPercent, restEnd, opacityAt(path.total)));
  stops.push(stop(startPercent, restEnd, opacityAt(path.total)));
  // instant jump back to the start of the path — a tiny +0.01% offset
  // (same trick as buildKeyframe) instead of letting the sampling loop's
  // first step smear the jump across 1/60th of the remaining timeline,
  // which was rendering as a fast but visible glide from end to start
  stops.push(stop(startPercent + 0.01, rest0, opacityAt(0)));
  for (let s = 1; s < STEPS; s++) {
    const t = s / STEPS;
    const percent = startPercent + 0.01 + t * (100 - startPercent - 0.01);
    const d = t * wrapDistance;
    stops.push(stop(percent, path.pointAt(d), opacityAt(d)));
  }
  stops.push(stop(100, wrapPoint, opacityAt(wrapDistance)));

  return `@keyframes ${name}-${i} {\n${stops.join('\n')}\n}`;
}

// ── Timing guide lines ──────────────────────────────────────────────────
// A horizontal line, falling at the exact same speed as the fruit, spawns
// every GUIDE_INTERVAL seconds with its "at" number written next to it —
// a ruler for lining up new SCHEDULE entries. Toggle-able on-screen via the
// button in the box (below), so this is just the starting state.
const SHOW_TIME_GUIDES_DEFAULT = false;
const GUIDE_INTERVAL = 2;
const GUIDE_TIMES = Array.from(
  { length: Math.ceil(ANIMATION_DURATION / GUIDE_INTERVAL) },
  (_, i) => i * GUIDE_INTERVAL,
);

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function FruitSorting() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [startTop, setStartTop] = useState(-1400);
  // box's rendered width, used to anchor the side-traveling fruit's path
  // to the box's actual right edge
  const [wrapperWidth, setWrapperWidth] = useState(628);
  // box's rendered height — the wrapper's height always equals the box's,
  // since the box is the only normal-flow child — used to anchor the
  // approved-fruit path to the box's actual bottom edge
  const [wrapperHeight, setWrapperHeight] = useState(900);

  // starts the page scrolled 200px down instead of at the very top —
  // overrides App.tsx's scrollTo(0, 0) on route change, which runs first
  useLayoutEffect(() => {
    window.scrollTo(0, 150);
  }, []);

  // controls both the timing guide lines and the loop-time badge, via the
  // toggle button in the box
  const [showGuides, setShowGuides] = useState(SHOW_TIME_GUIDES_DEFAULT);
  // freezes every fall in place so it can be scrubbed frame-by-frame with
  // the slider instead of watching it loop in real time — much easier to
  // eyeball overlaps and spacing while cleaning up the schedule
  const [scrubMode, setScrubMode] = useState(false);
  const [scrubTime, setScrubTime] = useState(0);
  // kept in sync with scrubMode on every render so the rAF loop below
  // (which only runs once, on mount) always sees the latest value
  const scrubModeRef = useRef(scrubMode);
  scrubModeRef.current = scrubMode;
  // one random start/end rotation per drop, generated once per page load.
  // spin amount (degrees turned over the whole fall) is randomized between
  // MIN_SPIN and MAX_SPIN, in a random direction — the floor keeps every
  // fruit turning at a noticeable rate instead of some barely rotating.
  // covers SCHEDULE plus the seam-bridge fruit appended after it below,
  // so every rendered drop (scheduled or seam-bridge) has one
  const [rotations] = useState(() =>
    Array.from({ length: SCHEDULE.length + SEAM_BRIDGE_FRUITS.length }, () => {
      const MIN_SPIN = 180;
      const MAX_SPIN = 360;
      const start = Math.random() * 360;
      const spin = MIN_SPIN + Math.random() * (MAX_SPIN - MIN_SPIN);
      const direction = Math.random() < 0.5 ? -1 : 1;
      return { start, end: start + spin * direction };
    }),
  );

  // live readout of where we are in the loop, so it's easy to see which
  // second to use for a new SCHEDULE entry
  const loopStartRef = useRef(performance.now());
  const [loopTime, setLoopTime] = useState(0);
  useLayoutEffect(() => {
    let raf: number;
    function tick() {
      // while scrubbing, the slider drives loopTime instead of the clock
      if (!scrubModeRef.current) {
        const elapsed = (performance.now() - loopStartRef.current) / 1000;
        setLoopTime(elapsed % ANIMATION_DURATION);
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // spawn point sits above the viewport, not just above the box — measured
  // from the wrapper so it works at any screen height
  useLayoutEffect(() => {
    function measure() {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      // anchor to the document, not the viewport, so the spawn point stays
      // hidden above the page regardless of scroll position at mount/measure
      // time (rect.top alone is only viewport-relative)
      const docTop = rect.top + window.scrollY;
      setStartTop(-(docTop + 150));
      setWrapperWidth(rect.width);
      setWrapperHeight(rect.height);
    }
    measure();
    window.addEventListener('resize', measure);
    // the box's height isn't stable at mount — the two content images
    // (humbleCoding/humblePrototype) have no explicit height, so they
    // report 0 until they finish loading, which happens asynchronously
    // after this layout effect already ran. That left wrapperHeight
    // permanently too small, which put the approve-fruit's whole path
    // inside the box's real footprint (hidden behind its z-10 background
    // for its entire trip) instead of below it. A ResizeObserver re-measures
    // whenever the box's actual rendered size changes, for any reason —
    // image load, font load, content change, or window resize.
    const observer = new ResizeObserver(measure);
    observer.observe(wrapperRef.current!);
    return () => {
      window.removeEventListener('resize', measure);
      observer.disconnect();
    };
  }, []);

  const fallDuration = (Math.abs(startTop) + END_TOP) / FALL_SPEED;

  // seam-bridge fruit spawn at whatever "at" puts them exactly halfway
  // through their fall right as the loop restarts — recalculated from
  // fallDuration so it stays correct at any screen size, instead of a
  // fixed "at" that only works for one particular fallDuration.
  const seamAt = ANIMATION_DURATION - fallDuration / 2;
  const allDrops = [
    ...SCHEDULE,
    ...SEAM_BRIDGE_FRUITS.map((f) => ({ fruit: f.fruit, at: seamAt, x: f.x })),
  ];

  // builds one drop's @keyframes so it always falls for exactly
  // `fallDuration` seconds at the same speed, even if "at" is late enough
  // that the fall would otherwise run past the end of the loop — in that
  // case the fall just continues seamlessly into the start of the next
  // iteration instead of getting rushed to fit.
  function buildKeyframe(i: number, at: number, rotStart: number, rotEnd: number) {
    const rawEnd = at + fallDuration;
    const startPercent = (at / ANIMATION_DURATION) * 100;

    if (rawEnd <= ANIMATION_DURATION) {
      const endPercent = (rawEnd / ANIMATION_DURATION) * 100;
      return `
        @keyframes fruit-drop-${i} {
          0% { transform: translateY(${startTop}px) rotate(${rotStart}deg); }
          ${startPercent}% { transform: translateY(${startTop}px) rotate(${rotStart}deg); }
          ${endPercent}% { transform: translateY(${END_TOP}px) rotate(${rotEnd}deg); }
          100% { transform: translateY(${END_TOP}px) rotate(${rotEnd}deg); }
        }
      `;
    }

    // falls across the loop boundary — split into the tail end of this
    // iteration and the start of the next one, meeting at the same point,
    // so the fall still takes exactly fallDuration seconds
    const wrapFraction = (ANIMATION_DURATION - at) / fallDuration;
    const wrapTop = lerp(startTop, END_TOP, wrapFraction);
    const wrapRot = lerp(rotStart, rotEnd, wrapFraction);
    const overflowPercent = ((rawEnd - ANIMATION_DURATION) / ANIMATION_DURATION) * 100;

    return `
      @keyframes fruit-drop-${i} {
        0% { transform: translateY(${wrapTop}px) rotate(${wrapRot}deg); }
        ${overflowPercent}% { transform: translateY(${END_TOP}px) rotate(${rotEnd}deg); }
        ${startPercent}% { transform: translateY(${END_TOP}px) rotate(${rotEnd}deg); }
        ${startPercent + 0.01}% { transform: translateY(${startTop}px) rotate(${rotStart}deg); }
        100% { transform: translateY(${wrapTop}px) rotate(${wrapRot}deg); }
      }
    `;
  }

  // same falling motion as buildKeyframe, minus the rotation, plus an
  // opacity fade so the line and its number are only ever visible while
  // actually mid-fall — fading out rather than relying on z-index alone
  // means it can't ever be seen peeking through the box
  function buildGuideKeyframe(at: number) {
    const rawEnd = at + fallDuration;
    const startPercent = (at / ANIMATION_DURATION) * 100;

    if (rawEnd <= ANIMATION_DURATION) {
      const endPercent = (rawEnd / ANIMATION_DURATION) * 100;
      return `
        @keyframes guide-line-${at} {
          0% { transform: translateY(${startTop}px); opacity: 0; }
          ${startPercent}% { transform: translateY(${startTop}px); opacity: 1; }
          ${endPercent}% { transform: translateY(${END_TOP}px); opacity: 1; }
          ${endPercent + 0.01}% { transform: translateY(${END_TOP}px); opacity: 0; }
          100% { transform: translateY(${END_TOP}px); opacity: 0; }
        }
      `;
    }

    const wrapFraction = (ANIMATION_DURATION - at) / fallDuration;
    const wrapTop = lerp(startTop, END_TOP, wrapFraction);
    const overflowPercent = ((rawEnd - ANIMATION_DURATION) / ANIMATION_DURATION) * 100;

    return `
      @keyframes guide-line-${at} {
        0% { transform: translateY(${wrapTop}px); opacity: 1; }
        ${overflowPercent}% { transform: translateY(${END_TOP}px); opacity: 1; }
        ${overflowPercent + 0.01}% { transform: translateY(${END_TOP}px); opacity: 0; }
        ${startPercent}% { transform: translateY(${END_TOP}px); opacity: 0; }
        ${startPercent + 0.01}% { transform: translateY(${startTop}px); opacity: 1; }
        100% { transform: translateY(${wrapTop}px); opacity: 1; }
      }
    `;
  }

  // runs a callback over every element inside the wrapper that currently
  // has a running CSS animation — i.e. every fruit img and guide line
  function forEachAnimatedEl(cb: (el: HTMLElement) => void) {
    const root = wrapperRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>('*').forEach((el) => {
      if (el.getAnimations().length > 0) cb(el);
    });
  }

  // moves every fall to the same point in time, in lockstep — called both
  // by dragging the slider and by entering/leaving scrub mode
  function scrubTo(t: number) {
    setScrubTime(t);
    setLoopTime(t);
    forEachAnimatedEl((el) => {
      el.getAnimations().forEach((a) => {
        a.currentTime = t * 1000;
      });
    });
  }

  function toggleScrub() {
    if (!scrubMode) {
      // entering: pause every fall exactly where it is right now
      forEachAnimatedEl((el) => {
        el.getAnimations().forEach((a) => a.pause());
      });
      setScrubTime(loopTime);
      setScrubMode(true);
    } else {
      // leaving: resume playback, resyncing the live clock so it picks up
      // from wherever the slider was left rather than jumping
      forEachAnimatedEl((el) => {
        el.getAnimations().forEach((a) => a.play());
      });
      loopStartRef.current = performance.now() - scrubTime * 1000;
      setScrubMode(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#15181D] text-white flex flex-col">
      {/* loop counter — shows where the animation currently is, in seconds,
          so it's easy to line up a new SCHEDULE entry's "at" value */}
      {showGuides && (
        <div
          className="fixed top-3 left-3 z-50 rounded-md px-2.5 py-1 font-mono text-xs text-white/70"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {loopTime.toFixed(1)}s / {ANIMATION_DURATION}s
        </div>
      )}

      {/* guides toggles the timing guide lines + loop-time badge.
          scrub freezes every fall in place and hands control to the
          slider below, so the whole loop can be stepped through
          frame-by-frame to spot and fix overlaps. Fixed to the viewport,
          not the box, so it's always reachable regardless of scroll. */}
      <div className="fixed top-3 right-3 z-50 flex flex-col items-end gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={toggleScrub}
            className="rounded-md px-2.5 py-1 font-mono text-xs text-white/70 hover:text-white transition-colors"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            scrub: {scrubMode ? 'on' : 'off'}
          </button>
          <button
            type="button"
            onClick={() => setShowGuides((v) => !v)}
            className="rounded-md px-2.5 py-1 font-mono text-xs text-white/70 hover:text-white transition-colors"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            guides: {showGuides ? 'on' : 'off'}
          </button>
        </div>
        {scrubMode && (
          <input
            type="range"
            min={0}
            max={ANIMATION_DURATION}
            step={0.05}
            value={scrubTime}
            onChange={(e) => scrubTo(parseFloat(e.target.value))}
            className="w-64"
          />
        )}
      </div>

      <div className="max-w-xl w-full mx-auto px-6 pt-10 pb-10 flex flex-col flex-1">
        {/* wraps the box exactly, so fruit positioned inside it lines up
            with the box's own edges and disappears cleanly behind it */}
        <div
          ref={wrapperRef}
          className="relative"
          style={{ marginTop: 280, width: 'calc(100% + 100px)', marginLeft: -50 }}
        >
          {/* backdrop behind every fruit — centered on the box's edge, so
              half of each square sits behind the box (hidden, lower
              z-index) and the other half reaches out past it, visible.
              Vertically centered on the box's own height (1000px). Uses
              the same z-0-below-the-box's-z-10 approach as the fruit
              itself, rather than a negative z-index, so it can't end up
              stacking outside the component's own context. */}
          <div
            className="absolute z-0"
            style={{
              left: wrapperWidth - 255,
              top: 100,
              width: 510,
              height: 340,
              borderRadius: 90,
              backgroundColor: '#36434D',
            }}
          />
          <div
            className="absolute z-0"
            style={{
              left: wrapperWidth - 255,
              top: 190,
              width: 420,
              height: 160,
              borderRadius:4,
              backgroundColor: '#15181D',
            }}
          />
          <div
            className="absolute z-0"
            style={{
              left: -255,
              top: 350,
              width: 400,
              height: 340,
              borderRadius:94,
              backgroundColor: '#36434D',
            }}
          />
          <div
            className="absolute z-0"
            style={{
              left: -165,
              top: 440,
              width: 350,
              height: 160,
              borderRadius:4,
              backgroundColor: '#15181D',
            }}
          />

          {/* rectangle next to the trash icon — flush against its right
              edge, vertically centered on it (svg spans top:740 to 930,
              center 835, minus half this rectangle's height). Solid for
              its first 200px, then fades into the page background
              (#15181D) over the last 100px. Rendered before the trash
              fruit trip and the trash icon itself, so — at this shared
              z-0 tier — DOM order puts it underneath both */}
          <div
            className="absolute z-0"
            style={{
              left: wrapperWidth + 50,
              top: 790,
              width: 300,
              height: 90,
              background: 'linear-gradient(to right, #36434D 0%, #36434D 66.6667%, #15181D 100%)',
            }}
          />

          {/* rotten fruit traveling from behind the box, past the trash
              icon (rendered after this, so it stacks on top), across the
              rectangle (rendered before this, so this stacks on top of
              it), disappearing into the fade */}
          <style>
            {TRASH_SCHEDULE.map((trip, i) => {
              const fruit = FRUITS[trip.fruit];
              const startX = wrapperWidth - fruit.size;
              const distance = 350;
              const path = straightPath(startX, TRASH_Y_CENTER - fruit.size / 2, distance);
              const duration = distance / TRASH_SPEED;
              return buildTrashKeyframe(i, trip.at, path, duration, TRASH_FADE_LENGTH, TRASH_FADE_IN_LENGTH);
            }).join('\n')}
          </style>

          {TRASH_SCHEDULE.map((trip, i) => {
            const fruit = FRUITS[trip.fruit];
            return (
              <img
                key={`trash-${i}`}
                src={fruit.src}
                alt=""
                className="absolute z-0 top-0 left-0 pointer-events-none select-none"
                style={{
                  width: fruit.size,
                  height: fruit.size,
                  animationName: `fruit-trash-${i}`,
                  animationDuration: `${ANIMATION_DURATION}s`,
                  animationTimingFunction: 'linear',
                  animationIterationCount: 'infinite',
                }}
              />
            );
          })}

          {/* trash icon — flush against the box's right edge, extending
              outward (the box itself spans the full wrapper width, so this
              has to start AT wrapperWidth, not before it, or it renders
              underneath the box's z-10 background and disappears). 300px
              below the right-side animation's backdrop rectangle (which
              ends at top:100 + height:340 = 440). Rendered after the
              rectangle and the trash fruit trip, so it stacks on top of
              both */}
          <img
            src={trash}
            alt=""
            className="absolute z-0 pointer-events-none select-none"
            style={{
              left: wrapperWidth,
              top: 740,
              width: 50,
              height: 190,
            }}
          />

          <style>
            {allDrops.map((drop, i) =>
              buildKeyframe(i, drop.at, rotations[i].start, rotations[i].end),
            ).join('\n')}
          </style>

          {allDrops.map((drop, i) => {
            const fruit = FRUITS[drop.fruit];
            return (
              <img
                key={i}
                src={fruit.src}
                alt=""
                className="absolute z-0 top-0 pointer-events-none select-none"
                style={{
                  left: drop.x,
                  width: fruit.size,
                  height: fruit.size,
                  animationName: `fruit-drop-${i}`,
                  animationDuration: `${ANIMATION_DURATION}s`,
                  animationTimingFunction: 'linear',
                  animationIterationCount: 'infinite',
                }}
              />
            );
          })}

          <style>
            {SIDE_SCHEDULE.map((trip, i) => {
              const fruit = FRUITS[trip.fruit];
              const dir = trip.side === 'right' ? 1 : -1;
              const startX = trip.side === 'right' ? wrapperWidth - fruit.size : 0;
              const path = sidePath(startX, trip.y, SIDE_STEP, SIDE_RADIUS, dir);
              const duration = path.total / SIDE_SPEED;
              return buildSideKeyframe(i, trip.at, path, duration);
            }).join('\n')}
          </style>

          {SIDE_SCHEDULE.map((trip, i) => {
            const fruit = FRUITS[trip.fruit];
            return (
              <img
                key={`side-${i}`}
                src={fruit.src}
                alt=""
                className="absolute z-0 top-0 left-0 pointer-events-none select-none"
                style={{
                  width: fruit.size,
                  height: fruit.size,
                  animationName: `fruit-side-${i}`,
                  animationDuration: `${ANIMATION_DURATION}s`,
                  animationTimingFunction: 'linear',
                  animationIterationCount: 'infinite',
                }}
              />
            );
          })}

          {showGuides && (
            <>
              <style>{GUIDE_TIMES.map((t) => buildGuideKeyframe(t)).join('\n')}</style>
              {GUIDE_TIMES.map((t) => (
                <div
                  key={t}
                  className="absolute z-0 top-0 left-0 w-full pointer-events-none"
                  style={{
                    height: 0,
                    animationName: `guide-line-${t}`,
                    animationDuration: `${ANIMATION_DURATION}s`,
                    animationTimingFunction: 'linear',
                    animationIterationCount: 'infinite',
                  }}
                >
                  <div className="w-full h-px bg-white/30" />
                  <span
                    className="absolute font-mono text-[10px] text-white/50"
                    style={{ left: -28, top: -6 }}
                  >
                    {t}
                  </span>
                </div>
              ))}
            </>
          )}

          <div
            className="relative z-10 min-h-[700px] rounded-xl p-6"
            style={{
              backgroundColor: '#1E2126',
              border: '1px solid rgba(255,255,255,0.04)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            {/* half the text block's 72px margin (36px) on left/top */}
            <a
              href="#"
              className="absolute top-9 left-9 z-40 text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              ← Back
            </a>

            {/* half the text block's 72px margin (36px) on right/top */}
            <div className="absolute top-9 right-9 z-40 flex gap-2">
              <img src={dtuLogo} alt="DTU" className="w-[40px] h-[40px] rounded-full" />
              <img src={humbleLogo} alt="Humble" className="w-[40px] h-[40px] rounded-full" />
              <img src={legoLogo} alt="LEGO" className="w-[40px] h-[40px] rounded-full" />
            </div>

            {/* sits on top of the box and the fruit — highest z-index on
                the page — straddling the box's top edge like a spout */}
            <img
              src={tube}
              alt=""
              className="absolute z-30 pointer-events-none select-none"
              style={{ top: -100, left: '50%', transform: 'translateX(-50%)', width: 500 }}
            />



            <div className="relative pt-24 px-12 pb-12">
              <h2 className="text-xl font-semibold mb-1">
                Automated Fruit Sorting — Master's Thesis
              </h2>
              <p className="text-sm text-white/50 mb-6">
                A collaboration between Humble, LEGO, and DTU
              </p>
              <div className="space-y-4 text-sm text-white/70 leading-relaxed">
                <p>
                  For my master's thesis, I worked with the Icelandic food-waste company Humble,
                  LEGO, and DTU to explore whether fruit sorting could be automated. Humble's
                  business includes fine-grained sorting of fruit that has been deemed too
                  low-quality to sell in stores — a process that was, at the time, done entirely
                  by hand. Our goal was to build an MVP that tested whether computer vision could
                  take on part of that work.
                </p>
                <p>
                  On the software side, I developed a custom visual AI model to distinguish good
                  fruit from bad, and benchmarked it against several of the strongest models
                  available at the time. YOLOv5 came out on top in our 2022 benchmarks, and
                  became the backbone of the final system. We fine-tuned it further by training
                  on the outer layers, sharpening its ability to detect apples, oranges, and mold
                  specifically, and later moved to using YOLO for segmentation to get a more
                  precise read on affected areas of the fruit.
                </p>

                <div className="flex gap-4 not-prose">
                  <figure className="w-1/2">
                    <img
                      src={humbleCoding}
                      alt="YOLO object detection model output, labeling a person, an apple, and a cell phone with confidence scores"
                      className="w-full rounded-lg border border-white/10"
                    />
                    <figcaption className="mt-1.5 text-xs text-white/40">
                      The detection model at work
                    </figcaption>
                  </figure>
                  <figure className="w-1/2">
                    <img
                      src={humblePrototype}
                      alt="Physical prototype: a LEGO SPIKE Prime rig with a phone mounted above an apple on a conveyor track"
                      className="w-full rounded-lg border border-white/10"
                    />
                    <figcaption className="mt-1.5 text-xs text-white/40">
                      The LEGO SPIKE Prime prototype
                    </figcaption>
                  </figure>
                </div>

                <p>
                  To prove the concept could work outside a lab, we built a physical prototype
                  using a LEGO SPIKE Prime Large Hub, controlled remotely from a desktop via
                  Python, with a mobile camera feeding live footage into the model. The result
                  was a fully functioning sorting system that could detect mold on oranges and
                  apples and sort the fruit accordingly — turning a research question into
                  something Humble could actually see and test.
                </p>
                <p>
                  The project sits at the intersection of applied AI, hardware prototyping, and
                  product thinking: not just training a model, but scoping, building, and
                  validating a working end-to-end system for a real business problem.
                </p>
              </div>
            </div>
          </div>

          {/* four rectangles right underneath the "approved" icon (which
              ends 50px below the box), centered as a group, 20px gap
              between each. Rendered before the approve-fruit trip and the
              icon itself, so — at this shared z-0 tier — DOM order puts it
              underneath both */}
          <div
            className="absolute z-0 flex"
            style={{
              bottom: -(50 + 300),
              left: '50%',
              transform: 'translateX(-50%)',
              gap: APPROVE_RECT_GAP,
            }}
          >
            {Array.from({ length: APPROVE_RECT_COUNT }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: APPROVE_RECT_WIDTH,
                  height: 300,
                  background: 'linear-gradient(to bottom, #36434D 0%, #36434D 66.6667%, #15181D 100%)',
                }}
              />
            ))}
          </div>

          {/* fruit traveling straight down from behind the box, past the
              "approved" icon (rendered after this, so it stacks on top),
              down the target rectangle (rendered before this, so this
              stacks on top of it), disappearing into the fade */}
          <style>
            {APPROVE_SCHEDULE.map((trip, i) => {
              const fruit = FRUITS[trip.fruit];
              const groupLeft = wrapperWidth / 2 - APPROVE_GROUP_WIDTH / 2;
              const rectCenterX =
                groupLeft + trip.rectIndex * (APPROVE_RECT_WIDTH + APPROVE_RECT_GAP) + APPROVE_RECT_WIDTH / 2;
              const startY = wrapperHeight - fruit.size;
              const distance = 350; // 50 (icon) + 300 (rectangle)
              const path = verticalPath(rectCenterX - fruit.size / 2, startY, distance);
              const duration = distance / APPROVE_SPEED;
              return buildTrashKeyframe(i, trip.at, path, duration, APPROVE_FADE_LENGTH, APPROVE_FADE_IN_LENGTH, 'fruit-approve');
            }).join('\n')}
          </style>

          {APPROVE_SCHEDULE.map((trip, i) => {
            const fruit = FRUITS[trip.fruit];
            return (
              <img
                key={`approve-${i}`}
                src={fruit.src}
                alt=""
                className="absolute z-0 top-0 left-0 pointer-events-none select-none"
                style={{
                  width: fruit.size,
                  height: fruit.size,
                  animationName: `fruit-approve-${i}`,
                  animationDuration: `${ANIMATION_DURATION}s`,
                  animationTimingFunction: 'linear',
                  animationIterationCount: 'infinite',
                }}
              />
            );
          })}

          {/* "approved" icon — centered below the box, flush against its
              bottom edge, extending downward (like the trash icon, the box
              fills the whole wrapper, so this has to start AT bottom:0 and
              go negative by its own height, not just bottom:0, or it
              renders inside the box's footprint and disappears underneath
              its z-10 background). Rendered after the rectangles and the
              approve-fruit trip, so it stacks on top of both */}
          <img
            src={approved}
            alt=""
            className="absolute z-0 pointer-events-none select-none"
            style={{ bottom: -50, left: '50%', transform: 'translateX(-50%)', width: 500, height: 50 }}
          />
        </div>
      </div>
    </div>
  );
}

export default FruitSorting;
