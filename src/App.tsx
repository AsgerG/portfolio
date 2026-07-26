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
const circleColors = ['#121212', '#FFFFFF', '#0284C7'];

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

// a header labels each row as it spawns in, all sharing the same left edge
// so they line up with one another regardless of how wide each row is
const LABEL_OFFSET = 26;
const LABEL_X = rowX(0) - 12;
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
  const { ref, progress } = useScrollProgress<HTMLDivElement>();

  // 0    -> 0.07: circles appear next to the logo
  // 0.07 -> 0.11: logo fades out, circles slide into their grid layout
  // 0.11 -> 0.21: white slides right, the greyscale spawns in along the way
  // 0.21 -> 0.29: blue steps right, three shades of blue spawn in around it
  // 0.29 -> 0.39: the teal row + purple circle spawn underneath the blue row
  // 0.39 -> 0.5:  the signal group (green + red) spawns underneath that
  // 0.5  -> 1:    all five rows form together, as everything unclaimed
  //               fades away
  const appearEnd = 0.07;
  const moveT = clamp01((progress - appearEnd) / 0.04);
  const spawnT = clamp01((progress - 0.11) / 0.1);
  const svgOpacity = 1 - moveT;

  // "Neutrals" fades in once the new shades of grey start appearing,
  // not while black and white are just settling into the grid
  const neutralsLabelLocal = spawnT;

  const stageD = clamp01((progress - 0.21) / 0.08);
  const blueMoveT = clamp01(stageD / 0.35);
  const blueLeftLocal = clamp01((stageD - 0.15) / 0.35);
  const blueRight1Local = clamp01((stageD - 0.45) / 0.35);
  const blueRight2Local = clamp01((stageD - 0.65) / 0.35);

  // "Brand" fades in as the blue row spawns
  const brandLabelLocal = clamp01(stageD / 0.6);

  // the teal row and the purple circle unfold together: the row cascades
  // left to right, while purple starts at the same moment as the first dot
  const stageRows = clamp01((progress - 0.29) / 0.1);
  const teal0Local = clamp01(stageRows / 0.5);
  const teal1Local = clamp01((stageRows - 0.15) / 0.5);
  const teal2Local = clamp01((stageRows - 0.3) / 0.5);
  const purpleLocal = clamp01(stageRows / 0.5);

  // "Analogous" fades in as the teal row and purple circle spawn
  const analogousLabelLocal = clamp01(stageRows / 0.5);

  // green and red spawn in together
  const stageSignal = clamp01((progress - 0.39) / 0.11);
  const greenLocal = clamp01(stageSignal / 0.6);
  const redLocal = clamp01(stageSignal / 0.6);

  // "Signal" fades in as green and red spawn
  const signalLabelLocal = clamp01(stageSignal / 0.6);

  // all five rows form together, over the whole remaining scroll range
  const stageRowAll = clamp01((progress - 0.5) / 0.5);
  const stageRow1 = stageRowAll;
  const stageRow2 = stageRowAll;
  const stageRow3 = stageRowAll;
  const stageRow4 = stageRowAll;
  const stageRow5 = stageRowAll;

  // everything not claimed by a row fades away early in that sequence
  const fade = 1 - clamp01((progress - 0.5) / 0.15);

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
      <div ref={ref} className="grid grid-cols-2">
        <div className="sticky top-0 h-screen flex items-center justify-center">
          <div className="relative w-[460px] max-w-full h-[560px]">
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
              if (rowStage !== undefined) {
                x = lerp(x, rowTargetX[color], rowStage);
                y = lerp(y, rowTargetY[color], rowStage);
              }

              return (
                <span
                  key={color}
                  className="absolute w-6 h-6 rounded-full ring-1 ring-white/10"
                  style={{
                    backgroundColor: color,
                    left: x,
                    top: y,
                    opacity: rowStage !== undefined ? opacity : opacity * fade,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                  }}
                />
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
              if (rowStage !== undefined) {
                x = lerp(x, rowTargetX[color], rowStage);
                y = lerp(y, rowTargetY[color], rowStage);
              }

              return (
                <span
                  key={i}
                  className="absolute w-6 h-6 rounded-full ring-1 ring-white/10"
                  style={{
                    backgroundColor: color,
                    left: x,
                    top: y,
                    opacity: rowStage !== undefined ? local : local * fade,
                    transform: `translate(-50%, -50%) scale(${0.2 + local * 0.8})`,
                  }}
                />
              );
            })}

            <span
              className="absolute w-6 h-6 rounded-full ring-1 ring-white/10"
              style={{
                backgroundColor: blueRow[0],
                left: lerp(BLUE_START_X, rowTargetX[blueRow[0]], stageRow4),
                top: lerp(BLUE_Y, rowTargetY[blueRow[0]], stageRow4),
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
                opacity: blueRight1Local * fade,
                transform: `translate(-50%, -50%) scale(${0.2 + blueRight1Local * 0.8})`,
              }}
            />
            <span
              className="absolute w-6 h-6 rounded-full ring-1 ring-white/10"
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
              const x =
                rowStage !== undefined
                  ? lerp(rowX(i), rowTargetX[color], rowStage)
                  : rowX(i);
              const y =
                rowStage !== undefined
                  ? lerp(TEAL_Y, rowTargetY[color], rowStage)
                  : TEAL_Y;
              return (
                <span
                  key={color}
                  className="absolute w-6 h-6 rounded-full ring-1 ring-white/10"
                  style={{
                    backgroundColor: color,
                    left: x,
                    top: y,
                    opacity: rowStage !== undefined ? local : local * fade,
                    transform: `translate(-50%, -50%) scale(${0.2 + local * 0.8})`,
                  }}
                />
              );
            })}

            <span
              className="absolute w-6 h-6 rounded-full ring-1 ring-white/10"
              style={{
                backgroundColor: purpleColor,
                left: lerp(rowX(0), rowTargetX[purpleColor], stageRow5),
                top: lerp(PURPLE_Y, rowTargetY[purpleColor], stageRow5),
                opacity: purpleLocal,
                transform: `translate(-50%, -50%) scale(${0.2 + purpleLocal * 0.8})`,
              }}
            />

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

            <span
              className="absolute w-6 h-6 rounded-full ring-1 ring-white/10"
              style={{
                backgroundColor: greenColor,
                left: lerp(rowX(0), rowTargetX[greenColor], stageRow5),
                top: lerp(GREEN_Y, rowTargetY[greenColor], stageRow5),
                opacity: greenLocal,
                transform: `translate(-50%, -50%) scale(${0.2 + greenLocal * 0.8})`,
              }}
            />
            <span
              className="absolute w-6 h-6 rounded-full ring-1 ring-white/10"
              style={{
                backgroundColor: redColor,
                left: lerp(rowX(0), rowTargetX[redColor], stageRow5),
                top: lerp(RED_Y, rowTargetY[redColor], stageRow5),
                opacity: redLocal,
                transform: `translate(-50%, -50%) scale(${0.2 + redLocal * 0.8})`,
              }}
            />

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
              const x = lerp(dupSpawnX, NEW_ROW3_X2, stageRow3);
              const y = lerp(ROW_Y, ROW3_Y, stageRow3);
              return (
                <span
                  className="absolute w-6 h-6 rounded-full ring-1 ring-white/10"
                  style={{
                    backgroundColor: '#333A42',
                    left: x,
                    top: y,
                    opacity: local,
                    transform: `translate(-50%, -50%) scale(${0.2 + local * 0.8})`,
                  }}
                />
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
                    opacity: rowStage,
                    transform: 'translateY(-50%)',
                  }}
                >
                  {text}
                </span>
              );
            })}
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
