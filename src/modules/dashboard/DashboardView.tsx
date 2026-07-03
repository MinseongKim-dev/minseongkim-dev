import { useState } from 'react';
import {
  Calendar, CheckSquare, DollarSign, Activity,
  BookOpen, Briefcase, Users, Zap, AlertTriangle,
} from 'lucide-react';
import { useAppStore, type ViewId } from '../../shared/stores/app.store';

const C = {
  bg2: '#0D1228', bg3: '#131B32',
  b0: 'rgba(255,255,255,0.04)', b1: 'rgba(255,255,255,0.08)', b2: 'rgba(255,255,255,0.16)',
  t0: '#DDE5F5', t1: '#556070', t2: '#253040',
  blue: '#3B8EF0', violet: '#7C5CF0', teal: '#00CCA0',
  amber: '#EFA020', rose: '#F05472', sky: '#58AEFF',
};
const font = '"Space Grotesk", system-ui, sans-serif';
const mono = '"JetBrains Mono", "Fira Code", monospace';

type DotStatus = 'ok' | 'warn' | 'alert';

const DOMAIN_CARDS: {
  id: ViewId; label: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string; metric: string; sub: string; status: DotStatus;
}[] = [
  { id: 'schedule',  label: '일정',   Icon: Calendar,    color: C.blue,   metric: '오늘 3개 일정',    sub: '다음 ─ 10:00 팀 스탠드업',  status: 'ok'    },
  { id: 'tasks',     label: '할 일',  Icon: CheckSquare, color: C.violet, metric: '12개 중 5 완료',   sub: '마감 임박 2개',              status: 'warn'  },
  { id: 'finance',   label: '재정',   Icon: DollarSign,  color: C.amber,  metric: '₩412,000 지출',   sub: '월 예산의 68%',              status: 'ok'    },
  { id: 'health',    label: '건강',   Icon: Activity,    color: C.teal,   metric: '3일 운동 없음',    sub: '오늘 목표: 30분',            status: 'alert' },
  { id: 'learning',  label: '학습',   Icon: BookOpen,    color: C.sky,    metric: 'TypeScript 3/10', sub: '이번 주 2.5시간',            status: 'ok'    },
  { id: 'career',    label: '커리어', Icon: Briefcase,   color: '#9B7CF5', metric: '준비도 64%',      sub: 'Phase 1 진행 중',            status: 'ok'    },
  { id: 'relations', label: '관계',   Icon: Users,       color: C.rose,   metric: '2명 미연락',       sub: '민수님 60일 경과',           status: 'alert' },
];

function Dot({ color, glow }: { color: string; glow?: boolean }) {
  return (
    <div style={{
      width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0,
      boxShadow: glow ? `0 0 7px ${color}` : 'none',
    }} />
  );
}

function DomainCard({
  card,
  onClick,
}: {
  card: typeof DOMAIN_CARDS[number];
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  const dotColor = card.status === 'alert' ? C.rose : card.status === 'warn' ? C.amber : C.teal;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? C.bg3 : C.bg2, border: `1px solid ${hov ? C.b2 : C.b1}`,
        borderRadius: 12, padding: '15px 16px', cursor: 'pointer', transition: 'all 0.14s',
        position: 'relative', overflow: 'hidden', fontFamily: font,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, background: `${card.color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <card.Icon size={13} color={card.color} />
          </div>
          <span style={{ color: C.t1, fontSize: 11.5, fontWeight: 500 }}>{card.label}</span>
        </div>
        <Dot color={dotColor} glow={card.status === 'alert'} />
      </div>
      <div style={{ color: C.t0, fontSize: 14.5, fontWeight: 600, marginBottom: 4, fontFamily: mono }}>{card.metric}</div>
      <div style={{ color: C.t1, fontSize: 11.5 }}>{card.sub}</div>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg,${card.color}70,transparent)`,
        opacity: hov ? 1 : 0, transition: 'opacity 0.2s',
      }} />
    </div>
  );
}

export function DashboardView() {
  const { setView } = useAppStore();
  const today = new Date().toLocaleDateString('ko-KR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ padding: '26px 28px', maxWidth: 860, fontFamily: font }}>
      {/* Greeting */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ color: C.t1, fontSize: 11, fontFamily: mono, marginBottom: 5 }}>{today}</div>
        <h1 style={{ color: C.t0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px' }}>안녕하세요 👋</h1>
      </div>

      {/* AI Briefing */}
      <div style={{
        background: C.bg2, border: `1px solid ${C.b1}`, borderLeft: `3px solid ${C.blue}`,
        borderRadius: 12, padding: '16px 18px', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <Zap size={12} color={C.blue} />
          <span style={{ color: C.blue, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase' }}>오늘의 브리핑</span>
        </div>
        <p style={{ color: C.t0, fontSize: 13, lineHeight: 1.65, marginBottom: 12 }}>
          일정 3개, 마감 임박 태스크 2개가 있어요. <strong style={{ color: '#fff' }}>기획서 초안</strong> 마감이 내일이에요. 오전 집중 시간을 먼저 확보하는 게 좋을 것 같아요.
        </p>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {['10:00 팀 스탠드업', '14:00 디자인 리뷰', '18:30 헬스장'].map((e) => (
            <span key={e} style={{
              background: C.bg3, border: `1px solid ${C.b1}`,
              borderRadius: 6, padding: '3px 9px', color: C.t1, fontSize: 11, fontFamily: mono,
            }}>{e}</span>
          ))}
        </div>
      </div>

      {/* Alert */}
      <div style={{
        background: `${C.amber}0E`, border: `1px solid ${C.amber}35`,
        borderRadius: 10, padding: '9px 14px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 9,
      }}>
        <AlertTriangle size={13} color={C.amber} />
        <span style={{ color: `${C.amber}E0`, fontSize: 12.5, flex: 1 }}>
          건강: 3일째 운동 기록이 없어요. 오늘 20분 산책을 일정에 잡아드릴까요?
        </span>
        <button onClick={() => setView('health')} style={{ color: C.amber, fontSize: 12, fontFamily: font, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          건강 보기 →
        </button>
      </div>

      {/* Domain grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 11 }}>
        {DOMAIN_CARDS.map((card) => (
          <DomainCard key={card.id} card={card} onClick={() => setView(card.id)} />
        ))}
      </div>
    </div>
  );
}
