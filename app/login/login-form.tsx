'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Loader2, LogIn } from 'lucide-react';
import { loginAction } from '@/lib/auth-actions';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="admin-login-form"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await loginAction(email, password);
          if (!result.ok) {
            setError(result.error ?? 'تعذر تسجيل الدخول');
            return;
          }
          router.replace('/');
          router.refresh();
        });
      }}
    >
      <label>
        البريد الإلكتروني
        <input
          dir="ltr"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="owner@example.com"
        />
      </label>
      <label>
        كلمة المرور
        <input
          dir="ltr"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {error && (
        <p className="admin-callout admin-callout--error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="admin-btn admin-btn--primary admin-btn--lg" disabled={pending}>
        {pending ? <Loader2 className="admin-spin" aria-hidden="true" /> : <LogIn aria-hidden="true" />}
        تسجيل الدخول
      </button>
    </form>
  );
}
