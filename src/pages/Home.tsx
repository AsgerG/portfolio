// front page — built from the "MacBook Air - 15" frame (node 711:1231) in
// the Slask-Aps Figma file. Static images live in src/assets/home and were
// exported straight from that frame.
import { useEffect, useId, useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import pfp from '../assets/home/pfp.webp';
import arrow from '../assets/home/arrow.svg';
import chevron from '../assets/home/chevron.svg';
import chevronLarge from '../assets/home/chevron-large.svg';
import projectEasySBC from '../assets/home/project-easysbc.webp';
import projectFruit from '../assets/home/project-fruit-sorting.webp';
import projectNovo from '../assets/home/project-novo-nordisk.webp';
import projectAiTalks from '../assets/home/project-ai-talks.webp';
import projectHobby from '../assets/home/project-hobby.webp';
import contactPhoto from '../assets/home/contact-photo.webp';
import logoEasySBC from '../assets/home/logo-easysbc.png';
import logoNovo from '../assets/home/logo-novo-nordisk.png';
import logoDtu from '../assets/home/logo-dtu.png';
import logoUcsc from '../assets/home/logo-ucsc.png';
import logoAiTalks from '../assets/home/logo-ai-talks.png';
import logoSkylab from '../assets/home/logo-dtu-skylab.png';
import logoRegensen from '../assets/home/logo-regensen.png';
import { InstagramIcon, LinkedinIcon, LogoMark } from '../components/AccentIcons';

const INSTAGRAM_URL = 'https://www.instagram.com/graesholt/';
const LINKEDIN_URL = 'https://www.linkedin.com/in/asger-graesholt-6711751a0/';

// the site's single secondary colour — animated in index.css
const ACCENT = 'var(--accent)';

// shared "surface" look from the design: dark panel, 4% white hairline
// border and a 1px inner top highlight
const surface =
  'bg-[#1e2126] border-white/[0.04] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]';

// the app uses a hash router, so in-page anchors can't use "#id" hrefs —
// scroll manually instead
function scrollTo(id: string) {
  return (e: MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="relative z-10 text-[24px] sm:text-[32px] font-bold leading-[1.5] text-white">{children}</h2>;
}

/* ---------------------------------- header --------------------------------- */

function Header() {
  const nav = [
    ['PROJECTS', 'projects'],
    ['CAREER', 'career'],
    ['CONTACT', 'contact'],
  ];
  return (
    <header
      className={`sticky top-0 z-50 flex items-center justify-between border px-4 sm:px-10 py-3 sm:py-4 ${surface}`}
    >
      <a href="#" className="flex items-center gap-3 min-w-0">
        <LogoMark className="size-10 sm:size-[50px] shrink-0" />
        <span className="hidden sm:block text-[24px] font-medium leading-[1.5] whitespace-nowrap" style={{ color: ACCENT }}>
          AsgerGraesholt
        </span>
      </a>
      <nav className="flex items-center gap-5 sm:gap-10 lg:gap-20 sm:px-10 text-[13px] sm:text-[16px] font-bold leading-[1.5]">
        {nav.map(([label, id]) => (
          <a key={id} href={`#${id}`} onClick={scrollTo(id)} className="text-white hover:text-[var(--accent)] transition-colors">
            {label}
          </a>
        ))}
      </nav>
    </header>
  );
}

/* ----------------------------------- hero ---------------------------------- */

function Hero() {
  return (
    <section className="flex flex-col -mx-4 sm:mx-0">
      <div
        className="flex flex-row items-center gap-5 sm:gap-12 pl-5 sm:pl-0"
        style={{
          background: 'radial-gradient(50% 50% at 50% 100%, rgba(33,38,61,0.5) 0%, rgba(33,38,61,0) 100%)',
        }}
      >
        <div className="w-[130px] sm:w-[247px] shrink-0 overflow-hidden">
          <img
            src={pfp}
            alt="Asger Graesholt"
            width={200}
            height={200}
            className="sm:ml-4 size-[125px] sm:size-[200px] object-cover [filter:drop-shadow(-4px_-2px_24px_rgba(0,0,0,0.5))]"
          />
        </div>
        <div className="flex flex-col gap-1 min-w-0 pr-2 sm:pr-0">
          <h1 className="text-[24px] sm:text-[40px] font-bold leading-[1.4] text-white">Asger Graesholt</h1>
          <p className="text-[16px] sm:text-[24px] font-medium leading-[1.5]" style={{ color: ACCENT }}>
            AI Engineer | Software Developer | UI/UX Designer
          </p>
        </div>
      </div>
      {/* 2px divider under the hero: fades in from the edges to #222841 at the centre */}
      <div
        aria-hidden
        className="h-[2px] w-full"
        style={{ background: 'linear-gradient(to right, rgba(34,40,65,0), #222841 50%, rgba(34,40,65,0))' }}
      />
    </section>
  );
}

/* --------------------------------- welcome --------------------------------- */

function Welcome() {
  return (
    <section className="flex flex-col gap-6 w-full max-w-[739px] -mt-10 sm:mt-0">
      <div className="hidden sm:block">
        <SectionTitle>Welcome! 🧜🏼‍♂️</SectionTitle>
      </div>
      <div
        className={`w-full max-w-[712px] sm:rounded-2xl sm:border sm:p-6 text-[16px] font-medium leading-[2] sm:leading-[1.5] text-white/80 flex flex-col sm:gap-6 ${surface} max-sm:bg-transparent max-sm:shadow-none`}
      >
        {/* on phones the heading is the first line of the text, as in the mobile design */}
        <p className="sm:hidden font-bold">Welcome! 🧜🏼‍♂️</p>
        <p>I'm Asger – a Danish guy working in tech and based in the Bay Area.</p>
        <p className="mt-8 sm:mt-0">
          I co-founded a million-dollar business. Taught a LEGO robot to sort rotten fruit. Survived big pharma.
          Currently self-employed.
        </p>
        <p>Browse my content and connect! I'm always open for a chat ✨</p>
      </div>
    </section>
  );
}

/* --------------------------------- projects -------------------------------- */

type ProjectLink = { title: string; tag: string; href?: string };

// Where the EasySBC image goes. TODO: point this at the merged EasySBC page
// once it exists — for now it opens the UX/UI case study.
const EASYSBC_URL = '#easysbc';

// the dark radial "shadow" layer from Figma, drawn over each photo. Values are
// the gradient transform + start/end opacity from the design (280×260 box).
type Shade = { matrix: string; from: number; to: number };

function shadeBackground({ matrix, from, to }: Shade) {
  const svg =
    `<svg viewBox='0 0 280 260' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'>` +
    `<rect width='100%' height='100%' fill='url(%23g)' opacity='0.6'/>` +
    `<defs><radialGradient id='g' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(${matrix})'>` +
    `<stop stop-color='rgba(21,24,29,${from})' offset='0'/><stop stop-color='rgba(21,24,29,${to})' offset='1'/>` +
    `</radialGradient></defs></svg>`;
  return `url("data:image/svg+xml;utf8,${svg}")`;
}

function ProjectRow({ link, last }: { link: ProjectLink; last: boolean }) {
  // a row lights up (and its arrow nudges right) when it is hovered itself,
  // and every row in the card lights up when the photo is hovered — so on
  // EasySBC each bar glows on its own, and both glow from the picture
  const className = `group/row flex items-center justify-between p-3 sm:p-6 border-x border-t ${
    last ? 'border-b rounded-b-2xl' : ''
  } ${surface} transition-colors hover:bg-[#252930] focus-visible:bg-[#252930] group-has-[.project-photo:hover]/card:bg-[#252930] group-has-[.project-photo:focus-visible]/card:bg-[#252930]`;
  const content = (
    <>
      <p className="text-[16px] font-medium leading-[1.5]">
        <span className="block text-white">{link.title}</span>
        <span className="block" style={{ color: ACCENT }}>
          {link.tag}
        </span>
      </p>
      <img
        src={arrow}
        alt=""
        width={7}
        height={12}
        className={`shrink-0 transition-transform group-hover/row:translate-x-1 group-focus-visible/row:translate-x-1 group-has-[.project-photo:hover]/card:translate-x-1 group-has-[.project-photo:focus-visible]/card:translate-x-1`}
      />
    </>
  );
  return link.href ? (
    <a href={link.href} className={className}>
      {content}
    </a>
  ) : (
    <div className={className}>{content}</div>
  );
}

function ProjectCard({
  image,
  alt,
  shade,
  outlined,
  href,
  links,
}: {
  image: string;
  alt: string;
  shade?: Shade;
  outlined?: boolean; // thin blue frame around the photo (Hobby Projects)
  href?: string;
  links: ProjectLink[];
}) {
  const photo = (
    <>
      <img src={image} alt={alt} width={280} height={260} className="block w-full aspect-[280/260] object-cover" />
      {shade && (
        /* shadow layer — fades out while the card is hovered or focused */
        <span
          aria-hidden
          className="absolute inset-0 transition-opacity duration-300 group-hover/card:opacity-0 group-focus-within/card:opacity-0"
          style={{ backgroundImage: shadeBackground(shade), backgroundSize: '100% 100%' }}
        />
      )}
      <span
        aria-hidden
        className={`absolute inset-0 rounded-t-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] ${
          outlined ? 'border-x border-t border-[rgba(46,172,255,0.2)]' : ''
        }`}
      />
    </>
  );
  const photoClass = 'project-photo relative block overflow-hidden rounded-t-2xl';
  return (
    <div className="group/card flex flex-col w-[175px] sm:w-[280px] shrink-0 snap-start [filter:drop-shadow(0_12px_6px_rgba(0,0,0,0.25))]">
      {href ? (
        <a href={href} className={`${photoClass} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]`}>
          {photo}
        </a>
      ) : (
        <div className={photoClass}>{photo}</div>
      )}
      {links.map((link, i) => (
        <ProjectRow key={link.title + link.tag} link={link} last={i === links.length - 1} />
      ))}
    </div>
  );
}

// round arrow button that sits over the faded edge of the project strip.
// The clickable area is a tall invisible strip (photo height, 96px wide on
// desktop, 64px on phones) so
// it's easy to hit; the visible circle sits inside it. On hover the circle
// brightens and the arrow nudges in the direction it scrolls.
function ScrollButton({ side, hidden, onClick }: { side: 'left' | 'right'; hidden: boolean; onClick: () => void }) {
  const left = side === 'left';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={hidden}
      aria-label={left ? 'Scroll projects left' : 'Scroll projects right'}
      className={`group/scroll absolute top-0 h-[163px] sm:h-[260px] w-16 sm:w-24 z-10 flex items-center px-1.5 sm:px-2.5 cursor-pointer transition-opacity duration-300 focus-visible:outline-none ${
        left ? 'left-0 justify-start' : 'right-0 justify-end'
      } ${hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <span className="rounded-full p-[13px] sm:p-3 border border-white/20 sm:border-0 bg-[rgba(70,84,109,0.4)] sm:bg-white/10 backdrop-blur-[4px] transition-colors duration-300 group-hover/scroll:bg-white/20 group-focus-visible/scroll:bg-white/20 group-focus-visible/scroll:outline-2 group-focus-visible/scroll:outline-offset-2 group-focus-visible/scroll:outline-[var(--accent)]">
        <img
          src={chevronLarge}
          alt=""
          width={24}
          height={24}
          className={`block transition-transform duration-300 ${
            left
              ? 'rotate-180 group-hover/scroll:-translate-x-1 group-focus-visible/scroll:-translate-x-1'
              : 'group-hover/scroll:translate-x-1 group-focus-visible/scroll:translate-x-1'
          }`}
        />
      </span>
    </button>
  );
}

function Projects() {
  const scroller = useRef<HTMLDivElement>(null);
  // which ends of the strip are reached — drives the fades and arrow buttons
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft >= max - 2 });
    };
    // ResizeObserver also fires once right away, which sets the initial state
    const ro = new ResizeObserver(update);
    ro.observe(el);
    el.addEventListener('scroll', update, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', update);
    };
  }, []);

  // move by as many whole cards as fit in view (at least one); the card
  // width and gap are read from the page so this works at every screen size
  const scrollCards = (dir: 1 | -1) => {
    const el = scroller.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    const step = card.offsetWidth + parseFloat(getComputedStyle(el).columnGap || '0');
    const cards = Math.max(1, Math.floor(el.clientWidth / step) - 1);
    el.scrollBy({ left: dir * cards * step, behavior: 'smooth' });
  };

  // edge fades are desktop-only; on phones the cut-off card already says "swipe"
  const fade = 'hidden sm:block absolute top-0 bottom-0 w-[250px] pointer-events-none transition-opacity duration-300';

  return (
    <section id="projects" className="flex flex-col gap-4 sm:gap-6 w-full scroll-mt-28">
      <SectionTitle>Projects</SectionTitle>
      <div className="relative -mx-4 sm:mx-0">
        <div
          ref={scroller}
          role="region"
          aria-label="Projects"
          tabIndex={0}
          className="flex gap-4 sm:gap-6 items-start overflow-x-auto snap-x snap-proximity scroll-px-4 sm:scroll-px-0 px-4 sm:px-0 pb-6 -mb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-none"
        >
          <ProjectCard
            image={projectEasySBC}
            alt="The EasySBC team at AWS Summit Stockholm"
            href={EASYSBC_URL}
            shade={{ matrix: '-4.3647 20.487 -22.063 -4.692 171.29 83.101', from: 0, to: 1 }}
            links={[
              { title: 'EasySBC', tag: 'AI, Platform', href: '#coming-soon/easysbc-ai' },
              { title: 'EasySBC', tag: 'UX / UI', href: '#easysbc' },
            ]}
          />
          <ProjectCard
            image={projectFruit}
            alt="Object detection demo from the fruit sorting project"
            href="#fruit-sorting"
            shade={{ matrix: '8.8118 23.943 -25.785 9.4724 106.24 52.658', from: 0, to: 1 }}
            links={[{ title: 'Humble, Lego', tag: 'Fruit Sorting AI', href: '#fruit-sorting' }]}
          />
          <ProjectCard
            image={projectNovo}
            alt="Colleagues at Novo Nordisk"
            href="#coming-soon/novo-nordisk"
            shade={{ matrix: '6.4 17 -18.308 6.8801 193.5 90', from: 0.1, to: 0.8 }}
            links={[{ title: 'Novo Nordisk', tag: 'CI/CD, ML', href: '#coming-soon/novo-nordisk' }]}
          />
          <ProjectCard
            image={projectAiTalks}
            alt="Asger giving a talk on AI"
            href="#coming-soon/ai-talks"
            shade={{ matrix: '-1.4824 18.184 -19.582 -1.5935 154.82 78.165', from: 0, to: 1 }}
            links={[{ title: 'AI Talks', tag: 'Explainer, Arts', href: '#coming-soon/ai-talks' }]}
          />
          <ProjectCard
            image={projectHobby}
            alt="A white cube floating over a glowing blue grid"
            outlined
            href="#coming-soon/hobby-projects"
            links={[{ title: 'Hobby Projects', tag: 'Game Dev', href: '#coming-soon/hobby-projects' }]}
          />
        </div>
        {/* edge fades into the page background, shown only where there's more to scroll */}
        <div
          aria-hidden
          className={`${fade} left-0 bg-gradient-to-r from-[#15181d] to-[rgba(21,24,29,0)] ${edges.start ? 'opacity-0' : 'opacity-100'}`}
        />
        <div
          aria-hidden
          className={`${fade} right-0 bg-gradient-to-l from-[#15181d] to-[rgba(21,24,29,0)] ${edges.end ? 'opacity-0' : 'opacity-100'}`}
        />
        <ScrollButton side="left" hidden={edges.start} onClick={() => scrollCards(-1)} />
        <ScrollButton side="right" hidden={edges.end} onClick={() => scrollCards(1)} />
      </div>
    </section>
  );
}

/* ---------------------------------- career --------------------------------- */

function Logo({ src }: { src: string }) {
  return (
    <img
      src={src}
      alt=""
      width={42}
      height={42}
      className="size-[42px] shrink-0 rounded-full border border-white/[0.04] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
    />
  );
}

function Years({ children }: { children: ReactNode }) {
  return <span style={{ color: ACCENT }}>{children}</span>;
}

type Role = { title: string; years: string; details: string[] };

type Entry = {
  logo: string;
  title: ReactNode;
  subtitle: string;
  // either expandable roles (Work Experience / Education) or a fixed body (Others)
  roles?: Role[];
  body?: ReactNode;
};

// height animation for the fold-out details: a one-row grid going from 0fr
// to 1fr animates to the content's natural height without measuring it
function Collapsible({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
        open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
      }`}
      aria-hidden={!open}
      inert={!open}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

function Roles({ roles, open, id }: { roles: Role[]; open: boolean; id: string }) {
  return (
    <div id={id} className={`flex flex-col transition-[gap] duration-300 ${open ? 'gap-1' : 'gap-2'}`}>
      {roles.map((role) => (
        <div key={role.title}>
          <p>
            {role.title} <Years>| {role.years}</Years>
          </p>
          <Collapsible open={open}>
            <ul className="mt-1 pb-4 ml-[21px] list-disc flex flex-col gap-1 text-white/60">
              {role.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </Collapsible>
        </div>
      ))}
    </div>
  );
}

function EntryRow({ entry, position }: { entry: Entry; position: 'first' | 'middle' | 'last' | 'only' }) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  // full-bleed square rows on phones, rounded card stack from sm up
  const radius =
    position === 'first'
      ? 'sm:rounded-t-2xl'
      : position === 'last'
        ? 'sm:rounded-b-2xl'
        : position === 'only'
          ? 'sm:rounded-2xl'
          : '';
  const title = typeof entry.title === 'string' ? entry.title : entry.subtitle;
  // Work/Education fold on every screen; Others only fold on phones (on
  // desktop their description is always visible)
  const foldsEverywhere = !!entry.roles;
  return (
    <div
      // the whole bar toggles the details; the arrow button inside is what
      // keyboard users tab to, and its click bubbles up to this handler
      onClick={() => setOpen((o) => !o)}
      className={`group/entry flex items-center justify-between gap-2 sm:gap-4 px-2 py-4 sm:p-6 border-t sm:border-x ${radius} ${surface} transition-colors ${
        foldsEverywhere
          ? 'cursor-pointer hover:bg-[#252930] has-[button:focus-visible]:bg-[#252930]'
          : 'max-sm:cursor-pointer'
      }`}
    >
      <div className={`flex flex-col min-w-0 flex-1 ${foldsEverywhere ? 'gap-4' : ''}`}>
        <div className="flex items-start gap-2 sm:gap-4">
          <Logo src={entry.logo} />
          <div className="text-[14px] font-bold leading-[1.5] min-w-0">
            <p className="text-white">{entry.title}</p>
            <p className="text-white/50">{entry.subtitle}</p>
          </div>
        </div>
        {entry.roles ? (
          <div className="pl-[50px] sm:pl-[58px] text-[14px] font-medium leading-[1.5] text-white">
            <Roles roles={entry.roles} open={open} id={detailsId} />
          </div>
        ) : (
          // Others: same 0fr → 1fr height animation as the role details, but
          // only on phones — from sm up it's always open
          <div
            id={detailsId}
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out sm:grid-rows-[1fr] sm:opacity-100 ${
              open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="overflow-hidden">
              <div className="pt-2 pl-[50px] sm:pl-[58px] text-[14px] font-medium leading-[1.5] text-white">{entry.body}</div>
            </div>
          </div>
        )}
      </div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={detailsId}
        aria-label={`${open ? 'Hide' : 'Show'} details for ${title}`}
        className={`self-start sm:self-center shrink-0 rounded-lg bg-white/10 group-hover/entry:bg-white/20 p-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
          foldsEverywhere ? '' : 'sm:hidden'
        }`}
      >
        <img
          src={chevron}
          alt=""
          width={16}
          height={16}
          className={`block transition-transform duration-300 ${
            open ? 'rotate-180 group-hover/entry:-translate-y-0.5' : 'group-hover/entry:translate-y-0.5'
          }`}
        />
      </button>
    </div>
  );
}

function EntryGroup({ label, entries }: { label: string; entries: Entry[] }) {
  return (
    <div className="flex flex-col gap-2 sm:gap-2.5 w-full">
      <h3 className="sm:px-3 text-[16px] font-bold leading-[1.5]" style={{ color: ACCENT }}>
        {label}
      </h3>
      <div className="flex flex-col -mx-4 sm:mx-0">
        {entries.map((entry, i) => (
          <EntryRow
            key={entry.subtitle}
            entry={entry}
            position={entries.length === 1 ? 'only' : i === 0 ? 'first' : i === entries.length - 1 ? 'last' : 'middle'}
          />
        ))}
      </div>
    </div>
  );
}

const work: Entry[] = [
  {
    logo: logoEasySBC,
    title: 'EasySBC',
    subtitle: 'Co-Founder – Office at Matrikel1',
    roles: [
      {
        title: 'UX/Product Engineer',
        years: '2023 - 2026',
        details: [
          'Owned frontend architecture and UI/UX systems for a platform scaling to 100,000+ daily users.',
          'Led design and code reviews across a team of 3 designers/developers, and drove product',
        ],
      },
      {
        title: 'AI Engineer',
        years: '2021 - 2023',
        details: [
          'Co-founded the company and designed its core algorithmic system, taking it from proof-of-concept to a production system underpinning the entire platform.',
          'Built the initial system architecture and data pipelines end-to-end, and validated product-market fit through iterative user testing.',
        ],
      },
    ],
  },
  {
    logo: logoNovo,
    title: 'Novo Nordisk',
    subtitle: 'Manufacturing Intelligence',
    roles: [
      {
        title: 'Data Engineer (Student Assistant)',
        years: '2020 - 2022',
        details: [
          'Built and deployed anomaly detection models on AWS SageMaker as part of a predictive maintenance system for production lines, covering data processing, data augmentation, model training and evaluation.',
          'Conducted user interviews with plant engineers to guide feature prioritisation for internal production tools.',
        ],
      },
      {
        title: 'Data Engineer Intern',
        years: '2020',
        details: [
          'Contributed to the predictive maintenance system for production lines and built CI/CD pipelines using Azure DevOps and AWS.',
        ],
      },
    ],
  },
];

const education: Entry[] = [
  {
    logo: logoDtu,
    title: 'Technical University of Denmark',
    subtitle: 'DTU Compute',
    roles: [
      {
        title: 'MSc, Human-Centred Artificial Intelligence',
        years: '2020 - 2023',
        details: [
          'Specialised in deep learning and large-scale data systems.',
          "Master's thesis: trained and benchmarked computer vision models for automated fruit sorting, built the full inference pipeline, and an app for easy data annotation.",
        ],
      },
      {
        title: 'BSc, Software Engineering',
        years: '2016 - 2019',
        details: ['Broad foundation in programming, systems, and databases.'],
      },
    ],
  },
  {
    logo: logoUcsc,
    title: 'University of California, Santa Cruz',
    subtitle: 'Computer Engineering',
    roles: [
      {
        title: 'Graduate Exchange Student',
        years: '2018',
        details: [
          'Coursework in Object-Oriented Programming, Functional Programming, Game Theory, and Operating Systems.',
        ],
      },
    ],
  },
];

const others: Entry[] = [
  {
    logo: logoAiTalks,
    title: (
      <>
        AI Talks <Years>| 2026, 2024</Years>
      </>
    ),
    subtitle: 'Varde Art Association, Folk & Kultur',
    body: <p>Public speaker on AI development and its societal implications</p>,
  },
  {
    logo: logoSkylab,
    title: (
      <>
        DTU Skylab Startup Accelerator <Years>| 2021 - 2024</Years>
      </>
    ),
    subtitle: 'Technical University of Denmark',
    body: <p>Founder &amp; Participant (2021-2024): fundraising, customer acquisition, and early-stage venture growth strategy.</p>,
  },
  {
    logo: logoRegensen,
    title: (
      <>
        Chair Person <Years>| 2022</Years>
      </>
    ),
    subtitle: 'Regensen Collegium',
    body: (
      <p>
        Elected by the collegium's 100+ residents to a one-semester term as Chairperson, acting as daily operational
        lead, external representative, and decision-maker for the community. Led and organized the semester's
        events, and managed external communications and conflict resolution.
      </p>
    ),
  },
];

function Career() {
  return (
    <section id="career" className="flex flex-col gap-4 sm:gap-6 w-full scroll-mt-28">
      <SectionTitle>Career</SectionTitle>
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-10 lg:gap-14 items-start">
        <div className="flex flex-col gap-6 flex-1 min-w-0 w-full">
          <EntryGroup label="Work Experience" entries={work} />
          <EntryGroup label="Education" entries={education} />
        </div>
        <div className="w-full lg:w-[456px] shrink-0">
          <EntryGroup label="Others" entries={others} />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------- contact -------------------------------- */

function Contact() {
  const link = 'text-[16px] sm:text-[20px] font-medium leading-[1.5] hover:text-white transition-colors';
  return (
    <section id="contact" className="flex flex-col gap-4 sm:gap-6 w-full scroll-mt-28">
      <SectionTitle>
        Contact{' '}
        <em className="font-bold" style={{ color: ACCENT }}>
          – Hit me up!
        </em>
      </SectionTitle>
      <div
        className={`flex flex-row -mx-4 sm:mx-0 sm:w-full max-w-[680px] overflow-hidden sm:rounded-[32px] sm:border ${surface}`}
      >
        <div className="flex flex-col justify-center gap-6 sm:gap-8 p-4 sm:p-10 h-[286px] sm:h-auto shrink-0 sm:shrink sm:flex-1 sm:min-w-0">
          <div className="flex flex-col gap-2">
            <p className="text-[16px] sm:text-[20px] font-bold leading-[1.4] text-white">Asger Graesholt</p>
            <a href="mailto:asgerfg@hotmail.com" className={`${link} w-fit`} style={{ color: ACCENT }}>
              asgerfg@hotmail.com
            </a>
            <a href="tel:+16283165902" className={`${link} w-fit`} style={{ color: ACCENT }}>
              +1 (628) 316-5902
            </a>
          </div>
          <address className="not-italic flex flex-col gap-2 text-[16px] sm:text-[20px] font-medium leading-[1.5] text-[#8e9092]">
            <p>94110, San Francisco</p>
            <p>California, US</p>
          </address>
          <div className="flex items-center gap-2">
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:opacity-80 transition-opacity">
              <InstagramIcon className="block size-12" />
            </a>
            <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="hover:opacity-80 transition-opacity">
              <LinkedinIcon className="block size-12" />
            </a>
          </div>
        </div>
        <img
          src={contactPhoto}
          alt="Asger giving two thumbs up on a mountain top"
          width={293}
          height={364}
          className="block flex-1 min-w-0 h-[286px] sm:h-auto sm:flex-none sm:w-[293px] object-cover sm:border-l border-white/30"
        />
      </div>
    </section>
  );
}

/* ----------------------------------- page ---------------------------------- */

function Home() {
  return (
    <div className="min-h-screen bg-[#15181d] text-white overflow-x-clip" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Header />
      <main className="mx-auto max-w-[1192px] box-content px-4 sm:px-8 xl:px-11 pt-10 sm:pt-[59px] pb-10 sm:pb-24 flex flex-col gap-20 sm:gap-[100px]">
        <Hero />
        <Welcome />
        <Projects />
        <Career />
        <Contact />
      </main>
    </div>
  );
}

export default Home;
