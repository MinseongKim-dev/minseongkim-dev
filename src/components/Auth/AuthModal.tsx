import { useEffect, useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

interface Props {
  onClose: () => void;
}

export function AuthModal({ onClose }: Props) {
  const [showSignup, setShowSignup] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(6, 9, 26, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {showSignup
        ? <SignupForm standalone={false} onSwitchToLogin={() => setShowSignup(false)} />
        : <LoginForm standalone={false} onSwitchToSignup={() => setShowSignup(true)} />
      }
    </div>
  );
}
