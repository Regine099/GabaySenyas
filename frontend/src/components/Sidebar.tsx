interface Props {
  letters: string[];
  activeIndex: number;
  completed: string[];
  isUnlocked: (index: number) => boolean;
  onSelect: (index: number) => void;
}

export default function Sidebar({ letters, activeIndex, completed, isUnlocked, onSelect }: Props) {
  return (
    <aside className="w-[230px] shrink-0 border-r border-line bg-white p-5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-teal-brand">Beginner course</p>
      <h2 className="mt-1 text-xl font-extrabold text-navy-900">The FSL Alphabet</h2>
      <p className="mt-1 text-sm leading-snug text-muted">Learn each handshape, then practice it with your camera.</p>

      <div className="mt-6 flex items-center justify-between text-sm font-bold">
        <span>{letters.length} letter lessons</span>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">Basics</span>
      </div>

      <div className="mt-3 grid grid-cols-5 gap-2">
        {letters.map((letter, i) => {
          const active = i === activeIndex;
          const done = completed.includes(letter);
          const locked = !isUnlocked(i);
          return (
            <button
              key={letter}
              type="button"
              onClick={() => onSelect(i)}
              disabled={locked}
              title={locked ? `Finish ${letters[i - 1]} first` : undefined}
              aria-label={`Letter ${letter}${done ? ', completed' : locked ? ', locked' : ''}`}
              aria-current={active ? 'true' : undefined}
              className={[
                'relative grid h-9 w-9 place-items-center rounded-lg border text-sm font-bold transition',
                active
                  ? 'border-navy-900 bg-navy-900 text-white'
                  : done
                    ? 'border-teal-brand/40 bg-teal-soft text-teal-brand'
                    : locked
                      ? 'cursor-not-allowed border-line bg-slate-50 text-slate-300'
                      : 'border-line bg-white text-navy-900 hover:border-navy-800',
              ].join(' ')}
            >
              {letter}
              {locked && (
                <svg
                  aria-hidden
                  viewBox="0 0 16 16"
                  className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-white p-0.5 text-slate-400"
                  fill="currentColor"
                >
                  <path d="M8 1a3 3 0 0 0-3 3v2H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1V4a3 3 0 0 0-3-3Zm-1.5 5V4a1.5 1.5 0 1 1 3 0v2h-3Z" />
                </svg>
              )}
              {done && !active && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-teal-brand" />}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex gap-2 rounded-xl bg-teal-soft p-3 text-xs leading-snug text-muted">
        <span aria-hidden className="font-bold text-teal-brand">ⓘ</span>
        <span>Letter samples come from the collected FSL alphabet dataset and may vary in lighting and skin tone.</span>
      </div>
    </aside>
  );
}
