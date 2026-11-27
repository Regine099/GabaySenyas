import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import LessonView from '../../components/LessonView';
import PracticeView from '../../components/PracticeView';
import { LESSONS } from '../../data/lessons';
import { loadCompleted, saveCompleted } from '../../lib/progress';
import { useCallback, useState } from 'react';

type Tab = 'lesson' | 'practice';

export default function App() {
  const [index, setIndex] = useState(0);
  const [tab, setTab] = useState<Tab>(new URLSearchParams(window.location.search).has('mock') ? 'practice' : 'lesson');
  const [completed, setCompleted] = useState<string[]>(loadCompleted);

  const lesson = LESSONS[index];

  const markCompleted = useCallback((letter: string) => {
    setCompleted((prev) => {
      if (prev.includes(letter)) return prev;
      const next = [...prev, letter];
      saveCompleted(next);
      return next;
    });
  }, []);

  // A letter unlocks only after the previous letter is completed (A is always open).
  const isUnlocked = (i: number) => i === 0 || completed.includes(LESSONS[i - 1].letter);
  const nextLocked = index < LESSONS.length - 1 && !isUnlocked(index + 1);

  const go = (i: number) => {
    if (!isUnlocked(i)) return;
    setIndex(i);
    setTab('lesson');
  };
return (
<div className="flex min-h-screen flex-col">
      <Header completed={completed.length} total={LESSONS.length} />
      <div className="flex flex-1">
        <Sidebar
          letters={LESSONS.map((l) => l.letter)}
          activeIndex={index}
          completed={completed}
          isUnlocked={isUnlocked}
          onSelect={go}
        />

        <main className="flex-1 p-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <p className="text-sm font-bold text-teal-brand">
                  Lesson {index + 1} of {LESSONS.length}
                </p>
                <h1 className="text-3xl font-extrabold">Signing the letter “{lesson.letter}”</h1>
              </div>
              <div role="tablist" className="flex rounded-xl border border-line bg-white p-1 text-sm font-bold">
                {(['lesson', 'practice'] as Tab[]).map((t) => (
                  <button
                    key={t}
                    role="tab"
                    aria-selected={tab === t}
                    onClick={() => setTab(t)}
                    className={`rounded-lg px-4 py-1.5 capitalize ${tab === t ? 'bg-navy-900 text-white' : 'text-muted'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {tab === 'lesson' ? (
              <LessonView lesson={lesson} onContinue={() => setTab('practice')} />
            ) : (
              <PracticeView lesson={lesson} onCompleted={markCompleted} />
            )}

            <div className="mt-8 flex justify-between border-t border-line pt-5">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => go(index - 1)}
                className="rounded-lg px-3 py-2 text-sm font-bold text-muted disabled:opacity-40"
              >
                ‹ Previous
              </button>
              <div className="flex items-center gap-3">
                {nextLocked && (
                  <span className="text-xs font-bold text-muted">Complete “{lesson.letter}” to unlock the next letter</span>
                )}
                <button
                  type="button"
                  disabled={index === LESSONS.length - 1 || nextLocked}
                  onClick={() => go(index + 1)}
                  className="rounded-lg bg-teal-brand px-5 py-2 text-sm font-extrabold text-white hover:brightness-95 disabled:opacity-40"
                >
                  Next letter ›
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
    );
}