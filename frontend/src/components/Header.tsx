import { useState } from 'react';

interface Props {
  completed: number;
  total: number;
}

export default function Header({ completed, total }: Props) {
  const [logoOk, setLogoOk] = useState(true);
  return (
    <header className="flex items-center justify-between border-b border-line bg-white px-6 py-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Back"
          className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted hover:bg-surface"
        >
          ←
        </button>
        {logoOk ? (
          <img src="/logo.png" alt="GabaySenyas" className="h-9" onError={() => setLogoOk(false)} />
        ) : (
          <span className="text-lg font-extrabold text-navy-800">
            Gabay<span className="text-teal-brand">Senyas</span>
          </span>
        )}
      </div>
      <div className="w-56">
        <div className="mb-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-muted">
          <span>Course progress</span>
          <span className="text-sm normal-case tracking-normal text-navy-900">
            {completed}/{total}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-line" role="progressbar" aria-valuenow={completed} aria-valuemax={total}>
          <div
            className="h-full rounded-full bg-teal-brand transition-all"
            style={{ width: `${(completed / total) * 100}%` }}
          />
        </div>
      </div>
    </header>
  );
}
