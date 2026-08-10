// blank canvas for the entrepreneur/software section — start point for
// animation work. Kept empty on purpose; build up from here.
function Playground() {
  return (
    <div className="min-h-screen bg-[#15181D] text-white flex flex-col">
      <div className="max-w-xl w-full mx-auto px-6 pt-10 pb-10 flex flex-col flex-1">
        <a href="#" className="text-sm text-white/40 hover:text-white/70 transition-colors">
          ← Back
        </a>

        <div
          className="mt-8 rounded-xl p-6 flex-1"
          style={{
            backgroundColor: '#1E2126',
            border: '1px solid rgba(255,255,255,0.04)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          {/* main text goes here */}
        </div>
      </div>
    </div>
  );
}

export default Playground;
