import { useState } from 'react';
import {
  Home, Calendar, CheckSquare, Activity, MoreHorizontal,
  DollarSign, BookOpen, Briefcase, Users, MessageCircle, X,
} from 'lucide-react';
import { useAppStore, type ViewId } from '../stores/app.store';
import { useWindowSize } from '../hooks/useWindowSize';
import { useTasksStore } from '../stores/tasks.store';

const C = {
  bg0: '#06091A', bg1: '#090D1F',
  b0: 'rgba(255,255,255,0.04)', b1: 'rgba(255,255,255,0.08)',
  t0: '#DDE5F5', t1: '#556070',
  blue: '#3B8EF0', violet: '#7C5CF0', teal: '#00CCA0',
  amber: '#EFA020', rose: '#F05472', sky: '#58AEFF',
};
const font = '"Space Grotesk", system-ui, sans-serif';

const PRIMARY: { id: ViewId; label: string; Icon: React.ComponentType<{ size?: number; color?: string }>; color: string }[] = [
  { id: 'dashboard', label: '홈',   Icon: Home,        color: C.blue   },
  { id: 'schedule',  label: '일정', Icon: Calendar,    color: C.blue   },
  { id: 'tasks',     label: '할 일', Icon: CheckSquare, color: C.violet },
  { id: 'health',    label: '건강', Icon: Activity,    color: C.teal   },
];

const MORE_NAV: { id: ViewId; label: string; Icon: React.ComponentType<{ size?: number; color?: string }>; color: string }[] = [
  { id: 'finance',   label: '재정',   Icon: DollarSign, color: C.amber  },
  { id: 'learning',  label: '학습',   Icon: BookOpen,   color: C.sky    },
  { id: 'career',    label: '커리어', Icon: Briefcase,  color: '#9B7CF5' },
  { id: 'relations', label: '관계',   Icon: Users,      color: C.rose   },
];

const MORE_IDS = MORE_NAV.map((n) => n.id);

export function BottomNav() {
  const { view, setView, chatOpen, toggleChat } = useAppStore();
  const { isMobile } = useWindowSize();
  const { items: tasks } = useTasksStore();
  const [sheetOpen, setSheetOpen] = useState(false);

  const urgentCount = tasks.filter((t) => !t.done && (t.priority === 'urgent' || t.priority === 'high')).length;
  const isMoreActive = MORE_IDS.includes(view as ViewId);

  if (!isMobile) return null;

  const handleNav = (id: ViewId) => {
    setView(id);
    setSheetOpen(false);
  };

  return (
    <>
      {/* More sheet overlay */}
      {sheetOpen && (
        <div
          onClick={() => setSheetOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
            zIndex: 58, backdropFilter: 'blur(3px)',
          }}
        />
      )}

      {/* More sheet */}
      {sheetOpen && (
        <div style={{
          position: 'fixed', bottom: 60, left: 0, right: 0, zIndex: 59,
          background: C.bg1, borderTop: `1px solid ${C.b1}`,
          borderRadius: '16px 16px 0 0', padding: '16px 12px',
        }}>
          <div style={{
            width: 36, height: 3, borderRadius: 2, background: C.b1,
            margin: '0 auto 16px',
          }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
            {MORE_NAV.map(({ id, label, Icon, color }) => {
              const active = view === id;
              return (
                <button
                  key={id}
                  onClick={() => handleNav(id)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    padding: '14px 8px', borderRadius: 12,
                    background: active ? `${color}15` : C.bg0,
                    border: `1px solid ${active ? color + '40' : C.b0}`,
                    cursor: 'pointer', fontFamily: font,
                  }}
                >
                  <Icon size={20} color={active ? color : C.t1} />
                  <span style={{ color: active ? color : C.t1, fontSize: 11, fontWeight: active ? 600 : 400 }}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => { toggleChat(); setSheetOpen(false); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', borderRadius: 12,
              background: chatOpen ? `${C.blue}15` : C.bg0,
              border: `1px solid ${chatOpen ? C.blue + '40' : C.b0}`,
              cursor: 'pointer', fontFamily: font,
            }}
          >
            <MessageCircle size={16} color={chatOpen ? C.blue : C.t1} />
            <span style={{ color: chatOpen ? C.blue : C.t1, fontSize: 13.5, fontWeight: chatOpen ? 600 : 400 }}>
              AI 어시스턴트
            </span>
            <span style={{
              marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%',
              background: C.teal, boxShadow: `0 0 6px ${C.teal}`,
            }} />
          </button>

          <button
            onClick={() => setSheetOpen(false)}
            style={{
              width: '100%', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 6, padding: '10px', borderRadius: 10, color: C.t1,
              background: 'transparent', fontSize: 12, cursor: 'pointer', fontFamily: font,
            }}
          >
            <X size={12} />닫기
          </button>
        </div>
      )}

      {/* Bottom tab bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        height: 60, background: C.bg1, borderTop: `1px solid ${C.b0}`,
        display: 'flex', paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {PRIMARY.map(({ id, label, Icon, color }) => {
          const active = view === id;
          return (
            <button
              key={id}
              onClick={() => handleNav(id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 3,
                cursor: 'pointer', position: 'relative', fontFamily: font,
              }}
            >
              {id === 'tasks' && urgentCount > 0 && (
                <div style={{
                  position: 'absolute', top: 8, left: '55%',
                  width: 6, height: 6, borderRadius: '50%', background: C.rose,
                }} />
              )}
              <Icon size={20} color={active ? color : C.t1} />
              <span style={{ fontSize: 10, color: active ? color : C.t1, fontWeight: active ? 600 : 400 }}>
                {label}
              </span>
            </button>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setSheetOpen(!sheetOpen)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 3,
            cursor: 'pointer', fontFamily: font,
          }}
        >
          <MoreHorizontal size={20} color={(isMoreActive || sheetOpen) ? C.sky : C.t1} />
          <span style={{ fontSize: 10, color: (isMoreActive || sheetOpen) ? C.sky : C.t1, fontWeight: (isMoreActive || sheetOpen) ? 600 : 400 }}>
            더보기
          </span>
        </button>
      </div>
    </>
  );
}
