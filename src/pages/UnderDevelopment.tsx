// placeholder for projects whose write-up isn't published yet. Reached via
// "#coming-soon/<slug>" from the project cards on the front page; the slug
// only picks which project name to show.
import { LogoMark } from '../components/AccentIcons';

const PROJECT_NAMES: Record<string, string> = {
  'easysbc-ai': 'EasySBC – AI & Platform',
  'novo-nordisk': 'Novo Nordisk',
  'ai-talks': 'AI Talks',
  'hobby-projects': 'Hobby Projects',
};

function UnderDevelopment({ slug }: { slug?: string }) {
  const name = slug ? PROJECT_NAMES[slug] : undefined;
  return (
    <div
      className="min-h-screen bg-[#15181d] text-white flex items-center justify-center px-4 py-16"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="w-full max-w-[520px] flex flex-col items-center text-center gap-6 rounded-[32px] border border-white/[0.04] bg-[#1e2126] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] px-6 py-12 sm:px-12">
        <LogoMark className="size-16" />
        <div className="flex flex-col gap-2">
          {name && (
            <p className="text-[14px] font-bold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>
              {name}
            </p>
          )}
          <h1 className="text-[28px] sm:text-[32px] font-bold leading-[1.3]">Site under development 🚧</h1>
        </div>
        <p className="text-[16px] font-medium leading-[1.6] text-white/70">
          I'm still putting this one together — check back soon. Curious in the meantime? Just reach out at{' '}
          <a href="mailto:asgerfg@hotmail.com" className="underline-offset-4 hover:underline" style={{ color: 'var(--accent)' }}>
            asgerfg@hotmail.com
          </a>
          .
        </p>
        <a
          href="#"
          className="group mt-2 inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-5 py-3 text-[16px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span> Back to the front page
        </a>
      </div>
    </div>
  );
}

export default UnderDevelopment;
