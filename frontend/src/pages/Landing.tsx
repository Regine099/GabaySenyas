import { useEffect } from 'react';

type IconName = 'camera' | 'message' | 'chart' | 'check' | 'arrow' | 'route' | 'book';

const ICONS: Record<IconName, JSX.Element> = {
  camera: (
    <>
      <path d="M14.5 5 16 7.5h3a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5a2 2 0 0 1 2-2h3L9.5 5h5Z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  message: (
    <>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
      <path d="m8 11 2.5 2.5L16 8" />
    </>
  ),
  chart: <path d="M4 20V10m6 10V4m6 16v-7m4 7H2" />,
  check: <path d="m5 12 4 4L19 6" />,
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <path d="M8 18h4a6 6 0 0 0 6-6V8" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" />
      <path d="M8 8h8M8 12h6" />
    </>
  ),
};

function Icon({ name, className = 'size-5' }: { name: IconName; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[name]}
    </svg>
  );
}

// ---------- shared styles (Tailwind) ----------
const WRAP = 'mx-auto max-w-6xl px-5 sm:px-8';
const EYEBROW = 'text-sm font-extrabold uppercase tracking-[0.14em]';
const H2 = 'mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl sm:leading-10';
const BTN = 'inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5';
const FOCUS =
  '[&_a:focus-visible]:rounded-lg [&_a:focus-visible]:outline [&_a:focus-visible]:outline-[3px] [&_a:focus-visible]:outline-offset-[3px] [&_a:focus-visible]:outline-[#079a9f]';

// ---------- content ----------
const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'camera', title: 'Capture and detection', text: 'Uses a webcam to capture hand gestures and detect hand landmarks in real time.' },
  { icon: 'route', title: 'Sequence analysis', text: 'Processes landmark sequences with a machine-learning model to recognize defined FSL signs.' },
  { icon: 'message', title: 'Accuracy scoring', text: 'Compares each attempt with a validated reference sequence to generate a signing score.' },
  { icon: 'check', title: 'Adaptive learning', text: 'Adjusts lesson order and difficulty based on the learner’s performance history.' },
  { icon: 'book', title: 'Lesson library', text: 'Provides structured, difficulty-tiered FSL vocabulary with demonstration videos or images.' },
  { icon: 'chart', title: 'Performance analytics', text: 'Tracks learner progress and presents useful performance information to learners and administrators.' },
];

const PHASES = [
  ['1', 'Learn', 'Watch a clear FSL sign demonstration.'],
  ['2', 'Practice and analyze', 'Use your webcam while the system analyzes your movement.'],
  ['3', 'Improve', 'Review your score and continue with an adaptive lesson.'],
];

const POINTS = [
  'Webcam-based hand landmark detection',
  'Sequence-based FSL sign recognition',
  'Scoring against validated references',
  'Progress analytics for learners and administrators',
];

export default function Landing() {
  // Smooth scrolling for the #features / #how / #about links, only while this page is shown.
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.documentElement;
    root.style.scrollBehavior = reduce ? 'auto' : 'smooth';
    return () => {
      root.style.scrollBehavior = '';
    };
  }, []);

  return (
    <div className={`min-h-screen min-w-[320px] bg-white text-[#082d5b] antialiased ${FOCUS}`}>
      {/* header */}
      <header className="border-b border-[#e5edef] bg-white">
        <div className={`${WRAP} flex items-center justify-between py-4`}>
          <a href="#top" aria-label="GabaySenyas home">
            <img className="block h-12 w-auto sm:h-16" src="/logo.png" alt="GabaySenyas" />
          </a>
          <nav className="hidden gap-7 text-sm font-bold text-[#526a80] md:flex" aria-label="Main navigation">
            <a className="hover:text-[#079a9f]" href="#features">Features</a>
            <a className="hover:text-[#079a9f]" href="#how">How it works</a>
            <a className="hover:text-[#079a9f]" href="#about">About</a>
          </nav>
          <a className="rounded-lg bg-[#079a9f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#07858a]" href="/learn">
            Get started
          </a>
        </div>
      </header>

      {/* hero */}
      <section id="top" className="bg-[#f5fbfb]">
        <div className={`${WRAP} grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2 lg:py-28`}>
          <div>
            <p className={`${EYEBROW} mb-4 text-[#079a9f]`}>Learn Filipino Sign Language</p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl sm:leading-none lg:text-6xl">
              Learn every sign with <span className="text-[#079a9f]">confidence.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#526a80]">
              GabaySenyas helps you learn Filipino Sign Language through guided lessons, webcam-based practice, and useful feedback.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a className={`${BTN} bg-[#082d5b] font-bold text-white hover:bg-[#0d4078]`} href="#/learn">
                Start learning <Icon name="arrow" />
              </a>
              <a className={`${BTN} border border-[#cddce1] bg-white font-bold hover:border-[#079a9f] hover:text-[#079a9f]`} href="#how">
                How it works
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-[#dce9ea] bg-white p-7 shadow-sm sm:p-9">
            <h2 className="text-xl font-extrabold">A simple way to learn</h2>
            <p className="mt-2 text-[#60768a]">The learning experience follows three clear phases.</p>
            <div className="mt-7 flex flex-col gap-6">
              {PHASES.map(([num, title, text]) => (
                <div className="flex gap-4" key={num}>
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#e7f6f6] font-extrabold text-[#079a9f]">
                    {num}
                  </span>
                  <div>
                    <h3 className="font-extrabold">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[#60768a]">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* features */}
      <section id="features" className="py-20 sm:py-24">
        <div className={WRAP}>
          <div className="max-w-2xl">
            <p className={`${EYEBROW} text-[#079a9f]`}>Core features</p>
            <h2 className={H2}>From gesture capture to meaningful progress.</h2>
            <p className="mt-5 text-lg leading-8 text-[#60768a]">
              The six core parts of the approved GabaySenyas learning workflow.
            </p>
          </div>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <article className="rounded-2xl border border-[#dfe9eb] p-7" key={f.title}>
                <span className="grid size-11 place-items-center rounded-lg bg-[#e7f6f6] text-[#079a9f]">
                  <Icon name={f.icon} />
                </span>
                <h3 className="mt-5 text-lg font-extrabold">{f.title}</h3>
                <p className="mt-3 leading-7 text-[#60768a]">{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* why */}
      <section id="how" className="bg-[#082d5b] py-20 text-white sm:py-24">
        <div className={`${WRAP} grid items-center gap-12 lg:grid-cols-2`}>
          <div>
            <p className={`${EYEBROW} text-[#5dd9d3]`}>Why GabaySenyas</p>
            <h2 className={H2}>Practice that goes beyond watching videos.</h2>
            <p className="mt-5 text-lg leading-8 text-white/65">
              Most self-study materials show you what a sign looks like, but cannot tell you whether you are doing it correctly. GabaySenyas is designed to make practice more active and useful.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {POINTS.map((p) => (
              <div className="flex items-center gap-3 rounded-xl bg-white/[0.08] px-5 py-4 font-semibold" key={p}>
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#079a9f] text-white">
                  <Icon name="check" className="size-4" />
                </span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* about */}
      <section id="about" className="py-20 text-center sm:py-24">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <p className={`${EYEBROW} text-[#079a9f]`}>Built for connection</p>
          <h2 className={H2}>Make communication more inclusive.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#60768a]">
            GabaySenyas is designed for students and independent learners, educators and training centers, and members of the Deaf and Hard-of-Hearing community who may benefit from a more accessible FSL learning tool.
          </p>
          <a
            id="start"
            className={`${BTN} mt-8 bg-[#f8b934] font-extrabold text-[#082d5b] hover:bg-[#ffc84f]`}
            href="mailto:hello@gabaysenyas.com"
          >
            Join the early access list <Icon name="arrow" />
          </a>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-[#e5edef]">
        <div className={`${WRAP} flex flex-col items-center justify-between gap-4 py-7 text-center text-sm text-[#60768a] sm:flex-row`}>
          <img className="h-14 w-auto" src="/logo.png" alt="GabaySenyas" />
          <p>Guiding every sign. Building every connection.</p>
          <p>© 2026 GabaySenyas</p>
        </div>
      </footer>
    </div>
  );
}
