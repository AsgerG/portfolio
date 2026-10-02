// Phone layout of the fruit-sorting page, built 1:1 from the mobile Figma
// frame (node 783:88643). The top section has falling fruit like desktop;
// the grey belts are in place so conveyor fruit can be layered in later.
import { useState } from 'react';
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
import hopper from '../assets/Humble/hopper_mobile.webp';
import humbleCoding from '../assets/Humble/humble_coding.png';
import humblePrototype from '../assets/Humble/humble_prototype.png';
import dtuLogo from '../assets/Humble/dtu_logo.png';
import humbleLogo from '../assets/Humble/humble_logo.png';
import legoLogo from '../assets/Humble/lego_logo.png';

const PAGE_BG = '#15181D';
const BELT = 'w-[60px] bg-[#36434D]';
// full-width text panels: shade/800 with the 1px top highlight
const PANEL = 'relative bg-[#1E2126] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]';
const BODY = 'flex flex-col text-[16px] font-normal leading-[1.5] text-[#C5CDDB]';

// ── Falling fruit (top section) ─────────────────────────────────────────
// Same idea as desktop — fruit drops from above the screen, spinning, and
// disappears behind the hopper — scaled to the phone layout: the hopper is
// ~55% of the desktop box's width, so fruit is 60px instead of 80px and
// falls a little slower. Each fruit loops on its own cycle (fall + a random
// pause), so the overall pattern never visibly repeats.
const FRESH_FRUIT = [apple1, apple2, apple3, banana1, banana2, banana3, orange1, orange2, orange3, pear1, pear2];
const ROTTEN_FRUIT = [rottenApple1, rottenApple2, rottenBanana1, rottenBanana2, rottenOrange1, rottenOrange2, rottenPear1, rottenPear2];
const FRUIT_IMAGES = [...FRESH_FRUIT, ...ROTTEN_FRUIT];
const DROP_COUNT = 14; // fruit in the air at most
const DROP_SIZE = 60; // px (desktop: 80)
const FALL_SPEED = 30; // px/s (desktop: 40)
const HOPPER_TOP = 80; // matches the page's pt-20 above the hopper
const DROP_END = HOPPER_TOP + 20; // fruit ends hidden behind the hopper
const HOPPER_WIDTH = 'min(350px, 90%)'; // same as the hopper image's width
const FALL_TIME = (DROP_END + DROP_SIZE) / FALL_SPEED; // seconds from above the screen into the hopper

type Drop = {
  src: string;
  across: number; // 0–1 across the hopper's opening
  rotStart: number;
  rotEnd: number;
  cycle: number; // seconds: the fall plus a pause before the next one
  delay: number; // negative, so the page opens mid-shower instead of empty
};

function makeDrops(): Drop[] {
  return Array.from({ length: DROP_COUNT }, () => {
    const rotStart = Math.random() * 360;
    const spin = (180 + Math.random() * 180) * (Math.random() < 0.5 ? -1 : 1); // same 180–360° as desktop
    const cycle = FALL_TIME + 0.5 + Math.random() * 4;
    return {
      src: FRUIT_IMAGES[Math.floor(Math.random() * FRUIT_IMAGES.length)],
      across: 0.12 + Math.random() * 0.76, // stays clear of the hopper's slanted sides
      rotStart,
      rotEnd: rotStart + spin,
      cycle,
      delay: -Math.random() * cycle,
    };
  });
}

function dropKeyframes(drops: Drop[]) {
  return drops
    .map((d, i) => {
      const fallPct = (FALL_TIME / d.cycle) * 100;
      // after landing it's switched off until the next drop, so nothing can
      // peek out past the hopper's angled bottom corners while it waits
      return `@keyframes m-fruit-drop-${i} {
  0% { transform: translateY(${-DROP_SIZE}px) rotate(${d.rotStart}deg); opacity: 1; }
  ${fallPct}% { transform: translateY(${DROP_END}px) rotate(${d.rotEnd}deg); opacity: 1; }
  ${fallPct + 0.01}% { transform: translateY(${DROP_END}px) rotate(${d.rotEnd}deg); opacity: 0; }
  100% { transform: translateY(${DROP_END}px) rotate(${d.rotEnd}deg); opacity: 0; }
}`;
    })
    .join('\n');
}

// ── Belt fruit (middle section) ─────────────────────────────────────────
// Fruit rides down each of the three grey belts: it starts hidden under the
// first text panel, moves down over the belt, and disappears under the
// second panel. Fruit on a belt are evenly spaced with a fixed gap between
// them, like items on a real conveyor. Each belt's sequence of fruit only
// repeats every BELT_LOOP seconds, and each belt starts at a random point,
// so the three belts don't line up with each other.
const BELT_HEIGHT = 180; // px, the belt zone between the two panels
const BELT_FRUIT_SIZE = 60; // px, same as the falling fruit
const BELT_FRUIT_GAP = 10; // px of empty belt between one fruit and the next
const BELT_SPEED = 30; // px/s, same pace as the falling fruit
const BELT_LOOP = 30; // seconds before a belt's sequence of fruit repeats
const BELT_PITCH = BELT_FRUIT_SIZE + BELT_FRUIT_GAP; // distance from one fruit to the next
// extra px past each hidden end: the tilted fruit's corners stick out up to
// ~10px beyond its 60px box, so this keeps it fully out of sight
const HIDE_MARGIN = 30;
const BELT_START = -(BELT_FRUIT_SIZE + HIDE_MARGIN); // under panel 1
const BELT_END = BELT_HEIGHT + HIDE_MARGIN; // under panel 2
const BELT_PATH = BELT_END - BELT_START;
// a loop must cover a whole number of pitches (so the gap stays exact where
// the loop wraps) and at least the visible path — 13 fruit at the defaults
const FRUIT_PER_BELT = Math.max(Math.ceil(BELT_PATH / BELT_PITCH), Math.round((BELT_LOOP * BELT_SPEED) / BELT_PITCH));
const BELT_CYCLE = (FRUIT_PER_BELT * BELT_PITCH) / BELT_SPEED; // seconds (≈ BELT_LOOP: 30.3s at the defaults)
const BELT_TRAVEL_TIME = BELT_PATH / BELT_SPEED;

type BeltFruit = {
  src: string;
  tilt: number; // small fixed rotation so the fruit don't look stamped
  cycle: number;
  delay: number;
};

function shuffled<T>(items: T[]) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function makeBeltFruits(): BeltFruit[][] {
  // deal fruit from a shuffled deck of every image, so all 19 kinds show up
  // across the belts and no belt repeats a fruit within its loop
  let deck: string[] = [];
  function draw(exclude: string[]) {
    if (deck.every((src) => exclude.includes(src))) deck = [...deck, ...shuffled(FRUIT_IMAGES)];
    const i = deck.findIndex((src) => !exclude.includes(src));
    return deck.splice(i, 1)[0];
  }

  return [0, 1, 2].map(() => {
    const phase = Math.random() * BELT_CYCLE;
    const picked: string[] = [];
    return Array.from({ length: FRUIT_PER_BELT }, (_, k) => {
      const src = draw(picked);
      picked.push(src);
      return {
        src,
        tilt: (Math.random() - 0.5) * 50,
        cycle: BELT_CYCLE,
        // exactly one pitch apart in time → exactly BELT_FRUIT_GAP px apart on the belt
        delay: -(phase + (k * BELT_PITCH) / BELT_SPEED),
      };
    });
  });
}

// ── Sorting belts (bottom section) ──────────────────────────────────────
// Same conveyor as the middle (size, 10px gap, speed, 30s loop), but fruit
// starts hidden under the second text panel and the TRASH / APPROVED label,
// rides down the belt, and slides off the bottom of the belt (the end of the
// page). TRASH only carries rotten fruit, APPROVED only fresh fruit.
const LABEL_HEIGHT = 40; // px, the TRASH / APPROVED labels
const SORT_FROM = -(LABEL_HEIGHT + BELT_FRUIT_SIZE + HIDE_MARGIN); // fully hidden under label + panel
const SORT_TO = BELT_HEIGHT + HIDE_MARGIN; // fully past the belt's bottom edge (clipped there)
const SORT_TRAVEL_TIME = (SORT_TO - SORT_FROM) / BELT_SPEED;
const SORT_FRUIT_PER_BELT = Math.max(Math.ceil((SORT_TO - SORT_FROM) / BELT_PITCH), FRUIT_PER_BELT);
const SORT_CYCLE = (SORT_FRUIT_PER_BELT * BELT_PITCH) / BELT_SPEED;

function makeSortBelt(pool: string[]): BeltFruit[] {
  const phase = Math.random() * SORT_CYCLE;
  // walk through shuffled copies of the pool, never putting the same fruit
  // twice in a row (TRASH has only 8 kinds for its 13 spots)
  const order: string[] = [];
  while (order.length < SORT_FRUIT_PER_BELT) {
    for (const src of shuffled(pool)) {
      if (order.length < SORT_FRUIT_PER_BELT && src !== order[order.length - 1] && src !== order[0]) order.push(src);
    }
  }
  return order.map((src, k) => ({
    src,
    tilt: (Math.random() - 0.5) * 50,
    cycle: SORT_CYCLE,
    delay: -(phase + (k * BELT_PITCH) / BELT_SPEED),
  }));
}

function makeSortBelts() {
  return { trash: makeSortBelt(ROTTEN_FRUIT), approved: makeSortBelt(FRESH_FRUIT) };
}

function sortKeyframes(name: string, belt: BeltFruit[]) {
  const travelPct = (SORT_TRAVEL_TIME / SORT_CYCLE) * 100;
  return belt
    .map(
      (f, k) => `@keyframes ${name}-${k} {
  0% { transform: translateY(${SORT_FROM}px) rotate(${f.tilt}deg); }
  ${travelPct}% { transform: translateY(${SORT_TO}px) rotate(${f.tilt}deg); }
  100% { transform: translateY(${SORT_TO}px) rotate(${f.tilt}deg); }
}`,
    )
    .join('\n');
}

function beltKeyframes(belts: BeltFruit[][]) {
  return belts
    .flatMap((belt, b) =>
      belt.map((f, k) => {
        const travelPct = (BELT_TRAVEL_TIME / f.cycle) * 100;
        // rests under the second panel after its trip, then jumps back under
        // the first panel at the loop point — both positions are hidden
        return `@keyframes m-belt-${b}-${k} {
  0% { transform: translateY(${BELT_START}px) rotate(${f.tilt}deg); }
  ${travelPct}% { transform: translateY(${BELT_END}px) rotate(${f.tilt}deg); }
  100% { transform: translateY(${BELT_END}px) rotate(${f.tilt}deg); }
}`;
      }),
    )
    .join('\n');
}

function FruitSortingMobile() {
  const [drops] = useState(makeDrops);
  const [belts] = useState(makeBeltFruits);
  const [sortBelts] = useState(makeSortBelts);

  return (
    <div
      className="relative min-h-screen pt-20 overflow-x-clip text-white"
      style={{ backgroundColor: PAGE_BG, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* falling fruit — beneath the hopper and the first panel (both z-10),
          so each one disappears as it drops in. Hidden for people who've
          asked their phone to reduce motion. */}
      <style>
        {[
          dropKeyframes(drops),
          beltKeyframes(belts),
          sortKeyframes('m-trash', sortBelts.trash),
          sortKeyframes('m-approved', sortBelts.approved),
        ].join('\n')}
      </style>
      <div aria-hidden className="absolute inset-x-0 top-0 z-0 pointer-events-none motion-reduce:hidden">
        {drops.map((d, i) => (
          <img
            key={i}
            src={d.src}
            alt=""
            draggable={false}
            className="absolute top-0 select-none"
            style={{
              width: DROP_SIZE,
              height: DROP_SIZE,
              left: `calc(50% + (${d.across} - 0.5) * ${HOPPER_WIDTH} - ${DROP_SIZE / 2}px)`,
              animation: `m-fruit-drop-${i} ${d.cycle}s linear ${d.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* hopper */}
      <div className="relative z-10 flex justify-center">
        <img src={hopper} alt="" className="w-[350px] max-w-[90%] h-auto select-none" draggable={false} />
      </div>

      {/* intro panel */}
      <section className={`${PANEL} z-10 px-4 pt-8 pb-10`}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-start gap-2.5">
              <a
                href="#"
                className="flex items-center gap-1.5 text-[14px] font-medium leading-[1.5] text-[#939393] hover:text-white transition-colors"
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
                  <path
                    d="M10.5 5.5H1M1 5.5L5.5 1M1 5.5L5.5 10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Back
              </a>
              <div className="flex flex-1 items-center justify-end gap-2">
                <img src={dtuLogo} alt="DTU" className="size-[25px] rounded-full" />
                <img src={humbleLogo} alt="Humble" className="size-[25px] rounded-full" />
                <img src={legoLogo} alt="LEGO" className="size-[25px] rounded-full" />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-[18px] font-medium leading-[1.5] text-white">
                Automated Fruit Sorting – Master's Thesis
              </h1>
              <p className="text-[12px] font-bold leading-[1.5] text-[#939393]">
                A collaboration between Humble, LEGO, and DTU
              </p>
            </div>
          </div>
          <div className={BODY}>
            <p>
              For my master's thesis, I worked with the Icelandic food-waste company Humble, LEGO, and DTU to explore
              whether fruit sorting could be automated. Humble's business includes fine-grained sorting of fruit that
              has been deemed too low-quality to sell in stores — a process that was, at the time, done entirely by
              hand. Our goal was to build an MVP that tested whether computer vision could take on part of that work.
            </p>
            <p>
              On the software side, I developed a custom visual AI model to distinguish good fruit from bad, and
              benchmarked it against several of the strongest models available at the time. YOLOv5 came out on top in
              our 2022 benchmarks, and became the backbone of the final system. We fine-tuned it further by training
              on the outer layers, sharpening its ability to detect apples, oranges, and mold specifically, and later
              moved to using YOLO for segmentation to get a more precise read on affected areas of the fruit.
            </p>
          </div>
        </div>
      </section>

      {/* three belts between the panels. The fruit sit at z-0 inside each
          belt: above the grey belt, but below both panels (z-10), so they
          appear from under the first and vanish under the second. */}
      <div className="flex justify-between px-10 h-[180px]">
        {belts.map((belt, b) => (
          <div key={b} className={`${BELT} relative h-full`}>
            {belt.map((f, k) => (
              <img
                key={k}
                src={f.src}
                alt=""
                aria-hidden
                draggable={false}
                className="absolute left-0 top-0 z-0 pointer-events-none select-none motion-reduce:hidden"
                style={{
                  width: BELT_FRUIT_SIZE,
                  height: BELT_FRUIT_SIZE,
                  animation: `m-belt-${b}-${k} ${f.cycle}s linear ${f.delay}s infinite`,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* images + second text panel */}
      <section className={`${PANEL} z-10 pt-8 pb-10`}>
        <div className="flex gap-5 px-5 items-start">
          <figure className="flex-1 min-w-0 flex flex-col items-center">
            <img
              src={humblePrototype}
              alt="Physical prototype: a LEGO SPIKE Prime rig with a phone mounted above an apple on a conveyor track"
              className="w-[min(175px,calc(100%+10px))] max-w-none shrink-0 aspect-[175/213] object-cover object-[50%_54%] rounded-[9px] border border-white/50 bg-[#14181E]"
            />
            <figcaption className="w-[min(175px,calc(100%+10px))] max-w-none shrink-0 text-[14px] font-medium leading-[1.5] text-[#939393]">
              The LEGO SPIKE Prime prototype
            </figcaption>
          </figure>
          <figure className="flex-1 min-w-0 flex flex-col items-center">
            <img
              src={humbleCoding}
              alt="YOLO object detection model output, labeling a person, an apple, and a cell phone with confidence scores"
              className="w-[min(175px,calc(100%+10px))] max-w-none shrink-0 aspect-square object-cover rounded-lg border-[0.5px] border-white/50 bg-[#1E2126]"
            />
            <figcaption className="w-[min(175px,calc(100%+10px))] max-w-none shrink-0 text-[16px] font-medium leading-[1.5] text-[#939393]">
              The detection model at work
            </figcaption>
          </figure>
        </div>
        <div className={`${BODY} px-4 pt-6`}>
          <p>
            To prove the concept could work outside a lab, we built a physical prototype using a LEGO SPIKE Prime
            Large Hub, controlled remotely from a desktop via Python, with a mobile camera feeding live footage into
            the model. The result was a fully functioning sorting system that could detect mold on oranges and apples
            and sort the fruit accordingly — turning a research question into something Humble could actually see and
            test.
          </p>
          <p>
            The project sits at the intersection of applied AI, hardware prototyping, and product thinking: not just
            training a model, but scoping, building, and validating a working end-to-end system for a real business
            problem.
          </p>
        </div>
      </section>

      {/* sorting belts: rotten fruit to TRASH, fresh fruit to APPROVED. The
          labels sit above the fruit (z-10); each belt clips its fruit only at
          the bottom edge, so they slide off the end of the page. */}
      <div className="flex gap-5 px-5">
        {[
          { label: 'TRASH', color: '#FF053B', width: 'w-[102px]', name: 'm-trash', fruit: sortBelts.trash },
          { label: 'APPROVED', color: '#3EA100', width: '', name: 'm-approved', fruit: sortBelts.approved },
        ].map(({ label, color, width, name, fruit }) => (
          <div key={label} className="flex flex-1 min-w-0 flex-col items-center">
            <p
              className={`${width} relative z-10 p-2 text-[20px] font-bold leading-[24px] tracking-[4px] text-white whitespace-nowrap`}
              style={{ backgroundColor: color, fontFamily: 'Inter, sans-serif' }}
            >
              {label}
            </p>
            <div className={`${BELT} relative h-[180px]`}>
              {/* clip layer: reaches up under the label/panel and out to the
                  sides, but stops at the belt's bottom edge. overflow-clip
                  (unlike clip-path) also trims layout overflow, so the page
                  doesn't get an invisible scrollable strip below the belts. */}
              <div className="absolute -inset-x-[60px] -top-[400px] bottom-0 overflow-clip pointer-events-none">
              <div className="absolute inset-x-[60px] top-[400px] h-[180px]">
              {fruit.map((f, k) => (
                <img
                  key={k}
                  src={f.src}
                  alt=""
                  aria-hidden
                  draggable={false}
                  className="absolute left-0 top-0 z-0 pointer-events-none select-none motion-reduce:hidden"
                  style={{
                    width: BELT_FRUIT_SIZE,
                    height: BELT_FRUIT_SIZE,
                    animation: `${name}-${k} ${f.cycle}s linear ${f.delay}s infinite`,
                  }}
                />
              ))}
              </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FruitSortingMobile;
