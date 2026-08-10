import { useState, type ReactNode } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { PortfolioPage } from '../../pages/portfolio/PortfolioPage';
import { AuthModal } from './AuthModal';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100svh', fontSize: 32 }}>
        ✨
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <PortfolioPage onLoginClick={() => setModalOpen(true)} />
        <AuthModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  return <>{children}</>;
}
