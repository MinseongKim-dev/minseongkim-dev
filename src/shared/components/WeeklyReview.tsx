import { useEffect, useState } from 'react';
import { X, CheckSquare, Calendar, Activity, Smile, Target } from 'lucide-react';
import { useTasksStore } from '../stores/tasks.store';
import { useEventsStore } from '../stores/events.store';
import { useHealthStore } from '../stores/health.store';

const C = {
  bg1: '#090D1F', bg2: '#0D1228', bg3: '#131B32',
  b0: 'rgba(255,255,255,0.04)', b1: 'rgba(255,255,255,0.08)', b2: 'rgba(255,255,255,0.24)',
  t0: '#DDE5F5', t1: '#556070', t2: '#253040',
  blue: '#3B8EF0', violet: '#7C5CF0', teal: '#00CCA0', amber: '#EFA020', rose: '#F05472', sky: '#58AEFF',
};
const font = '"Space Grotesk", system-ui, sans-serif';
const mono = '"JetBrains Mono", "Fira Code", monospace';

const MOOD_EMOJI = { 1: '😢', 2: '😕', 3: '😐', 4: '😊', 5: '😄' } as Record<number, string>;
const MOOD_COLOR = { 1: C.rose, 2: C.amber, 3: C.t1, 4: C.sky, 5: C.teal } as Record<number, string>;

function getWeekRange(): { start: string; end: string; weekKey: string } {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  const mon = new Date(today);
  mon.setDate(today.getDate() - ((dow + 6) % 7) - 7); // last Monday
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { start: fmt(mon), end: fmt(sun), weekKey: fmt(mon) };
}

function isSunday(): boolean {
  return new Date().getDay() === 0;
}

function hasReviewedThisWeek(): boolean {
  const { weekKey } = getWeekRange();
  return localStorage.getItem(`weeklyReview:${weekKey}`) === '1';
}

function markReviewed(): void {
  const { weekKey } = getWeekRange();
  localStorage.setItem(`weeklyReview:${weekKey}`, '1');
}

function getSavedGoals(weekKey: string): string {
  return localStorage.getItem(`weeklyGoals:${weekKey}`) ?? '';
}

function saveGoals(weekKey: string, goals: string): void {
  localStorage.setItem(`weeklyGoals:${weekKey}`, goals);
}

interface WeeklyReviewProps {
  triggerOpen?: boolean;
  onClose?: () => void;
}

export function WeeklyReview({ triggerOpen, onClose }: WeeklyReviewProps) {
  const [open, setOpen] = useState(false);
  const [goals, setGoals] = useState('');

  const tasks = useTasksStore((s) => s.items);
  const events = useEventsStore((s) => s.items);
  const { items: workouts, moodLogs } = useHealthStore();

  const { start, end, weekKey } = getWeekRange();

  useEffect(() => {
    if (triggerOpen) {
      setGoals(getSavedGoals(weekKey));
      setOpen(true);
    }
  }, [triggerOpen, weekKey]);

  useEffect(() => {
    if (isSunday() && !hasReviewedThisWeek()) {
      setGoals(getSavedGoals(weekKey));
      setOpen(true);
    }
  }, [weekKey]);

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  const handleDone = () => {
    saveGoals(weekKey, goals);
    markReviewed();
    handleClose();
  };

  if (!open) return null;

  // Compute last week summaries
  const weekTasks = tasks.filter((t) => {
    if (!t.due) return false;
    return t.due >= start && t.due <= end;
  });
  const doneTasks = weekTasks.filter((t) => t.done);
  const pendingTasks = weekTasks.filter((t) => !t.done);

  const weekEvents = events.filter((e) => e.date >= start && e.date <= end);
  const weekWorkouts = workouts.filter((w) => w.date >= start && w.date <= end);
  const weekMoods = moodLogs.filter((m) => m.date >= start && m.date <= end);
  const avgMood = weekMoods.length > 0
    ? Math.round(weekMoods.reduce((s, m) => s + m.mood, 0) / weekMoods.length)
    : null;

  const nextWeekMon = new Date(start);
  nextWeekMon.setDate(nextWeekMon.getDate() + 14);
  const nextWeekKey = nextWeekMon.toISOString().split('T')[0];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(6,9,26,0.80)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          width: '100%', maxWidth: 520, margin: '0 16px',
          background: C.bg1, border: `1px solid ${C.b2}`,
          borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.b0}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <p style={{ color: C.t1, fontSize: 11, fontFamily: mono, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              {start} ~ {end}
            </p>
            <h2 style={{ color: C.t0, fontSize: 18, fontWeight: 700, fontFamily: font, marginTop: 2 }}>주간 리뷰</h2>
          </div>
          <button onClick={handleClose} style={{ color: C.t1, cursor: 'pointer', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        {/* Scroll body */}
        <div style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { icon: CheckSquare, color: C.violet, label: '완료 할 일', value: `${doneTasks.length}개` },
              { icon: Calendar, color: C.blue, label: '이번 주 일정', value: `${weekEvents.length}개` },
              { icon: Activity, color: C.teal, label: '운동', value: `${weekWorkouts.length}회` },
              { icon: Smile, color: C.rose, label: '평균 기분', value: avgMood ? MOOD_EMOJI[avgMood] : '—' },
            ].map(({ icon: Icon, color, label, value }) => (
              <div key={label} style={{ background: C.bg2, border: `1px solid ${color}30`, borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
                <Icon size={14} color={color} style={{ margin: '0 auto 6px' }} />
                <p style={{ color, fontSize: 18, fontWeight: 700, fontFamily: mono }}>{value}</p>
                <p style={{ color: C.t1, fontSize: 10, marginTop: 3 }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Mood bar */}
          {weekMoods.length > 0 && (
            <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ color: C.t1, fontSize: 11, marginBottom: 10 }}>이번 주 기분 흐름</p>
              <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 40 }}>
                {weekMoods.map((m) => (
                  <div key={m.id} title={`${m.date}: ${MOOD_EMOJI[m.mood]}`} style={{
                    flex: 1, background: `${MOOD_COLOR[m.mood]}50`,
                    border: `1px solid ${MOOD_COLOR[m.mood]}80`,
                    borderRadius: 4,
                    height: `${(m.mood / 5) * 100}%`,
                    minHeight: 8,
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* Completed tasks */}
          {doneTasks.length > 0 && (
            <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.b0}`, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckSquare size={12} color={C.teal} />
                <span style={{ color: C.t0, fontSize: 12, fontWeight: 600 }}>완료한 할 일 ({doneTasks.length})</span>
              </div>
              {doneTasks.slice(0, 5).map((t) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderTop: `1px solid ${C.b0}` }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.teal, flexShrink: 0 }} />
                  <span style={{ color: C.t1, fontSize: 12, flex: 1 }}>{t.title}</span>
                </div>
              ))}
              {doneTasks.length > 5 && (
                <div style={{ padding: '8px 14px', borderTop: `1px solid ${C.b0}` }}>
                  <span style={{ color: C.t1, fontSize: 11 }}>+ {doneTasks.length - 5}개 더...</span>
                </div>
              )}
            </div>
          )}

          {/* Pending tasks */}
          {pendingTasks.length > 0 && (
            <div style={{ background: C.bg2, border: `1px solid ${C.amber}30`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.b0}`, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckSquare size={12} color={C.amber} />
                <span style={{ color: C.t0, fontSize: 12, fontWeight: 600 }}>미완료 할 일 ({pendingTasks.length})</span>
              </div>
              {pendingTasks.slice(0, 3).map((t) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderTop: `1px solid ${C.b0}` }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.amber, flexShrink: 0 }} />
                  <span style={{ color: C.t1, fontSize: 12, flex: 1 }}>{t.title}</span>
                  {t.due && <span style={{ color: C.amber, fontSize: 10, fontFamily: mono }}>{t.due}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Next week goals */}
          <div style={{ background: C.bg2, border: `1px solid ${C.blue}30`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Target size={12} color={C.blue} />
              <span style={{ color: C.t0, fontSize: 12, fontWeight: 600 }}>다음 주 목표</span>
            </div>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder={'다음 주에 이루고 싶은 것들을 적어보세요...\n• 운동 3회\n• 독서 2시간\n• 프로젝트 마일스톤 완료'}
              style={{
                width: '100%', minHeight: 100, background: C.bg3,
                border: `1px solid ${C.b1}`, borderRadius: 8,
                padding: '10px 12px', color: C.t0, fontSize: 13,
                fontFamily: font, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${C.b0}`, display: 'flex', gap: 8 }}>
          <button
            onClick={() => { saveGoals(nextWeekKey, goals); handleClose(); }}
            style={{
              flex: 1, padding: '11px', borderRadius: 10, cursor: 'pointer', fontFamily: font,
              background: 'transparent', border: `1px solid ${C.b1}`, color: C.t1, fontSize: 13,
            }}
          >
            나중에
          </button>
          <button
            onClick={handleDone}
            style={{
              flex: 2, padding: '11px', borderRadius: 10, cursor: 'pointer', fontFamily: font,
              background: C.blue, color: '#fff', fontSize: 13, fontWeight: 600,
            }}
          >
            리뷰 완료
          </button>
        </div>
      </div>
    </div>
  );
}
