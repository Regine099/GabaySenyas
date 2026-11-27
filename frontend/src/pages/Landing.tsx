import './landing.css';

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

function Icon({ name }: { name: IconName }) {
  return (
    <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

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
  return (
    <div className="lp">
      <header className="top">
        <div className="wrap">
          <a href="#top" aria-label="GabaySenyas home">
            <img src="/logo.png" alt="GabaySenyas" />
          </a>
          <nav className="main" aria-label="Main navigation">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#about">About</a>
          </nav>
          <a className="btn-sm" href="#/learn">Get started</a>
        </div>
      </header>

      <section id="top">
        <div className="wrap grid">
          <div>
            <p className="eyebrow">Learn Filipino Sign Language</p>
            <h1>
              Learn every sign with <span>confidence.</span>
            </h1>
            <p className="lead">
              GabaySenyas helps you learn Filipino Sign Language through guided lessons, webcam-based practice, and useful feedback.
            </p>
            <div className="cta-row">
              <a className="btn btn-navy" href="#/learn">
                Start learning <Icon name="arrow" />
              </a>
              <a className="btn btn-ghost" href="#how">How it works</a>
            </div>
          </div>
          <div className="card-hero">
            <h2>A simple way to learn</h2>
            <p>The learning experience follows three clear phases.</p>
            <div className="steps">
              {PHASES.map(([num, title, text]) => (
                <div className="step" key={num}>
                  <span className="num">{num}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">Core features</p>
            <h2>From gesture capture to meaningful progress.</h2>
            <p>The six core parts of the approved GabaySenyas learning workflow.</p>
          </div>
          <div className="feat">
            {FEATURES.map((f) => (
              <article key={f.title}>
                <span className="ico"><Icon name={f.icon} /></span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how">
        <div className="wrap grid">
          <div>
            <p className="eyebrow">Why GabaySenyas</p>
            <h2>Practice that goes beyond watching videos.</h2>
            <p>
              Most self-study materials show you what a sign looks like, but cannot tell you whether you are doing it correctly. GabaySenyas is designed to make practice more active and useful.
            </p>
          </div>
          <div className="pts">
            {POINTS.map((p) => (
              <div className="pt" key={p}>
                <span className="tick"><Icon name="check" /></span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about">
        <div className="in">
          <p className="eyebrow">Built for connection</p>
          <h2>Make communication more inclusive.</h2>
          <p className="body">
            GabaySenyas is designed for students and independent learners, educators and training centers, and members of the Deaf and Hard-of-Hearing community who may benefit from a more accessible FSL learning tool.
          </p>
          <a id="start" className="btn btn-yellow" href="mailto:hello@gabaysenyas.com">
            Join the early access list <Icon name="arrow" />
          </a>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <img src="/logo.png" alt="GabaySenyas" />
          <p>Guiding every sign. Building every connection.</p>
          <p>© 2026 GabaySenyas</p>
        </div>
      </footer>
    </div>
  );
}
