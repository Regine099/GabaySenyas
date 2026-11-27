import { useState } from 'react';
import Header from '../../components/Header';
import { LESSONS } from '../../data/lessons';
import { loadCompleted } from '../../lib/progress';

type Result = { label: string; className: string };

const COMPLETED: Result = { label: 'Completed', className: 'bg-[#dcf5e6] text-[#1d7a4a]' };
const NO_DATA: Result = { label: 'No data', className: 'bg-[#d92d20] text-white' };

export default function Progress() {
  const [completed] = useState<string[]>(loadCompleted);
  const total = LESSONS.length;
  const beginnerPct = Math.round((completed.length / total) * 100);

  const levels = [
    { name: 'Beginner', sub: 'The FSL alphabet, A–Z', pct: beginnerPct },
    { name: 'Intermediate', sub: 'Unlocks after Beginner', pct: 0 },
    { name: 'Advanced', sub: 'Unlocks after Intermediate', pct: 0 },
  ];

  // Scores are not stored yet, so recent attempts are the latest completed letters.
  // With nothing completed, show the first four letters as "No data".
  const rows =
    completed.length > 0
      ? [...completed].reverse().slice(0, 4).map((sign) => ({ sign, result: COMPLETED }))
      : LESSONS.slice(0, 4).map((l) => ({ sign: l.letter, result: NO_DATA }));

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header completed={completed.length} total={total} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <h1 className="mb-5 text-3xl font-extrabold tracking-tight">My Progress</h1>

        <section aria-label="Learning levels" className="grid gap-4 md:grid-cols-3">
          {levels.map((level) => (
            <article key={level.name} className="rounded-xl border border-line bg-white p-4 shadow-sm">
              <h2 className="text-base font-extrabold">{level.name}</h2>
              <p className="mt-1 text-xs text-muted">{level.sub}</p>
              <div
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#dbe6ea]"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={level.pct}
                aria-label={`${level.name} progress`}
              >
                <div className="h-full rounded-full bg-navy-900" style={{ width: `${level.pct}%` }} />
              </div>
              <p className="mt-1.5 text-[11px] text-muted">{level.pct}% complete</p>
            </article>
          ))}
        </section>

        <section aria-labelledby="attempts-title" className="mt-5 rounded-xl border border-line bg-white px-5 pb-2 pt-4 shadow-sm">
          <h2 id="attempts-title" className="mb-3 text-lg font-extrabold">Recent attempts</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-muted">
                <th scope="col" className="w-2/5 border-b border-line pb-2 font-medium">Sign</th>
                <th scope="col" className="w-[30%] border-b border-line pb-2 font-medium">Score</th>
                <th scope="col" className="border-b border-line pb-2 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.sign} className={i < rows.length - 1 ? 'border-b border-line' : ''}>
                  <th scope="row" className="py-3 text-left font-extrabold">{row.sign}</th>
                  <td className="py-3">—</td>
                  <td className="py-3">
                    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${row.result.className}`}>
                      {row.result.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
