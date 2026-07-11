import {
  Home, Calendar, CheckSquare, DollarSign, Activity,
  BookOpen, Briefcase, Users, MessageCircle, Settings, LogOut, X,
} from 'lucide-react';
import { useAppStore, type ViewId } from '../stores/app.store';
import { useTasksStore } from '../stores/tasks.store';
import { useWindowSize } from '../hooks/useWindowSize';
import { useAuth } from '../../contexts/useAuth';

const C = {
  bg1: '#090D1F', bg2: '#0D1228', bg3: '#131B32',
  b0: 'rgba(255,255,255,0.04)', b1: 'rgba(255,255,255,0.08)',
  t0: '#DDE5F5', t1: '#556070', t2: '#253040',
  blue: '#3B8EF0', violet: '#7C5CF0', teal: '#00CCA0',
  amber: '#EFA020', rose: '#F05472', sky: '#58AEFF',
};
const font = '"Space Grotesk", system-ui, sans-serif';
const mono = '"JetBrains Mono", "Fira Code", monospace';

const NAV: { id: ViewId; label: string; Icon: React.ComponentType<{ size?: number; color?: string }>; color: string }[] = [
  { id: 'dashboard', label: '대시보드', Icon: Home,        color: C.blue   },
  { id: 'schedule',  label: '일정',     Icon: Calendar,    color: C.blue   },
  { id: 'tasks',     label: '할 일',    Icon: CheckSquare, color: C.violet },
  { id: 'finance',   label: '재정',     Icon: DollarSign,  color: C.amber  },
  { id: 'health',    label: '건강',     Icon: Activity,    color: C.teal   },
  { id: 'learning',  label: '학습',     Icon: BookOpen,    color: C.sky    },
  { id: 'career',    label: '커리어',   Icon: Briefcase,   color: '#9B7CF5' },
  { id: 'relations', label: '관계',     Icon: Users,       color: C.rose   },
];

export { NAV };

export function Sidebar({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const { view, setView, chatOpen, toggleChat } = useAppStore();
  const { items: tasks } = useTasksStore();
  const { isMobile } = useWindowSize();
  const { logout } = useAuth();

  const urgentCount = tasks.filter((t) => !t.done && (t.priority === 'urgent' || t.priority === 'high')).length;

  const handleNav = (id: ViewId) => {
    setView(id);
    if (isMobile && onClose) onClose();
  };

  const handleChat = () => {
    toggleChat();
    if (isMobile && onClose) onClose();
  };

  if (isMobile && !mobileOpen) return null;

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 49, backdropFilter: 'blur(2px)',
          }}
        />
      )}

      <div style={{
        width: 218,
        minHeight: '100vh',
        background: C.bg1,
        borderRight: `1px solid ${C.b0}`,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        ...(isMobile ? {
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
        } : {}),
      }}>
        {/* Logo */}
        <div style={{
          padding: '22px 18px 18px', borderBottom: `1px solid ${C.b0}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
            background: `linear-gradient(135deg,${C.blue},${C.violet})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff',
            boxShadow: '0 0 14px rgba(75,130,240,0.45)',
          }}>N</div>
          <span style={{ color: C.t0, fontSize: 15.5, fontWeight: 600, fontFamily: font, letterSpacing: '-0.3px' }}>Node</span>
          <span style={{
            marginLeft: 'auto', background: `${C.teal}20`, border: `1px solid ${C.teal}40`,
            borderRadius: 10, padding: '1px 7px', color: C.teal, fontSize: 9.5, fontFamily: mono,
          }}>BETA</span>
          {isMobile && (
            <button onClick={onClose} style={{ color: C.t1, cursor: 'pointer', display: 'flex', marginLeft: 4 }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {NAV.map(({ id, label, Icon, color }) => {
            const active = view === id;
            return (
              <button key={id} onClick={() => handleNav(id)} style={{
                display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px',
                borderRadius: 8, width: '100%', textAlign: 'left', fontFamily: font,
                background: active ? `${color}18` : 'transparent',
                borderLeft: `2px solid ${active ? color : 'transparent'}`,
                color: active ? C.t0 : C.t1,
                fontSize: 13.5, fontWeight: active ? 500 : 400,
                transition: 'all 0.12s',
              }}>
                <Icon size={14} color={active ? color : C.t1} />
                {label}
                {id === 'tasks' && urgentCount > 0 && (
                  <span style={{
                    marginLeft: 'auto', background: C.rose, borderRadius: 8,
                    padding: '0 5px', fontSize: 9.5, color: '#fff', fontFamily: mono,
                  }}>{urgentCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '10px 8px', borderTop: `1px solid ${C.b0}`, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <button onClick={handleChat} style={{
            display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px',
            borderRadius: 8, width: '100%', textAlign: 'left', fontFamily: font,
            background: chatOpen ? `${C.blue}18` : 'transparent',
            borderLeft: `2px solid ${chatOpen ? C.blue : 'transparent'}`,
            color: chatOpen ? C.t0 : C.t1, fontSize: 13.5, fontWeight: chatOpen ? 500 : 400,
          }}>
            <MessageCircle size={14} color={chatOpen ? C.blue : C.t1} />
            AI 어시스턴트
            <span style={{
              marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%',
              background: C.teal, boxShadow: `0 0 6px ${C.teal}`,
            }} />
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px',
            borderRadius: 8, color: C.t1, fontSize: 13.5, fontFamily: font,
          }}>
            <Settings size={14} color={C.t1} />
            설정
          </button>
          <button onClick={logout} style={{
            display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px',
            borderRadius: 8, color: C.t1, fontSize: 13.5, fontFamily: font,
            width: '100%', textAlign: 'left',
          }}>
            <LogOut size={14} color={C.t1} />
            로그아웃
          </button>
        </div>
      </div>
    </>
  );
}
