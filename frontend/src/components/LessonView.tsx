import { useState } from 'react';
import type { Lesson } from '../data/lessons';

interface Props {
  lesson: Lesson;
  onContinue: () => void;
}

export default function LessonView({ lesson, onContinue }: Props) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <section className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h3 className="font-extrabold">Reference handshape</h3>
            <p className="text-xs text-muted">Sample from the collected dataset</p>
          </div>
          <span className="rounded-full bg-teal-soft px-3 py-1 text-xs font-bold text-teal-brand">
            {lesson.type === 'dynamic' ? 'Dynamic sign' : 'Static handshape'}
          </span>
        </div>
        <div className="relative grid min-h-[260px] place-items-center bg-surface p-6">
          <span className="absolute left-8 top-8 grid h-12 w-12 place-items-center rounded-xl bg-white text-xl font-extrabold shadow">
            {lesson.letter}
          </span>
          {imgOk ? (
            <img
              key={lesson.letter}
              src={lesson.image}
              alt={`Reference handshape for the letter ${lesson.letter}`}
              onError={() => setImgOk(false)}
              className="max-h-72 rounded-xl object-contain shadow-lg"
            />
          ) : (
            <p className="max-w-xs text-center text-sm text-muted">
              Add a reference image at <code className="rounded bg-white px-1">public{lesson.image}</code>
            </p>
          )}
        </div>
      </section>

      <div className="flex flex-col gap-4">
        <section className="rounded-2xl border border-line bg-white p-5">
          <div className="mb-3 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-100 font-extrabold text-amber-700">1</span>
            <h3 className="text-lg font-extrabold">Form the handshape</h3>
          </div>
          {lesson.steps.length ? (
            <ul className="space-y-2.5 text-sm">
              {lesson.steps.map((s) => (
                <li key={s} className="flex gap-2.5">
                  <span aria-hidden className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-teal-soft text-[10px] text-teal-brand">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Example instructions are not available yet.</p>
          )}
          {lesson.steps.length > 0 && (
            <p className="mt-3 text-xs text-muted">Example instructions</p>
          )}
        </section>

        <section className="rounded-2xl bg-navy-900 p-5 text-white">
          <p className="text-[11px] font-bold uppercase tracking-widest text-teal-300">Review checkpoint</p>
          <h3 className="mt-1 text-lg font-extrabold">Study the sign at your pace</h3>
          <p className="mt-2 text-sm leading-snug text-slate-300">
            Review the reference and instructions as often as you need. Continue only when you feel ready.
          </p>
          <button
            type="button"
            onClick={onContinue}
            className="mt-4 rounded-lg bg-amber-brand px-4 py-2 text-sm font-extrabold text-navy-900 hover:brightness-95"
          >
            ▷ Continue to practice
          </button>
        </section>
      </div>
    </div>
  );
}
