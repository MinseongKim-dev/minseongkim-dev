import { useState, type FormEvent } from 'react';
import { signUp, confirmSignUp } from '../../lib/auth';
import { useAuth } from '../../contexts/useAuth';
import { signIn } from 'aws-amplify/auth';
import styles from './Auth.module.css';

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const { refresh } = useAuth();
  const [step, setStep] = useState<'signup' | 'confirm'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
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
      await signUp({ username: email.trim(), password, options: { userAttributes: { email: email.trim() } } });
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await confirmSignUp({ username: email.trim(), confirmationCode: code.trim() });
      await signIn({ username: email.trim(), password });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'confirm') {
    return (
      <div className={styles.authPage}>
        <div className={styles.authCard}>
          <div className={styles.authLogo}>📧</div>
          <h1 className={styles.authTitle}>이메일 인증</h1>
          <p className={styles.authSubtitle}>{email}으로 전송된 인증 코드를 입력하세요</p>

          <form className={styles.form} onSubmit={handleConfirm}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="confirm-code">인증 코드</label>
              <input
                id="confirm-code"
                type="text"
                className={styles.input}
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                required
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? '확인 중...' : '인증 완료'}
            </button>
          </form>

          <p className={styles.switchRow}>
            <button className={styles.switchLink} onClick={() => setStep('signup')} type="button">
              이메일 다시 입력
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
            <span className={styles.hint}>8자 이상, 대소문자+숫자 포함</span>
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
