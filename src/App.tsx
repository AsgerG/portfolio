import { useEffect, useRef, useState } from 'react';

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

type Point = { x: number; y: number };

// black, white, blue
const circleColors = ['#121212', '#ffffff', '#0284C7'];

// row layout while the circles are appearing, left to right:
// blue, black, white, then the logo — all with the same edge-to-edge gap.
const startPositions: Point[] = [
  { x: 116, y: 120 },
  { x: 164, y: 120 },
  { x: 68, y: 120 },
];

const ROW_Y = 90;
const ROW_START_X = 90;
const ROW_SPACING = 26;
const rowX = (i: number) => ROW_START_X + i * ROW_SPACING;

// black + white right next to each other on top, blue underneath aligned
// with black, on the left. White sits at the row's first slot so it can
// slide straight into the greyscale row from here.
const endPositions: Point[] = [
  { x: rowX(0), y: ROW_Y },
  { x: rowX(1), y: ROW_Y },
  { x: rowX(0), y: 150 },
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
  '#20262D',
  '#282D34',
  '#333A42',
  '#3E4651',
  '#49535F',
  '#545F6D',
  '#5F6C7C',
  '#6A798A',
  '#788697',
  '#8693A2',
  '#9CA6B2',
  '#A9B1BC',
  '#B7BEC8',
  '#D4D8DE',
  '#D4D8DE',
  '#E2E5E9',
  '#F1F2F4',
  '#FFFFFF',
];

const WHITE_START_X = endPositions[1].x; // rowX(1), right next to black
const WHITE_END_X = rowX(grayscaleRow.length - 1); // final resting spot, far right

// blue moves one step right (rowX(0) -> rowX(1)), then one new circle spawns
// to its left and two more to its right
const BLUE_START_X = endPositions[2].x; // rowX(0)
const BLUE_MOVED_X = rowX(1);
const blueRow = ['#0C4A6E', '#0284C7', '#0EA5E9', '#38BDF8'];

const paragraphs = [
  'Placeholder text goes here. Replace this with the first thing you want people to read as they scroll.',
  'A second block of placeholder copy. This is where the story continues while the visual stays put.',
  'Then the white circle slides right, and the full greyscale spawns in behind it.',
  'Blue takes a step right, and a few shades of blue spawn in around it.',
  'One more placeholder paragraph to round things out before the section ends.',
];

function App() {
  const { ref, progress } = useScrollProgress<HTMLDivElement>();

  // 0    -> 0.25: circles appear next to the logo
  // 0.25 -> 0.4:  logo fades out, circles slide into their grid layout
  // 0.4  -> 0.7:  white slides right, the greyscale spawns in along the way
  // 0.7  -> 1:    blue steps right, three shades of blue spawn in around it
  const appearEnd = 0.25;
  const moveT = clamp01((progress - appearEnd) / 0.15);
  const spawnT = clamp01((progress - 0.4) / 0.3);
  const svgOpacity = 1 - moveT;

  const stageD = clamp01((progress - 0.7) / 0.3);
  const blueMoveT = clamp01(stageD / 0.35);
  const blueLeftLocal = clamp01((stageD - 0.15) / 0.35);
  const blueRight1Local = clamp01((stageD - 0.45) / 0.35);
  const blueRight2Local = clamp01((stageD - 0.65) / 0.35);

  return (
    <div className="bg-[#15181D]">
      <div ref={ref} className="grid grid-cols-2">
        <div className="sticky top-0 h-screen flex items-center justify-center">
          <div className="relative w-[760px] max-w-full h-60">
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
              const y = lerp(start.y, end.y, moveT);

              // the white circle keeps sliding right once the grid settles
              if (i === 1) {
                x += (WHITE_END_X - WHITE_START_X) * spawnT;
              }

              // blue takes one step right once the grid has settled
              if (i === 2) {
                x += (BLUE_MOVED_X - BLUE_START_X) * blueMoveT;
              }

              return (
                <span
                  key={color}
                  className="absolute w-6 h-6 rounded-full ring-1 ring-white/10"
                  style={{
                    backgroundColor: color,
                    left: x,
                    top: y,
                    opacity,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                  }}
                />
              );
            })}

            {grayscaleRow.slice(1, -1).map((color, gIndex) => {
              const i = gIndex + 1;
              const x = rowX(i);
              const spawnThreshold = clamp01(
                (x - WHITE_START_X) / (WHITE_END_X - WHITE_START_X),
              );
              const local = clamp01((spawnT - spawnThreshold) / 0.05);

              return (
                <span
                  key={i}
                  className="absolute w-6 h-6 rounded-full ring-1 ring-white/10"
                  style={{
                    backgroundColor: color,
                    left: x,
                    top: ROW_Y,
                    opacity: local,
                    transform: `translate(-50%, -50%) scale(${0.2 + local * 0.8})`,
                  }}
                />
              );
            })}

            <span
              className="absolute w-6 h-6 rounded-full ring-1 ring-white/10"
              style={{
                backgroundColor: blueRow[0],
                left: BLUE_START_X,
                top: 150,
                opacity: blueLeftLocal,
                transform: `translate(-50%, -50%) scale(${0.2 + blueLeftLocal * 0.8})`,
              }}
            />
            <span
              className="absolute w-6 h-6 rounded-full ring-1 ring-white/10"
              style={{
                backgroundColor: blueRow[2],
                left: rowX(2),
                top: 150,
                opacity: blueRight1Local,
                transform: `translate(-50%, -50%) scale(${0.2 + blueRight1Local * 0.8})`,
              }}
            />
            <span
              className="absolute w-6 h-6 rounded-full ring-1 ring-white/10"
              style={{
                backgroundColor: blueRow[3],
                left: rowX(3),
                top: 150,
                opacity: blueRight2Local,
                transform: `translate(-50%, -50%) scale(${0.2 + blueRight2Local * 0.8})`,
              }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-[40vh] py-[40vh] px-12 text-white/70 text-lg max-w-md">
          {paragraphs.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
