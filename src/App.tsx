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
const purpleColor = '#463ACB';

// signal group: two single-colour rows, underneath the analogous group
const GREEN_Y = PURPLE_Y + GROUP_GAP;
const RED_Y = GREEN_Y + ROW_GAP;
const greenColor = '#21C45D';
const redColor = '#F83959';

// a header labels each row as it spawns in, all sharing the same left edge
// so they line up with one another regardless of how wide each row is
const LABEL_OFFSET = 26;
const LABEL_X = rowX(0) - 12;
const NEUTRALS_LABEL_Y = ROW_Y - LABEL_OFFSET;
const BRAND_LABEL_Y = BLUE_Y - LABEL_OFFSET;
const ANALOGOUS_LABEL_Y = TEAL_Y - LABEL_OFFSET;
const SIGNAL_LABEL_Y = GREEN_Y - LABEL_OFFSET;

const paragraphs = [
  'Placeholder text goes here. Replace this with the first thing you want people to read as they scroll.',
  'A second block of placeholder copy. This is where the story continues while the visual stays put.',
  'Then the white circle slides right, and the full greyscale spawns in behind it.',
  'Blue takes a step right, and a few shades of blue spawn in around it.',
  'The teal row and the purple circle unfold together underneath it.',
  'Finally, the signal group spawns in with green and red.',
];

function App() {
  const { ref, progress } = useScrollProgress<HTMLDivElement>();

  // 0    -> 0.14: circles appear next to the logo
  // 0.14 -> 0.22: logo fades out, circles slide into their grid layout
  // 0.22 -> 0.42: white slides right, the greyscale spawns in along the way
  // 0.42 -> 0.58: blue steps right, three shades of blue spawn in around it
  // 0.58 -> 0.78: the teal row + purple circle spawn underneath the blue row
  // 0.78 -> 1:    the signal group (green + red) spawns underneath that
  const appearEnd = 0.14;
  const moveT = clamp01((progress - appearEnd) / 0.08);
  const spawnT = clamp01((progress - 0.22) / 0.2);
  const svgOpacity = 1 - moveT;

  // "Neutrals" fades in once the new shades of grey start appearing,
  // not while black and white are just settling into the grid
  const neutralsLabelLocal = spawnT;

  const stageD = clamp01((progress - 0.42) / 0.16);
  const blueMoveT = clamp01(stageD / 0.35);
  const blueLeftLocal = clamp01((stageD - 0.15) / 0.35);
  const blueRight1Local = clamp01((stageD - 0.45) / 0.35);
  const blueRight2Local = clamp01((stageD - 0.65) / 0.35);

  // "Brand" fades in as the blue row spawns
  const brandLabelLocal = clamp01(stageD / 0.6);

  // the teal row and the purple circle unfold together: the row cascades
  // left to right, while purple starts at the same moment as the first dot
  const stageRows = clamp01((progress - 0.58) / 0.2);
  const teal0Local = clamp01(stageRows / 0.5);
  const teal1Local = clamp01((stageRows - 0.15) / 0.5);
  const teal2Local = clamp01((stageRows - 0.3) / 0.5);
  const purpleLocal = clamp01(stageRows / 0.5);

  // "Analogous" fades in as the teal row and purple circle spawn
  const analogousLabelLocal = clamp01(stageRows / 0.5);

  // green and red spawn in together
  const stageSignal = clamp01((progress - 0.78) / 0.22);
  const greenLocal = clamp01(stageSignal / 0.6);
  const redLocal = clamp01(stageSignal / 0.6);

  // "Signal" fades in as green and red spawn
  const signalLabelLocal = clamp01(stageSignal / 0.6);

  return (
    <div className="bg-[#15181D]">
      <div ref={ref} className="grid grid-cols-2">
        <div className="sticky top-0 h-screen flex items-center justify-center">
          <div className="relative w-[460px] max-w-full h-[480px]">
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
                top: BLUE_Y,
                opacity: blueLeftLocal,
                transform: `translate(-50%, -50%) scale(${0.2 + blueLeftLocal * 0.8})`,
              }}
            />
            <span
              className="absolute w-6 h-6 rounded-full ring-1 ring-white/10"
              style={{
                backgroundColor: blueRow[2],
                left: rowX(2),
                top: BLUE_Y,
                opacity: blueRight1Local,
                transform: `translate(-50%, -50%) scale(${0.2 + blueRight1Local * 0.8})`,
              }}
            />
            <span
              className="absolute w-6 h-6 rounded-full ring-1 ring-white/10"
              style={{
                backgroundColor: blueRow[3],
                left: rowX(3),
                top: BLUE_Y,
                opacity: blueRight2Local,
                transform: `translate(-50%, -50%) scale(${0.2 + blueRight2Local * 0.8})`,
              }}
            />

            {tealRow.map((color, i) => {
              const local = [teal0Local, teal1Local, teal2Local][i];
              return (
                <span
                  key={color}
                  className="absolute w-6 h-6 rounded-full ring-1 ring-white/10"
                  style={{
                    backgroundColor: color,
                    left: rowX(i),
                    top: TEAL_Y,
                    opacity: local,
                    transform: `translate(-50%, -50%) scale(${0.2 + local * 0.8})`,
                  }}
                />
              );
            })}

            <span
              className="absolute w-6 h-6 rounded-full ring-1 ring-white/10"
              style={{
                backgroundColor: purpleColor,
                left: rowX(0),
                top: PURPLE_Y,
                opacity: purpleLocal,
                transform: `translate(-50%, -50%) scale(${0.2 + purpleLocal * 0.8})`,
              }}
            />

            <span
              className="absolute text-white/70 text-sm tracking-wide whitespace-nowrap"
              style={{
                left: LABEL_X,
                top: NEUTRALS_LABEL_Y,
                opacity: neutralsLabelLocal,
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
                opacity: brandLabelLocal,
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
                opacity: analogousLabelLocal,
                transform: 'translateY(-50%)',
              }}
            >
              Analogous
            </span>

            <span
              className="absolute w-6 h-6 rounded-full ring-1 ring-white/10"
              style={{
                backgroundColor: greenColor,
                left: rowX(0),
                top: GREEN_Y,
                opacity: greenLocal,
                transform: `translate(-50%, -50%) scale(${0.2 + greenLocal * 0.8})`,
              }}
            />
            <span
              className="absolute w-6 h-6 rounded-full ring-1 ring-white/10"
              style={{
                backgroundColor: redColor,
                left: rowX(0),
                top: RED_Y,
                opacity: redLocal,
                transform: `translate(-50%, -50%) scale(${0.2 + redLocal * 0.8})`,
              }}
            />

            <span
              className="absolute text-white/70 text-sm tracking-wide whitespace-nowrap"
              style={{
                left: LABEL_X,
                top: SIGNAL_LABEL_Y,
                opacity: signalLabelLocal,
                transform: 'translateY(-50%)',
              }}
            >
              Signal
            </span>
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
