import { Bell, MessageCircle, Menu } from 'lucide-react';
import { useAppStore } from '../stores/app.store';
import { useAuth } from '../../contexts/useAuth';
import { useWindowSize } from '../hooks/useWindowSize';
import { NAV } from './Sidebar';

const C = {
  bg0: '#06091A', bg2: '#0D1228',
  b0: 'rgba(255,255,255,0.04)', b1: 'rgba(255,255,255,0.08)',
  t0: '#DDE5F5', t1: '#556070',
  blue: '#3B8EF0', violet: '#7C5CF0', rose: '#F05472',
};
const font = '"Space Grotesk", system-ui, sans-serif';

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { view, chatOpen, toggleChat } = useAppStore();
  const { user } = useAuth();
  const { isMobile } = useWindowSize();
  const domain = NAV.find((n) => n.id === view);
  const email = user?.signInDetails?.loginId ?? '';
  const avatarLetter = (email.charAt(0) || 'N').toUpperCase();

  return (
    <div style={{
      height: 52, padding: '0 24px', display: 'flex', alignItems: 'center',
      borderBottom: `1px solid ${C.b0}`, background: C.bg0, flexShrink: 0,
    }}>
      {!isMobile && onMenuClick && (
        <button
          onClick={onMenuClick}
          style={{ color: C.t1, cursor: 'pointer', display: 'flex', marginRight: 14 }}
        >
          <Menu size={18} />
        </button>
      )}
      {domain && (
        <span style={{ marginRight: 8, display: 'flex' }}>
          <domain.Icon size={14} color={domain.color} />
        </span>
      )}
      <span style={{ color: C.t0, fontSize: 14, fontWeight: 600, fontFamily: font }}>
        {domain?.label ?? '대시보드'}
      </span>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button style={{ position: 'relative', color: C.t1, cursor: 'pointer', display: 'flex' }}>
          <Bell size={15} />
          <div style={{
            position: 'absolute', top: -2, right: -2, width: 7, height: 7,
            borderRadius: '50%', background: C.rose, border: `1.5px solid ${C.bg0}`,
          }} />
        </button>
        {!isMobile && (
          <button onClick={toggleChat} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px',
            background: chatOpen ? `${C.blue}20` : C.bg2,
            border: `1px solid ${chatOpen ? C.blue : C.b1}`,
            borderRadius: 20, color: chatOpen ? C.blue : C.t1,
            fontSize: 12, cursor: 'pointer', fontFamily: font,
          }}>
            <MessageCircle size={12} />
            AI 채팅
          </button>
        )}
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: `linear-gradient(135deg,${C.blue},${C.violet})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: font,
        }}>{avatarLetter}</div>
      </div>
    </div>
  );
}
