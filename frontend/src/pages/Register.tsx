// Register a learner account.
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout, {
  FormMessage,
  INPUT,
  LABEL,
  PasswordInput,
  PRIMARY_BTN,
  TEXT_LINK,
  type Message,
} from '../components/AuthLayout';

const POINTS = [
  'Guided FSL lessons from the alphabet up',
  'Webcam practice with instant feedback',
  'Track your scores and see your progress grow',
];

const MIN_PASSWORD = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Field = 'name' | 'email' | 'password' | 'confirm' | 'terms';

// 0–4 based on length and character variety.
function passwordStrength(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= MIN_PASSWORD) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.max(1, score);
}

const STRENGTH = [
  { label: '', color: 'bg-[#e5edef]' },
  { label: 'Weak', color: 'bg-[#d92d20]' },
  { label: 'Fair', color: 'bg-[#f8b934]' },
  { label: 'Good', color: 'bg-[#2fb5a0]' },
  { label: 'Strong', color: 'bg-[#079a9f]' },
];

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  const strength = passwordStrength(password);

  function validate() {
    const next: Partial<Record<Field, string>> = {};
    if (!name.trim()) next.name = 'Enter your full name.';
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address.';
    if (password.length < MIN_PASSWORD) next.password = `Use at least ${MIN_PASSWORD} characters.`;
    if (!confirm) next.confirm = 'Re-enter your password.';
    else if (confirm !== password) next.confirm = 'Passwords do not match.';
    if (!agreed) next.terms = 'You need to agree to the terms to continue.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!validate()) return;
    setSubmitting(true);
    // TODO: call the backend register endpoint once auth is implemented (src/api/auth.ts).
    await new Promise((r) => setTimeout(r, 400));
    setSubmitting(false);
    setMessage({ tone: 'info', text: 'Creating an account will work once the backend is ready.' });
  }

  function fieldError(field: Field) {
    const text = errors[field];
    return text ? (
      <p id={`${field}-error`} className="mt-1.5 text-sm font-semibold text-[#b42318]">
        {text}
      </p>
    ) : null;
  }

  return (
    <AuthLayout
      eyebrow="Get started"
      headline={
        <>
          Start your journey in <span className="text-[#5dd9d3]">Filipino Sign Language.</span>
        </>
      }
      points={POINTS}
      title="Create an account"
      subtitle="It’s free. Start learning FSL in a few minutes."
    >
      <form onSubmit={handleSubmit} noValidate className="mt-8">
        <label className={LABEL} htmlFor="name">
          Full name
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="Juan Dela Cruz"
          className={INPUT}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!errors.name || undefined}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {fieldError('name')}

        <label className={`${LABEL} mt-5`} htmlFor="email">
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={INPUT}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!errors.email || undefined}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {fieldError('email')}

        <label className={`${LABEL} mt-5`} htmlFor="password">
          Password
        </label>
        <PasswordInput
          id="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          placeholder={`At least ${MIN_PASSWORD} characters`}
          invalid={!!errors.password}
          describedBy={errors.password ? 'password-error' : 'password-strength'}
        />
        {password && (
          <div id="password-strength" className="mt-2 flex items-center gap-3">
            <div className="grid flex-1 grid-cols-4 gap-1.5" aria-hidden="true">
              {[1, 2, 3, 4].map((i) => (
                <span key={i} className={`h-1.5 rounded-full ${i <= strength ? STRENGTH[strength].color : 'bg-[#e5edef]'}`} />
              ))}
            </div>
            <span className="w-14 text-right text-xs font-bold text-[#60768a]">{STRENGTH[strength].label}</span>
          </div>
        )}
        {fieldError('password')}

        <label className={`${LABEL} mt-5`} htmlFor="confirm">
          Confirm password
        </label>
        <PasswordInput
          id="confirm"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          placeholder="Re-enter your password"
          invalid={!!errors.confirm}
          describedBy={errors.confirm ? 'confirm-error' : undefined}
        />
        {fieldError('confirm')}

        <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm font-semibold text-[#526a80]">
          <input
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 rounded accent-[#079a9f]"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            aria-invalid={!!errors.terms || undefined}
            aria-describedby={errors.terms ? 'terms-error' : undefined}
          />
          <span>
            I agree to the{' '}
            <a href="#" className={TEXT_LINK}>
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className={TEXT_LINK}>
              Privacy Policy
            </a>
            .
          </span>
        </label>
        {fieldError('terms')}

        <FormMessage message={message} />

        <button type="submit" disabled={submitting} className={PRIMARY_BTN}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-[#60768a]">
        Already have an account?{' '}
        <Link to="/login" className={TEXT_LINK}>
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
