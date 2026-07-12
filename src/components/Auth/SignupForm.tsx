import { useState, type FormEvent } from 'react';
import { signUpWithEmail, signInWithGoogle } from '../../lib/auth';
import styles from './Auth.module.css';

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('비밀번호가 일치하지 않습니다.'); return; }
    setError(null);
    setIsLoading(true);
    try {
      await signUpWithEmail(email.trim(), password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google 로그인에 실패했습니다.');
      setIsGoogleLoading(false);
    }
  };

  if (done) {
    return (
      <div className={styles.authPage}>
        <div className={styles.authCard}>
          <div className={styles.authLogo}>📧</div>
          <h1 className={styles.authTitle}>이메일 확인</h1>
          <p className={styles.authSubtitle}>{email}으로 확인 링크를 보냈습니다. 이메일을 확인한 뒤 로그인해주세요.</p>
          <button className={styles.submitButton} style={{ marginTop: 8, width: '100%' }} onClick={onSwitchToLogin}>
            로그인으로 돌아가기
          </button>
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

        <button
          type="button"
          onClick={handleGoogle}
          disabled={isGoogleLoading}
          style={{
            width: '100%', padding: '11px 20px', marginBottom: 16,
            background: '#fff', color: '#1a1a1a', border: '1px solid rgba(0,0,0,0.12)',
            borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            opacity: isGoogleLoading ? 0.6 : 1, fontFamily: '"Space Grotesk", system-ui, sans-serif',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          {isGoogleLoading ? '연결 중...' : 'Google로 가입하기'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ color: '#556070', fontSize: 12 }}>또는</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        </div>

        <form className={styles.form} onSubmit={handleSignup}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="signup-email">이메일</label>
            <input
              id="signup-email" type="email" className={styles.input}
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com" autoComplete="email" required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="signup-password">비밀번호</label>
            <input
              id="signup-password" type="password" className={styles.input}
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="8자 이상" autoComplete="new-password" required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="signup-confirm">비밀번호 확인</label>
            <input
              id="signup-confirm" type="password" className={styles.input}
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••" autoComplete="new-password" required
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitButton} disabled={isLoading}>
            {isLoading ? '처리 중...' : '이메일로 가입하기'}
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
