import { useEffect, useState } from 'react';
import {
  Calendar, CheckSquare, DollarSign, Activity,
  BookOpen, Briefcase, Users, Zap, AlertTriangle, Sparkles,
} from 'lucide-react';
import { useAppStore, type ViewId } from '../../shared/stores/app.store';
import { useTasksStore } from '../../shared/stores/tasks.store';
import { useEventsStore } from '../../shared/stores/events.store';
import { useFinanceStore } from '../../shared/stores/finance.store';
import { useHealthStore } from '../../shared/stores/health.store';
import { useLearningStore } from '../../shared/stores/learning.store';
import { useRelationshipsStore } from '../../shared/stores/relationships.store';
import { useBriefingStore } from '../../shared/stores/briefing.store';

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

interface CardConfig {
  id: ViewId;
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  metric: string;
  sub: string;
  status: DotStatus;
}

function Dot({ color, glow }: { color: string; glow?: boolean }) {
  return (
    <div style={{
      width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0,
      boxShadow: glow ? `0 0 7px ${color}` : 'none',
    }} />
  );
}

function DomainCard({ card, onClick }: { card: CardConfig; onClick: () => void }) {
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
      <div style={{ color: C.t0, fontSize: 14.5, fontWeight: 600, marginBottom: 4, fontFamily: mono }}>
        {card.metric}
      </div>
      <div style={{ color: C.t1, fontSize: 11.5 }}>{card.sub}</div>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg,${card.color}70,transparent)`,
        opacity: hov ? 1 : 0, transition: 'opacity 0.2s',
      }} />
    </div>
  );
}

const HIGHLIGHT_COLORS: Record<string, string> = {
  schedule: C.blue, task: C.violet, finance: C.amber, health: C.teal, career: '#9B7CF5',
};

export function DashboardView() {
  const { setView } = useAppStore();
  const { items: tasks, fetch: fetchTasks } = useTasksStore();
  const { items: events, fetch: fetchEvents } = useEventsStore();
  const { items: transactions, fetch: fetchTransactions } = useFinanceStore();
  const { items: workouts, fetch: fetchWorkouts } = useHealthStore();
  const { goals, books, fetch: fetchLearning } = useLearningStore();
  const { items: contacts, fetch: fetchContacts } = useRelationshipsStore();
  const { item: briefing, fetch: fetchBriefing } = useBriefingStore();

  useEffect(() => {
    fetchTasks();
    fetchEvents();
    fetchTransactions();
    fetchWorkouts();
    fetchLearning();
    fetchContacts();
    fetchBriefing();
  }, [fetchTasks, fetchEvents, fetchTransactions, fetchWorkouts, fetchLearning, fetchContacts, fetchBriefing]);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todayFmt = today.toLocaleDateString('ko-KR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // Tasks
  const doneTasks = tasks.filter((t) => t.done).length;
  const urgentTasks = tasks.filter((t) => !t.done && t.priority === 'urgent');
  const highPrioTasks = tasks.filter((t) => !t.done && (t.priority === 'urgent' || t.priority === 'high'));

  // Events
  const nowTime = today.toTimeString().slice(0, 5);
  const todayEvents = events
    .filter((e) => e.date === todayStr)
    .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
  const nextEvent = todayEvents.find((e) => !e.time || e.time >= nowTime) ?? todayEvents[0];

  // Finance
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString().split('T')[0];
  const monthExpense = transactions
    .filter((t) => t.type === 'expense' && t.date >= firstOfMonth)
    .reduce((s, t) => s + t.amount, 0);
  const monthTxCount = transactions.filter((t) => t.date >= firstOfMonth).length;

  // Health
  const lastWorkout = [...workouts].sort((a, b) => b.date.localeCompare(a.date))[0];
  const daysSinceWorkout = lastWorkout
    ? Math.floor((Date.now() - new Date(lastWorkout.date + 'T12:00:00').getTime()) / 86400000)
    : Infinity;
  const weekMon = new Date(today);
  weekMon.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const weekMonStr = weekMon.toISOString().split('T')[0];
  const weekWorkouts = workouts.filter((w) => w.date >= weekMonStr).length;

  // Learning
  const readingBooks = books.filter((b) => b.status === 'reading').length;
  const completedGoals = goals.filter((g) => g.progress >= 100).length;

  // Relationships
  const overdueContacts = contacts.filter((c) => {
    if (!c.lastContact) return contacts.length > 0;
    return Math.floor(
      (Date.now() - new Date(c.lastContact + 'T12:00:00').getTime()) / 86400000,
    ) > 30;
  });

  // Domain cards
  const DOMAIN_CARDS: CardConfig[] = [
    {
      id: 'schedule',
      label: '일정',
      Icon: Calendar,
      color: C.blue,
      metric: todayEvents.length > 0 ? `오늘 ${todayEvents.length}개 일정` : '오늘 일정 없음',
      sub: nextEvent
        ? `다음 ─ ${nextEvent.time ? nextEvent.time + ' ' : ''}${nextEvent.title}`
        : '여유로운 하루',
      status: todayEvents.length >= 4 ? 'warn' : 'ok',
    },
    {
      id: 'tasks',
      label: '할 일',
      Icon: CheckSquare,
      color: C.violet,
      metric: tasks.length > 0 ? `${tasks.length}개 중 ${doneTasks} 완료` : '할 일 없음',
      sub: urgentTasks.length > 0
        ? `긴급 ${urgentTasks.length}개`
        : highPrioTasks.length > 0
        ? `높음 ${highPrioTasks.length}개`
        : '모두 정상',
      status: urgentTasks.length >= 2 ? 'alert' : urgentTasks.length > 0 ? 'warn' : 'ok',
    },
    {
      id: 'finance',
      label: '재정',
      Icon: DollarSign,
      color: C.amber,
      metric: monthExpense > 0
        ? `₩${monthExpense.toLocaleString('ko-KR')} 지출`
        : '이번 달 지출 없음',
      sub: monthTxCount > 0 ? `이번 달 ${monthTxCount}건` : '거래 없음',
      status: 'ok',
    },
    {
      id: 'health',
      label: '건강',
      Icon: Activity,
      color: C.teal,
      metric: daysSinceWorkout === Infinity
        ? '운동 기록 없음'
        : daysSinceWorkout === 0
        ? '오늘 운동 완료 💪'
        : `${daysSinceWorkout}일 운동 없음`,
      sub: weekWorkouts > 0 ? `이번 주 ${weekWorkouts}회 운동` : '이번 주 운동 없음',
      status: daysSinceWorkout >= 3 ? 'alert' : daysSinceWorkout >= 1 ? 'warn' : 'ok',
    },
    {
      id: 'learning',
      label: '학습',
      Icon: BookOpen,
      color: C.sky,
      metric: goals.length > 0
        ? `목표 ${goals.length}개`
        : readingBooks > 0
        ? `${readingBooks}권 읽는 중`
        : '학습 없음',
      sub: readingBooks > 0
        ? `독서 중 ${readingBooks}권`
        : completedGoals > 0
        ? `완료 ${completedGoals}개`
        : '목표를 추가해보세요',
      status: 'ok',
    },
    {
      id: 'career',
      label: '커리어',
      Icon: Briefcase,
      color: '#9B7CF5',
      metric: '준비도 64%',
      sub: 'Phase 1 진행 중',
      status: 'ok',
    },
    {
      id: 'relations',
      label: '관계',
      Icon: Users,
      color: C.rose,
      metric: contacts.length > 0 ? `${contacts.length}명의 연락처` : '연락처 없음',
      sub: overdueContacts.length > 0 ? `${overdueContacts.length}명 미연락` : '모두 연락 중',
      status: overdueContacts.length >= 2 ? 'alert' : overdueContacts.length > 0 ? 'warn' : 'ok',
    },
  ];

  // Alert bar
  const alertItem: { msg: string; view: ViewId } | null =
    daysSinceWorkout >= 3
      ? {
          msg: daysSinceWorkout === Infinity
            ? '건강: 운동 기록이 없어요. 오늘 20분 산책을 일정에 잡아드릴까요?'
            : `건강: ${daysSinceWorkout}일째 운동 기록이 없어요. 오늘 20분 산책은 어때요?`,
          view: 'health',
        }
      : urgentTasks.length > 0
      ? {
          msg: `할 일: 긴급 항목이 ${urgentTasks.length}개 있어요.${urgentTasks[0] ? ` 「${urgentTasks[0].title}」을(를) 먼저 처리해보세요.` : ''}`,
          view: 'tasks',
        }
      : null;

  // Fallback local briefing text (when no AI briefing exists)
  const briefingParts: string[] = [];
  if (todayEvents.length > 0) briefingParts.push(`오늘 일정 ${todayEvents.length}개`);
  if (urgentTasks.length > 0) briefingParts.push(`긴급 태스크 ${urgentTasks.length}개`);
  if (daysSinceWorkout >= 3 && daysSinceWorkout !== Infinity) briefingParts.push(`${daysSinceWorkout}일 운동 없음`);
  if (overdueContacts.length > 0) briefingParts.push(`연락 필요 ${overdueContacts.length}명`);

  const fallbackText = briefingParts.length === 0
    ? '오늘은 특별히 주의해야 할 항목이 없어요. 여유롭게 학습이나 계획에 집중해보세요 ✨'
    : `${briefingParts.join(', ')}가 있어요.${
        urgentTasks[0]
          ? ` 「${urgentTasks[0].title}」이(가) 가장 우선이에요.`
          : nextEvent
          ? ` 다음 일정은 ${nextEvent.time ? nextEvent.time + ' ' : ''}${nextEvent.title}이에요.`
          : ''
      }`;

  const hasAiBriefing = !!briefing?.briefing;
  const aiBriefing = briefing?.briefing;
  const briefingDate = briefing?.date;
  const isToday = briefingDate === todayStr;

  return (
    <div style={{ fontFamily: font }}>
      {/* Greeting */}
      <div style={{ marginBottom: 14, display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <h1 style={{ color: C.t0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>안녕하세요 👋</h1>
        <span style={{ color: C.t1, fontSize: 11, fontFamily: mono }}>{todayFmt}</span>
      </div>

      {/* AI Briefing Card */}
      <div style={{
        background: C.bg2, border: `1px solid ${C.b1}`, borderLeft: `3px solid ${C.blue}`,
        borderRadius: 12, padding: '13px 16px', marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          {hasAiBriefing && isToday
            ? <Sparkles size={12} color={C.blue} />
            : <Zap size={12} color={C.blue} />}
          <span style={{ color: C.blue, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
            오늘의 브리핑
          </span>
          {hasAiBriefing && (
            <span style={{ marginLeft: 'auto', color: isToday ? C.teal : C.t1, fontSize: 10, fontFamily: mono }}>
              {isToday ? 'AI 생성 · 오늘' : `AI 생성 · ${briefingDate}`}
            </span>
          )}
        </div>

        {hasAiBriefing ? (
          <>
            {aiBriefing!.greeting && (
              <p style={{ color: C.t0, fontSize: 13.5, fontWeight: 500, marginBottom: 8 }}>
                {aiBriefing!.greeting}
              </p>
            )}
            {aiBriefing!.summary && (
              <p style={{ color: C.t0, fontSize: 13, lineHeight: 1.65, marginBottom: 12 }}>
                {aiBriefing!.summary}
              </p>
            )}
            {aiBriefing!.highlights && aiBriefing!.highlights.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                {aiBriefing!.highlights.slice(0, 3).map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{
                      width: 4, height: 4, borderRadius: '50%', flexShrink: 0, marginTop: 7,
                      background: HIGHLIGHT_COLORS[h.type] ?? C.blue,
                    }} />
                    <span style={{ color: C.t0, fontSize: 12.5, lineHeight: 1.5 }}>{h.message}</span>
                    {h.priority === 'high' && (
                      <span style={{
                        flexShrink: 0, fontSize: 9.5, fontWeight: 600, color: C.rose,
                        background: `${C.rose}18`, borderRadius: 4, padding: '1px 5px',
                      }}>HIGH</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {aiBriefing!.suggestions && aiBriefing!.suggestions.length > 0 && (
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {aiBriefing!.suggestions.slice(0, 3).map((s, i) => (
                  <span key={i} style={{
                    background: C.bg3, border: `1px solid ${C.b1}`,
                    borderRadius: 6, padding: '3px 9px', color: C.t1, fontSize: 11, fontFamily: mono,
                  }}>{s}</span>
                ))}
              </div>
            )}
            {aiBriefing!.motivationalNote && (
              <p style={{ color: `${C.teal}CC`, fontSize: 12, marginTop: 10, fontStyle: 'italic' }}>
                {aiBriefing!.motivationalNote}
              </p>
            )}
          </>
        ) : (
          <>
            <p style={{ color: C.t0, fontSize: 13, lineHeight: 1.65, marginBottom: briefingParts.length > 0 ? 12 : 0 }}>
              {fallbackText}
            </p>
            {briefingParts.length > 0 && (
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {todayEvents.slice(0, 2).map((e) => (
                  <span key={e.id} style={{
                    background: C.bg3, border: `1px solid ${C.b1}`,
                    borderRadius: 6, padding: '3px 9px', color: C.t1, fontSize: 11, fontFamily: mono,
                  }}>{e.time ? e.time + ' ' : ''}{e.title}</span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Alert */}
      {alertItem && (
        <div style={{
          background: `${C.amber}0E`, border: `1px solid ${C.amber}35`,
          borderRadius: 10, padding: '9px 14px', marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 9,
        }}>
          <AlertTriangle size={13} color={C.amber} />
          <span style={{ color: `${C.amber}E0`, fontSize: 12.5, flex: 1 }}>{alertItem.msg}</span>
          <button
            onClick={() => setView(alertItem.view)}
            style={{ color: C.amber, fontSize: 12, fontFamily: font, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            보기 →
          </button>
        </div>
      )}

      {/* Domain grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
        {DOMAIN_CARDS.map((card) => (
          <DomainCard key={card.id} card={card} onClick={() => setView(card.id)} />
        ))}
      </div>
    </div>
  );
}
