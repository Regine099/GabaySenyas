// Login. Role comes from the account; no role selector.
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
  'Pick up where you left off in every lesson',
  'Keep your practice scores and progress history',
  'Get lessons adapted to how you sign',
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setMessage({ tone: 'error', text: 'Enter your email and password.' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    // TODO: call the backend login endpoint once auth is implemented (src/api/auth.ts).
    await new Promise((r) => setTimeout(r, 400));
    setSubmitting(false);
    setMessage({ tone: 'info', text: 'Email sign-in will work once the backend login is ready.' });
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      headline={
        <>
          Keep learning every sign with <span className="text-[#5dd9d3]">confidence.</span>
        </>
      }
      points={POINTS}
      title="Sign in"
      subtitle="Sign in to continue your FSL lessons."
    >
      <form onSubmit={handleSubmit} noValidate className="mt-8">
        <label className={LABEL} htmlFor="email">
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
        />

        <div className="mt-5 flex items-center justify-between">
          <label className={LABEL} htmlFor="password">
            Password
          </label>
          <a href="#" className={`${TEXT_LINK} text-sm`}>
            Forgot password?
          </a>
        </div>
        <PasswordInput
          id="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          placeholder="Enter your password"
        />

        <label className="mt-5 flex w-fit cursor-pointer items-center gap-3 text-sm font-semibold text-[#526a80]">
          <input
            type="checkbox"
            className="size-4 rounded accent-[#079a9f]"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Keep me signed in
        </label>

        <FormMessage message={message} />

        <button type="submit" disabled={submitting} className={PRIMARY_BTN}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-[#60768a]">
        New to GabaySenyas?{' '}
        <Link to="/register" className={TEXT_LINK}>
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
