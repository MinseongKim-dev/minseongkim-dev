import { useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './Auth.module.css';

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const [step, setStep] = useState<'signup' | 'confirm'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const { error: err } = await supabase.auth.signUp({ email: email.trim(), password });
      if (err) throw new Error(err.message);
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'confirm') {
    return (
      <div className={styles.authPage}>
        <div className={styles.authCard}>
          <div className={styles.authLogo}>📧</div>
          <h1 className={styles.authTitle}>이메일 확인</h1>
          <p className={styles.authSubtitle}>
            <strong>{email}</strong>으로 인증 링크를 보냈습니다.<br />
            메일함을 확인하고 링크를 클릭하면 로그인됩니다.
          </p>
          <p className={styles.switchRow}>
            <button className={styles.switchLink} onClick={() => setStep('signup')} type="button">
              이메일 다시 입력
            </button>
            {' · '}
            <button className={styles.switchLink} onClick={onSwitchToLogin} type="button">
              로그인으로 이동
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.authLogo}>N</div>
        <h1 className={styles.authTitle}>Node 회원가입</h1>
        <p className={styles.authSubtitle}>AI 라이프 매니저를 시작하세요</p>

        <form className={styles.form} onSubmit={handleSignup}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="signup-email">이메일</label>
            <input
              id="signup-email"
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
            <label className={styles.label} htmlFor="signup-password">비밀번호</label>
            <input
              id="signup-password"
              type="password"
              className={styles.input}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
            <span className={styles.hint}>8자 이상</span>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="signup-confirm">비밀번호 확인</label>
            <input
              id="signup-confirm"
              type="password"
              className={styles.input}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitButton} disabled={isLoading}>
            {isLoading ? '처리 중...' : '회원가입'}
          </button>
        </form>

        <p className={styles.switchRow}>
          이미 계정이 있으신가요?{' '}
          <button className={styles.switchLink} onClick={onSwitchToLogin} type="button">
            로그인
          </button>
        </p>
      </div>
    </div>
  );
}
