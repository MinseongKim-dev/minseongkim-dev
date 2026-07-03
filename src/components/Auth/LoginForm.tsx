import { useState, type FormEvent } from 'react';
import { signIn } from '../../lib/auth';
import { useAuth } from '../../contexts/useAuth';
import styles from './Auth.module.css';

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const { refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setError(null);
    setIsLoading(true);
    try {
      await signIn({ username: email.trim(), password });
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '로그인에 실패했습니다.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.authLogo}>N</div>
        <h1 className={styles.authTitle}>Node</h1>
        <p className={styles.authSubtitle}>로그인하여 시작하세요</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-email">이메일</label>
            <input
              id="login-email"
              type="email"
              className={styles.input}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-password">비밀번호</label>
            <input
              id="login-password"
              type="password"
              className={styles.input}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitButton} disabled={isLoading}>
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className={styles.switchRow}>
          계정이 없으신가요?{' '}
          <button className={styles.switchLink} onClick={onSwitchToSignup} type="button">
            회원가입
          </button>
        </p>
      </div>
    </div>
  );
}
