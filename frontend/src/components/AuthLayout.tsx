// Shared layout and form pieces for the Sign in and Create account pages.
// Uses the same palette, type scale, and button shapes as the Landing page.
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

const FOCUS =
  '[&_:is(a,button,input):focus-visible]:outline [&_:is(a,button,input):focus-visible]:outline-[3px] [&_:is(a,button,input):focus-visible]:outline-offset-2 [&_:is(a,button,input):focus-visible]:outline-[#079a9f]';

export const INPUT =
  'mt-2 block w-full rounded-lg border border-[#cddce1] bg-white px-4 py-3 text-[#082d5b] placeholder:text-[#9aabba] hover:border-[#9fc3c9] focus:border-[#079a9f] focus:outline-none aria-[invalid=true]:border-[#d92d20]';
export const LABEL = 'block text-sm font-bold';
export const PRIMARY_BTN =
  'mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#082d5b] px-6 py-3.5 font-bold text-white hover:bg-[#0d4078] disabled:opacity-70';
export const TEXT_LINK = 'rounded font-bold text-[#079a9f] hover:text-[#07858a]';

export type Message = { tone: 'error' | 'info'; text: string } | null;

interface LayoutProps {
  eyebrow: string;
  headline: ReactNode;
  points: string[];
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthLayout({ eyebrow, headline, points, title, subtitle, children }: LayoutProps) {
  return (
    <div className={`grid min-h-screen min-w-[320px] bg-white text-[#082d5b] antialiased lg:grid-cols-2 ${FOCUS}`}>
      {/* brand panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#082d5b] p-12 text-white lg:flex">
        <div aria-hidden="true" className="absolute -right-24 -top-24 size-80 rounded-full bg-[#079a9f]/20" />
        <div aria-hidden="true" className="absolute -bottom-32 -left-16 size-96 rounded-full bg-white/[0.04]" />

        <Link to="/" aria-label="GabaySenyas home" className="relative w-fit rounded-xl bg-white px-4 py-2">
          <img className="block h-12 w-auto" src="/logo.png" alt="GabaySenyas" />
        </Link>

        <div className="relative max-w-md">
          <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#5dd9d3]">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight">{headline}</h1>
          <div className="mt-8 flex flex-col gap-3">
            {points.map((p) => (
              <div className="flex items-center gap-3 rounded-xl bg-white/[0.08] px-5 py-4 font-semibold" key={p}>
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#079a9f]">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                </span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-white/60">Guiding every sign. Building every connection.</p>
      </aside>

      {/* form panel */}
      <main className="flex flex-col bg-white">
        <div className="flex items-center justify-between px-5 py-4 sm:px-8 lg:justify-end">
          <Link to="/" aria-label="GabaySenyas home" className="lg:hidden">
            <img className="block h-12 w-auto" src="/logo.png" alt="GabaySenyas" />
          </Link>
          <Link to="/" className="rounded-lg text-sm font-bold text-[#526a80] hover:text-[#079a9f]">
            ← Back to home
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-12 sm:px-8">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-extrabold tracking-tight">{title}</h2>
            <p className="mt-2 text-[#60768a]">{subtitle}</p>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

interface PasswordProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  placeholder: string;
  invalid?: boolean;
  describedBy?: string;
}

export function PasswordInput({ id, value, onChange, autoComplete, placeholder, invalid, describedBy }: PasswordProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={`${INPUT} pr-20`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
      />
      <button
        type="button"
        className="absolute right-2 top-[calc(50%+4px)] -translate-y-1/2 rounded-md px-3 py-1.5 text-xs font-bold text-[#526a80] hover:bg-[#f5fbfb] hover:text-[#079a9f]"
        onClick={() => setShow((s) => !s)}
        aria-pressed={show}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

export function FormMessage({ message }: { message: Message }) {
  if (!message) return null;
  return (
    <p
      role={message.tone === 'error' ? 'alert' : 'status'}
      className={`mt-5 rounded-lg px-4 py-3 text-sm font-semibold ${
        message.tone === 'error' ? 'bg-[#fdecec] text-[#b42318]' : 'bg-[#e7f6f6] text-[#07696d]'
      }`}
    >
      {message.text}
    </p>
  );
}
