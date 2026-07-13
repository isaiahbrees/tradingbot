/**
 * Decorative equity-curve card for the login page's visual panel.
 * Pure SVG — no data, no dependencies; clearly labeled as demo.
 */
export function LoginBackdrop() {
  // A believable equity curve: grinds up, draws down, recovers.
  const points =
    "0,64 20,60 40,62 60,54 80,56 100,47 120,50 140,41 160,44 180,34 " +
    "200,38 220,42 240,36 260,28 280,31 300,22 320,26 340,17 360,20 380,10";

  return (
    <div className="mt-8 overflow-hidden rounded-lg border border-white/10 bg-neutral-900/80">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="text-xs font-medium text-neutral-300">Account growth</span>
        <span className="font-mono text-xs text-emerald-400">+18.4% · 90d</span>
      </div>
      <div className="relative px-4 py-3">
        <svg viewBox="0 0 380 80" className="h-24 w-full" aria-hidden="true">
          <defs>
            <linearGradient id="login-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Hairline grid */}
          {[20, 40, 60].map((y) => (
            <line key={y} x1="0" y1={y} x2="380" y2={y} stroke="#ffffff" strokeOpacity="0.06" />
          ))}
          <polygon points={`0,80 ${points} 380,80`} fill="url(#login-fill)" />
          <polyline
            points={points}
            fill="none"
            stroke="#34d399"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* End marker with surface ring */}
          <circle cx="380" cy="10" r="4" fill="#34d399" stroke="#171717" strokeWidth="2" />
        </svg>
        <span className="absolute bottom-1.5 right-4 font-mono text-[10px] text-neutral-500">
          demo data
        </span>
      </div>
    </div>
  );
}
