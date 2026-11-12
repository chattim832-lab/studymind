import React from "react";

// Positions des arbres dans l'illustration
const trees = [
  [28, 490, 1.15],
  [96, 515, 0.86],
  [174, 560, 1.08],
  [248, 490, 0.82],
  [350, 555, 1.05],
  [445, 495, 0.90],
  [525, 540, 1.20],
  [577, 485, 0.90],
];

// Petites lumieres dans la foret
const flowers = Array.from({ length: 90 }, (_, index) => ({
  x: (index * 61 + 13) % 600,
  y: 410 + ((index * 89 + 7) % 340),
  radius: index % 7 === 0 ? 3.8 : 1.6,
}));

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}) {
  const shades = [
    "#F8CCAA",
    "#F2C1A3",
    "#CD9FA0",
    "#A4B3A9",
  ];

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#E9E3E5] px-4 py-8 text-[#525871] sm:px-7">

      {/* CARTE PRINCIPALE */}
      <div className="grid w-full max-w-[1050px] overflow-hidden rounded-[28px] bg-white shadow-2xl md:grid-cols-2">

        {/* PARTIE GAUCHE : ILLUSTRATION */}
        <aside className="relative hidden min-h-[650px] overflow-hidden bg-[#29344F] md:block">

          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 600 760"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <defs>
              {/* Ciel */}
              <linearGradient
                id="authSky"
                x1="0"
                y1="0"
                x2="0.5"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#182441"
                />
                <stop
                  offset="55%"
                  stopColor="#525871"
                />
                <stop
                  offset="100%"
                  stopColor="#857C91"
                />
              </linearGradient>

              {/* Montagnes */}
              <linearGradient
                id="authHill"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#566F77"
                />
                <stop
                  offset="100%"
                  stopColor="#253D55"
                />
              </linearGradient>

              {/* Lumiere de la lune */}
              <radialGradient id="authGlow">
                <stop
                  offset="0%"
                  stopColor="#F8CCAA"
                  stopOpacity="0.55"
                />
                <stop
                  offset="100%"
                  stopColor="#F8CCAA"
                  stopOpacity="0"
                />
              </radialGradient>
            </defs>

            {/* FOND */}
            <rect
              width="600"
              height="760"
              fill="url(#authSky)"
            />

            {/* LUNE */}
            <circle
              cx="456"
              cy="175"
              r="172"
              fill="url(#authGlow)"
            />

            <circle
              cx="453"
              cy="181"
              r="48"
              fill="#F8CCAA"
              opacity="0.94"
            />

            <circle
              cx="470"
              cy="164"
              r="47"
              fill="#29344F"
              opacity="0.24"
            />

            {/* MONTAGNES */}
            <path
              d="M0 395 Q90 325 183 389 Q273 320 360 373 Q494 288 600 379 V760 H0Z"
              fill="#758392"
              opacity="0.65"
            />

            <path
              d="M0 468 Q105 375 215 451 Q340 360 458 436 Q530 400 600 450 V760 H0Z"
              fill="#4D6778"
            />

            <path
              d="M0 532 Q134 443 280 520 Q426 434 600 495 V760 H0Z"
              fill="url(#authHill)"
            />

            <path
              d="M0 615 Q164 513 320 593 Q456 540 600 601 V760 H0Z"
              fill="#1F3A50"
            />

            <path
              d="M0 691 Q166 622 320 682 Q477 625 600 687 V760 H0Z"
              fill="#172D45"
            />

            {/* ARBRES */}
            {trees.map(([x, y, scale], index) => (
              <g
                key={index}
                transform={
                  "translate(" +
                  x +
                  " " +
                  y +
                  ") scale(" +
                  scale +
                  ")"
                }
                opacity="0.95"
              >
                {/* Tronc */}
                <path
                  d="M0 0 V175"
                  stroke="#1B3348"
                  strokeWidth="8"
                />

                {/* Feuillage */}
                <path
                  d="M0 -80 L-47 15 L-24 15 L-67 82 L-35 82 L-81 134 L81 134 L35 82 L67 82 L24 15 L47 15Z"
                  fill={
                    index % 2 === 0
                      ? "#264758"
                      : "#34596A"
                  }
                />
              </g>
            ))}

            {/* PETITES FLEURS */}
            {flowers.map((flower, index) => (
              <circle
                key={index}
                cx={flower.x}
                cy={flower.y}
                r={flower.radius}
                fill={shades[index % shades.length]}
                opacity="0.75"
              />
            ))}

          </svg>

          {/* LOGO */}
          <div className="absolute left-10 top-10 z-10 text-sm font-semibold tracking-widest text-white">
            STUDYMIND
          </div>

          {/* WELCOME */}
          <div className="absolute inset-x-6 top-[27%] z-10 text-center text-white">

            <h2 className="text-4xl font-light tracking-widest lg:text-5xl">
              WELCOME
            </h2>

            <p className="mt-4 font-serif text-xl italic text-[#F8CCAA]">
              Your peaceful learning space
            </p>

          </div>

          {/* TEXTE EN BAS */}
          <p className="absolute bottom-9 left-10 z-10 text-xs tracking-widest text-white/80">
            LEARN • GROW • BLOOM
          </p>

        </aside>

        {/* PARTIE DROITE : FORMULAIRE */}
        <section className="flex min-h-[590px] flex-col px-7 py-8 sm:px-11 md:min-h-[650px] lg:px-16">

          {/* LOGO MOBILE */}
          <div className="mb-6 font-serif text-2xl md:hidden">
            StudyMind ♡
          </div>

          {/* FORMULAIRE */}
          <div className="flex flex-1 items-center">

            <div className="w-full">

              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#CD9FA0]">
                Your study space
              </p>

              <h1 className="font-serif text-4xl text-[#29344F] sm:text-5xl">
                {title}
              </h1>

              <p className="mt-4 text-sm leading-6 text-[#857C91]">
                {subtitle}
              </p>

              <div className="mt-9">
                {children}
              </div>

            </div>

          </div>

          {/* LIEN LOGIN / REGISTER */}
          <div className="pt-8 text-center text-sm text-[#857C91]">
            {footer}
          </div>

        </section>

      </div>

    </main>
  );
}