// simple landing page — just enough to introduce the site and link into
// the EasySBC case study page. Kept deliberately minimal for now; more
// projects can be added to the list below as they're written up.
function Home() {
  return (
    <div className="min-h-screen bg-[#15181D] text-white flex items-center">
      <div className="max-w-xl mx-auto px-6">
        <p className="text-sm text-white/50 mb-2">Portfolio</p>
        <h1 className="text-3xl font-semibold mb-4">Asger</h1>
        <p className="text-white/70 mb-10">
          A look at how I approach design and product work, told through the projects I've built.
        </p>

        <a
          href="#easysbc"
          className="group block rounded-xl border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-colors px-6 py-5"
        >
          <p className="text-lg font-medium mb-1">EasySBC</p>
          <p className="text-sm text-white/60">
            Color system, UI components, and product structure for a FIFA squad-building tool.
          </p>
          <p className="text-sm text-white/40 mt-3 group-hover:text-white/70 transition-colors">
            View case study →
          </p>
        </a>

        <a
          href="#playground"
          className="group block rounded-xl border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-colors px-6 py-5 mt-4"
        >
          <p className="text-lg font-medium mb-1">Entrepreneur & Software</p>
          <p className="text-sm text-white/60">
            Work in progress.
          </p>
          <p className="text-sm text-white/40 mt-3 group-hover:text-white/70 transition-colors">
            Explore →
          </p>
        </a>

        <a
          href="#fruit-sorting"
          className="group block rounded-xl border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-colors px-6 py-5 mt-4"
        >
          <p className="text-lg font-medium mb-1">Fruit Sorting — Humble</p>
          <p className="text-sm text-white/60">
            Work in progress.
          </p>
          <p className="text-sm text-white/40 mt-3 group-hover:text-white/70 transition-colors">
            Explore →
          </p>
        </a>
      </div>
    </div>
  );
}

export default Home;
