import { useEffect, useState } from 'react';
import type { Lesson } from '../data/lessons';
import { usePractice } from '../lib/usePractice';

// Auto-accept: the model must see the lesson's letter this many times
// (one prediction every ~200 ms, so 12 ≈ holding the sign for about 2.5 seconds).
const REQUIRED_STREAK = 12;
const MIN_CONFIDENCE = 0.5; // lower = more sensitive (backend default is 0.7)
const MISS_PENALTY = 2; // a wrong prediction takes this much off the hold instead of resetting it

interface Props {
  lesson: Lesson;
  onCompleted: (letter: string) => void;
}

export default function PracticeView({ lesson, onCompleted }: Props) {
  const { videoRef, canvasRef, camera, tracker, trackerError, recognition, recognitionError, live, enable } =
    usePractice(lesson.letter);
  const [imgOk, setImgOk] = useState(true);
  const [completedLetter, setCompletedLetter] = useState<string | null>(null);
  const cameraOn = camera === 'on';
  const isCompleted = lesson.letter === completedLetter;

  const [streak, setStreak] = useState(0);

  // Reset when switching letters.
  useEffect(() => setStreak(0), [lesson.letter]);

  // Build up the hold with correct predictions. A wrong prediction only knocks it back a little
  // (so one shaky frame doesn't ruin a long hold); losing the hand resets it.
  useEffect(() => {
    if (isCompleted) return;
    const top = live.predictions[0];
    if (!top) {
      setStreak(0);
      return;
    }
    const correct = top.label === lesson.letter && top.confidence >= MIN_CONFIDENCE;
    setStreak((s) => (correct ? s + 1 : Math.max(0, s - MISS_PENALTY)));
  }, [live.predictions, lesson.letter, isCompleted]);

  // Accept automatically once the sign has been held long enough.
  useEffect(() => {
    if (streak >= REQUIRED_STREAK && !isCompleted) {
      onCompleted(lesson.letter);
      setCompletedLetter(lesson.letter);
    }
  }, [streak, isCompleted, lesson.letter, onCompleted]);

  const holdProgress = Math.min(streak / REQUIRED_STREAK, 1);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
      {/* Camera panel */}
      <section className="overflow-hidden rounded-2xl bg-navy-900 text-white shadow">
        <div className="flex items-center justify-between bg-navy-800 px-5 py-3">
          <div>
            <h3 className="font-extrabold">Camera practice</h3>
            <p className="text-xs text-slate-300">Keep your hand inside the guide</p>
          </div>
          <span
            aria-label={cameraOn ? 'Camera on' : 'Camera off'}
            className={`h-2.5 w-2.5 rounded-full ${cameraOn ? 'bg-emerald-400' : 'bg-slate-500'}`}
          />
        </div>

        <div className="relative aspect-[4/3] w-full bg-navy-950">
          {/* Video and landmark layer. Mirrored so it behaves like a mirror. */}
          <video
            ref={videoRef}
            muted
            playsInline
            className={`absolute inset-0 h-full w-full -scale-x-100 object-cover ${cameraOn ? '' : 'hidden'}`}
          />
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 h-full w-full -scale-x-100 object-cover ${cameraOn ? '' : 'hidden'}`}
          />

          {cameraOn ? (
            <>
              <div className="pointer-events-none absolute inset-[12%] rounded-2xl border-2 border-dashed border-white/50" />
              {tracker === 'loading' && <Overlay>Loading hand tracking…</Overlay>}
              {tracker === 'error' && (
                <Overlay>{trackerError || 'Could not load hand tracking.'}</Overlay>
              )}
            </>
          ) : (
            <div className="absolute inset-6 grid place-items-center rounded-2xl border border-dashed border-white/30 p-6 text-center">
              <div>
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-xl bg-white/10 text-2xl">📷</div>
                {camera === 'denied' ? (
                  <>
                    <h4 className="text-lg font-extrabold">Camera access is blocked</h4>
                    <p className="mx-auto mt-1 max-w-xs text-sm text-slate-300">
                      Click the camera icon in your browser's address bar, allow access, then try again.
                    </p>
                  </>
                ) : camera === 'error' ? (
                  <>
                    <h4 className="text-lg font-extrabold">No camera found</h4>
                    <p className="mx-auto mt-1 max-w-xs text-sm text-slate-300">
                      Connect a webcam and make sure no other app is using it, then try again.
                    </p>
                  </>
                ) : (
                  <>
                    <h4 className="text-lg font-extrabold">Turn on your camera</h4>
                    <p className="mx-auto mt-1 max-w-xs text-sm text-slate-300">
                      Your video stays in your browser and is not uploaded.
                    </p>
                  </>
                )}
                <button
                  type="button"
                  onClick={enable}
                  disabled={camera === 'requesting'}
                  className="mt-4 rounded-lg bg-amber-brand px-5 py-2 text-sm font-extrabold text-navy-900 hover:brightness-95 disabled:opacity-60"
                >
                  {camera === 'requesting' ? 'Waiting for permission…' : camera === 'off' ? 'Enable camera' : 'Try again'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Right column */}
      <div className="flex flex-col gap-4">
        <section className="rounded-2xl border border-line bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Your target</p>
          <div className="mt-3 flex items-center gap-4">
            <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-xl bg-surface">
              {imgOk ? (
                <img
                  key={lesson.letter}
                  src={lesson.image}
                  alt={`Reference for ${lesson.letter}`}
                  onError={() => setImgOk(false)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-2xl font-extrabold text-muted">{lesson.letter}</span>
              )}
            </div>
            <div>
              <p className="text-3xl font-extrabold">{lesson.letter}</p>
              <p className="text-sm text-muted">Match the reference handshape.</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5" aria-live="polite">
          <h3 className="font-extrabold">Recognition preview</h3>
          <Preview
            cameraOn={cameraOn}
            tracker={tracker}
            recognition={recognition}
            recognitionError={recognitionError}
            live={live}
          />
          {isCompleted ? (
            <div className="mt-4 rounded-lg bg-teal-soft px-4 py-3">
              <p className="text-sm font-extrabold text-teal-brand">
                ✓ Correct! “{lesson.letter}” is complete. The next letter is unlocked.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCompletedLetter(null);
                  setStreak(0);
                }}
                className="mt-3 rounded-lg border border-teal-brand bg-white px-4 py-1.5 text-sm font-bold text-teal-brand hover:bg-teal-brand hover:text-white"
              >
                ↻ Try again
              </button>
            </div>
          ) : (
            <div className="mt-4">
              <div className="flex justify-between text-xs font-bold text-muted">
                <span>{streak > 0 ? `Hold “${lesson.letter}”…` : `Sign “${lesson.letter}” to pass`}</span>
                <span>{Math.round(holdProgress * 100)}%</span>
              </div>
              <div
                className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-valuenow={Math.round(holdProgress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-teal-brand transition-all duration-200"
                  style={{ width: `${holdProgress * 100}%` }}
                />
              </div>
            </div>
          )}
          <p className="mt-2 text-xs text-muted">Completion is saved in this browser until backend progress is available.</p>
        </section>
      </div>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-navy-950/70 p-6 text-center text-sm text-slate-200">
      {children}
    </div>
  );
}

function Preview({
  cameraOn,
  tracker,
  recognition,
  recognitionError,
  live,
}: {
  cameraOn: boolean;
  tracker: 'loading' | 'ready' | 'error';
  recognition: 'waiting' | 'loading' | 'ready' | 'error';
  recognitionError: string;
  live: {
    hand: boolean;
    handCount: number;
    fps: number;
    predictions: { label: string; confidence: number }[];
    modelVersion: string | null;
  };
}) {
  const top = live.predictions[0];

  return (
    <div className="mt-3">
      {!cameraOn ? (
        <p className="text-sm leading-snug text-muted">Backend recognition will appear here after you enable the camera.</p>
      ) : tracker === 'loading' ? (
        <p className="text-sm leading-snug text-muted">Starting hand tracking…</p>
      ) : tracker === 'error' ? (
        <p className="rounded bg-rose-50 p-2 text-sm text-rose-700">{recognitionError || 'Hand tracking failed.'}</p>
      ) : recognition === 'error' ? (
        <p className="rounded bg-rose-50 p-2 text-sm text-rose-700">{recognitionError}</p>
      ) : !live.hand ? (
        <p className="text-sm leading-snug text-muted">Show your hand to the camera and keep it inside the guide.</p>
      ) : !top && recognition === 'loading' ? (
        <p className="text-sm leading-snug text-muted">Sending hand landmarks to the backend…</p>
      ) : top ? (
        <>
          <p className="text-sm text-muted">Top backend prediction</p>
          <p className="mt-1 text-4xl font-extrabold text-navy-900">{top.label}</p>
          <p className="mt-1 text-sm text-muted">{Math.round(top.confidence * 100)}% confidence</p>
          {live.predictions.length > 1 && (
            <ol className="mt-3 space-y-1 text-sm text-muted">
              {live.predictions.slice(1).map((prediction) => (
                <li key={prediction.label}>
                  {prediction.label} · {Math.round(prediction.confidence * 100)}%
                </li>
              ))}
            </ol>
          )}
          <p className="mt-3 text-xs text-muted">
            Preview only{live.modelVersion ? ` · model ${live.modelVersion}` : ''}. Rating and feedback are not yet
            available through the production attempt API.
          </p>
        </>
      ) : (
        <p className="text-sm leading-snug text-muted">Collecting a short hand sequence for recognition…</p>
      )}
      {cameraOn && tracker === 'ready' && (
        <p className="mt-3 text-xs text-muted">
          {live.fps} FPS · {live.handCount} hand{live.handCount === 1 ? '' : 's'}
        </p>
      )}
    </div>
  );
}
