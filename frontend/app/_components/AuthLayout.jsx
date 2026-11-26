import Link from "next/link";

// Shared visual structure for Login and Register.
// The landscape is drawn in SVG, so no image file is required.
export default function AuthLayout({ title, subtitle, children, footer }) {
  const trees = [
    [28, 490, 1.15], [96, 515, 0.86], [174, 560, 1.08],
    [248, 490, 0.82], [350, 555, 1.05], [445, 495, 0.90],
    [525, 540, 1.20], [577, 485, 0.90],
  ];

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#D6E9ED] px-4 py-8 text-[#684F48] sm:px-7">
      <div className="grid w-full max-w-[1050px] overflow-hidden rounded-[28px] bg-white shadow-[0_24px_75px_rgba(82,88,113,0.20)] md:grid-cols-2">

        {/* Illustration inspired by the reference's dark, dreamy forest */}
        <aside className="relative hidden min-h-[650px] overflow-hidden bg-[#684F48] md:block">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 600 760"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="authSky" x1="0" y1="0" x2="0.5" y2="1">
                <stop offset="0%" stopColor="#4D3A35" />
                <stop offset="55%" stopColor="#684F48" />
                <stop offset="100%" stopColor="#7B969A" />
              </linearGradient>
              <linearGradient id="authHill" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#93A8AD" />
                <stop offset="100%" stopColor="#684F48" />
              </linearGradient>
              <radialGradient id="authGlow">
                <stop offset="0%" stopColor="#F9E7C7" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#F9E7C7" stopOpacity="0" />
              </radialGradient>
            </defs>

            <rect width="600" height="760" fill="url(#authSky)" />
            <circle cx="456" cy="175" r="172" fill="url(#authGlow)" />
            <circle cx="453" cy="181" r="48" fill="#F9E7C7" opacity="0.94" />
            <circle cx="470" cy="164" r="47" fill="#684F48" opacity="0.24" />

            <path d="M0 395 Q90 325 183 389 Q273 320 360 373 Q494 288 600 379 V760 H0Z" fill="#D6E9ED" opacity="0.65" />
            <path d="M0 468 Q105 375 215 451 Q340 360 458 436 Q530 400 600 450 V760 H0Z" fill="#93A8AD" />
            <path d="M0 532 Q134 443 280 520 Q426 434 600 495 V760 H0Z" fill="url(#authHill)" />
            <path d="M0 615 Q164 513 320 593 Q456 540 600 601 V760 H0Z" fill="#684F48" />
            <path d="M0 691 Q166 622 320 682 Q477 625 600 687 V760 H0Z" fill="#503B35" />

            {trees.map(([x, y, scale], index) => (
              <g key={index} transform={`translate(${x} ${y}) scale(${scale})`} opacity="0.95">
                <path d="M0 0 V175" stroke="#684F48" strokeWidth="8" />
                <path d="M0 -80 L-47 15 L-24 15 L-67 82 L-35 82 L-81 134 L81 134 L35 82 L67 82 L24 15 L47 15Z" fill={index % 2 === 0 ? "#93A8AD" : "#93A8AD"} />
                <path d="M0 -80 L-47 15 L-24 15 L-67 82 L0 82Z" fill="#D6E9ED" opacity="0.42" />
              </g>
            ))}

            {Array.from({ length: 120 }, (_, index) => {
              const x = (index * 61 + 13) % 600;
              const y = 410 + ((index * 89 + 7) % 340);
              const shades = ["#F9E7C7", "#F9E7C7", "#93A8AD", "#93A8AD"];
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r={index % 7 === 0 ? 3.8 : 1.6}
                  fill={shades[index % shades.length]}
                  opacity={index % 3 === 0 ? 0.9 : 0.55}
                />
              );
            })}
          </svg>

          <div className="absolute left-10 top-10 z-10 text-sm font-semibold tracking-[0.28em] text-white/90">
            STUDYMIND
          </div>

          <div className="absolute inset-x-6 top-[27%] z-10 text-center text-white">
            <p className="text-[36px] font-light tracking-[0.3em] lg:text-[46px]">
              WELCOME
            </p>
            <p className="mt-3 font-serif text-xl italic text-[#F9E7C7]">
              Your peaceful learning space
            </p>
          </div>

          <p className="absolute bottom-9 left-10 z-10 text-xs tracking-widest text-white/80">
            LEARN • GROW • BLOOM
          </p>
        </aside>

        {/* White minimalist form column */}
        <section className="flex min-h-[590px] flex-col px-7 py-8 sm:px-11 md:min-h-[650px] lg:px-16">
          <div className="mb-6 font-serif text-2xl md:hidden">StudyMind ♡</div>

          <div className="flex flex-1 items-center">
            <div className="w-full">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.23em] text-[#93A8AD]">
                Your study space
              </p>
              <h1 className="font-serif text-4xl text-[#684F48] sm:text-5xl">{title}</h1>
              <p className="mt-4 text-sm leading-6 text-[#7B969A]">{subtitle}</p>
              <div className="mt-9">{children}</div>
            </div>
          </div>

          <div className="pt-8 text-center text-sm text-[#7B969A]">
            {footer}
          </div>
        </section>
      </div>
    </main>
  );
}