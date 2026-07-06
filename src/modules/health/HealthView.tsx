import { useEffect, useState } from 'react';
import { Plus, Trash2, Flame, Clock, Activity, Moon, BarChart2, Star } from 'lucide-react';
import { useHealthStore, type SleepLog } from '../../shared/stores/health.store';
import { useWindowSize } from '../../shared/hooks/useWindowSize';

const C = {
  bg0: '#06091A', bg1: '#090D1F', bg2: '#0D1228', bg3: '#131B32',
  b0: 'rgba(255,255,255,0.04)', b1: 'rgba(255,255,255,0.08)',
  t0: '#DDE5F5', t1: '#6B7A94', t2: '#2E3A52',
  blue: '#3B8EF0', teal: '#00CCA0', amber: '#EFA020', rose: '#F05472',
  sky: '#58AEFF', violet: '#7C5CF0',
};
const font = '"Space Grotesk", system-ui, sans-serif';
const mono = '"JetBrains Mono", "Fira Code", monospace';

const WORKOUT_TYPES = ['달리기', '걷기', '자전거', '수영', '요가', '필라테스', '웨이트', 'HIIT', '기타'];
const TYPE_EMOJI: Record<string, string> = {
  달리기: '🏃', 걷기: '🚶', 자전거: '🚴', 수영: '🏊', 요가: '🧘',
  필라테스: '🤸', 웨이트: '🏋️', HIIT: '⚡', 기타: '💪',
};

function getWeekStart(): string {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

function calcSleepDuration(bedTime: string, wakeTime: string): number {
  const [bh, bm] = bedTime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  let mins = (wh * 60 + wm) - (bh * 60 + bm);
  if (mins < 0) mins += 24 * 60;
  return mins;
}

function fmtDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function QualityStars({ q, size = 12 }: { q: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} fill={i <= q ? C.amber : 'none'} color={i <= q ? C.amber : C.t2} />
      ))}
    </span>
  );
}

function StatCard({
  label, value, unit, icon: Icon, color,
}: {
  label: string; value: string | number; unit: string;
  icon: React.ComponentType<{ size?: number; color?: string }>; color: string;
}) {
  return (
    <div style={{ flex: 1, background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Icon size={14} color={color} />
        <span style={{ color: C.t1, fontSize: 12 }}>{label}</span>
      </div>
      <p style={{ fontFamily: mono }}>
        <span style={{ color, fontSize: 22, fontWeight: 700 }}>{value}</span>
        {unit && <span style={{ color: C.t1, fontSize: 12, marginLeft: 4 }}>{unit}</span>}
      </p>
    </div>
  );
}

// Dashboard tab is read-only and self-contained
function DashboardTab() {
  const { items, sleepLogs } = useHealthStore();
  const today = new Date().toISOString().split('T')[0];
  const weekStart = getWeekStart();

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const weekWorkouts = items.filter((w) => w.date >= weekStart);
  const weekSleep = sleepLogs.filter((l) => l.date >= weekStart);

  const workoutsByDay = last7Days.map((day) => ({
    day: day.slice(5),
    mins: items.filter((w) => w.date === day).reduce((s, w) => s + w.duration, 0),
  }));
  const maxWorkoutMins = Math.max(...workoutsByDay.map((d) => d.mins), 1);

  const sleepByDay = last7Days.map((day) => ({
    day: day.slice(5),
    mins: sleepLogs.find((l) => l.date === day)?.duration ?? 0,
    quality: sleepLogs.find((l) => l.date === day)?.quality ?? 0,
  }));
  const maxSleepMins = Math.max(...sleepByDay.map((d) => d.mins), 1);

  const totalWeekCal = weekWorkouts.reduce((s, w) => s + (w.calories ?? 0), 0);
  const avgSleepDur = weekSleep.length > 0
    ? Math.round(weekSleep.reduce((s, l) => s + l.duration, 0) / weekSleep.length)
    : 0;
  const avgSleepQ = weekSleep.length > 0
    ? +(weekSleep.reduce((s, l) => s + l.quality, 0) / weekSleep.length).toFixed(1)
    : 0;

  const recentWorkout = items.length > 0 ? [...items].sort((a, b) => b.date.localeCompare(a.date))[0] : null;
  const daysSinceWorkout = recentWorkout
    ? Math.floor((new Date(today).getTime() - new Date(recentWorkout.date).getTime()) / 86400000)
    : null;

  const todaySleep = sleepLogs.find((l) => l.date === today);

  return (
    <>
      {daysSinceWorkout !== null && daysSinceWorkout >= 3 && (
        <div style={{ background: `${C.amber}10`, border: `1px solid ${C.amber}40`, borderLeft: `3px solid ${C.amber}`, borderRadius: 10, padding: '10px 14px', marginBottom: 18, fontSize: 12.5, color: C.t0 }}>
          마지막 운동으로부터 <strong style={{ color: C.amber }}>{daysSinceWorkout}일</strong> 지났습니다.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: '이번 주 운동', value: `${weekWorkouts.length}회`, color: C.teal },
          { label: '총 소모 칼로리', value: `${totalWeekCal}kcal`, color: C.amber },
          { label: '평균 수면', value: avgSleepDur ? fmtDuration(avgSleepDur) : '-', color: C.violet },
          { label: '수면 질', value: avgSleepQ ? `${avgSleepQ}/5` : '-', color: C.sky },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ color: C.t1, fontSize: 11, marginBottom: 6 }}>{label}</p>
            <p style={{ color, fontSize: 18, fontWeight: 700, fontFamily: mono }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '16px 18px' }}>
          <p style={{ color: C.t1, fontSize: 11, marginBottom: 14 }}>운동 시간 (7일)</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 72 }}>
            {workoutsByDay.map(({ day, mins }) => (
              <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', height: `${Math.max((mins / maxWorkoutMins) * 100, 4)}%`, background: mins > 0 ? C.teal : C.b1, borderRadius: '3px 3px 0 0' }} title={`${mins}분`} />
                <span style={{ color: C.t2, fontSize: 9, fontFamily: mono }}>{day}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '16px 18px' }}>
          <p style={{ color: C.t1, fontSize: 11, marginBottom: 14 }}>수면 시간 (7일)</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 72 }}>
            {sleepByDay.map(({ day, mins, quality }) => (
              <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', height: `${Math.max((mins / maxSleepMins) * 100, 4)}%`, background: mins === 0 ? C.b1 : quality >= 4 ? C.violet : quality >= 3 ? C.sky : C.rose, borderRadius: '3px 3px 0 0' }} title={fmtDuration(mins)} />
                <span style={{ color: C.t2, fontSize: 9, fontFamily: mono }}>{day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '16px 18px' }}>
        <p style={{ color: C.t1, fontSize: 11, marginBottom: 12 }}>오늘 현황</p>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div>
            <p style={{ color: C.t1, fontSize: 12, marginBottom: 4 }}>오늘 운동</p>
            {items.filter((w) => w.date === today).length > 0 ? (
              items.filter((w) => w.date === today).map((w) => (
                <p key={w.id} style={{ color: C.teal, fontSize: 13, fontWeight: 600 }}>
                  {TYPE_EMOJI[w.type] ?? '💪'} {w.type} {fmtDuration(w.duration)}
                </p>
              ))
            ) : (
              <p style={{ color: C.t2, fontSize: 13 }}>기록 없음</p>
            )}
          </div>
          <div>
            <p style={{ color: C.t1, fontSize: 12, marginBottom: 4 }}>어젯밤 수면</p>
            {todaySleep ? (
              <p style={{ color: C.sky, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                🌙 {fmtDuration(todaySleep.duration)} <QualityStars q={todaySleep.quality} size={10} />
              </p>
            ) : (
              <p style={{ color: C.t2, fontSize: 13 }}>기록 없음</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────
export function HealthView() {
  const { items, sleepLogs, loading, add, remove, addSleepLog, removeSleepLog, fetch } = useHealthStore();
  const { isMobile } = useWindowSize();
  const [tab, setTab] = useState<'workout' | 'sleep' | 'dashboard'>('dashboard');

  // Workout form
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [workoutType, setWorkoutType] = useState('달리기');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [workoutNotes, setWorkoutNotes] = useState('');

  // Sleep form
  const [showSleepForm, setShowSleepForm] = useState(false);
  const [sleepDate, setSleepDate] = useState(new Date().toISOString().split('T')[0]);
  const [bedTime, setBedTime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState<SleepLog['quality']>(3);
  const [sleepNotes, setSleepNotes] = useState('');

  useEffect(() => { fetch(); }, [fetch]);

  const weekStart = getWeekStart();
  const weekItems = items.filter((w) => w.date >= weekStart);
  const totalMins = weekItems.reduce((s, w) => s + w.duration, 0);
  const totalCal = weekItems.reduce((s, w) => s + (w.calories ?? 0), 0);
  const sortedWorkouts = [...items].sort((a, b) => b.date.localeCompare(a.date));

  const weekSleepLogs = sleepLogs.filter((l) => l.date >= weekStart);
  const avgSleepDur = weekSleepLogs.length > 0
    ? Math.round(weekSleepLogs.reduce((s, l) => s + l.duration, 0) / weekSleepLogs.length)
    : 0;
  const avgSleepQ = weekSleepLogs.length > 0
    ? +(weekSleepLogs.reduce((s, l) => s + l.quality, 0) / weekSleepLogs.length).toFixed(1)
    : 0;
  const sortedSleep = [...sleepLogs].sort((a, b) => b.date.localeCompare(a.date));

  const qualityColor = (q: number) => q >= 4 ? C.teal : q >= 3 ? C.amber : C.rose;
  const qualityLabel = (q: number) => (['', '나쁨', '별로', '보통', '좋음', '매우 좋음'] as const)[q] ?? '';

  const handleAddWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    const d = parseInt(duration);
    if (!d || d <= 0) return;
    await add({ type: workoutType, duration: d, calories: calories ? parseInt(calories) : undefined, date: workoutDate, notes: workoutNotes || undefined });
    setDuration(''); setCalories(''); setWorkoutNotes('');
    if (isMobile) setShowWorkoutForm(false);
  };

  const handleAddSleep = async (e: React.FormEvent) => {
    e.preventDefault();
    const dur = calcSleepDuration(bedTime, wakeTime);
    await addSleepLog({ date: sleepDate, bedTime, wakeTime, duration: dur, quality, notes: sleepNotes || undefined });
    setSleepNotes('');
    if (isMobile) setShowSleepForm(false);
  };

  const WorkoutForm = (
    <form onSubmit={handleAddWorkout} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <select value={workoutType} onChange={(e) => setWorkoutType(e.target.value)}
        style={{ background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>
        {WORKOUT_TYPES.map((t) => <option key={t} value={t}>{TYPE_EMOJI[t]} {t}</option>)}
      </select>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="운동 시간 (분)" inputMode="numeric"
          style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: mono, outline: 'none' }} />
        <input value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="칼로리 (선택)" inputMode="numeric"
          style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: mono, outline: 'none' }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="date" value={workoutDate} onChange={(e) => setWorkoutDate(e.target.value)}
          style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, colorScheme: 'dark' }} />
        <input value={workoutNotes} onChange={(e) => setWorkoutNotes(e.target.value)} placeholder="메모 (선택)"
          style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, outline: 'none' }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" style={{ flex: 1, padding: '9px', background: C.teal, color: '#06091A', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: font, cursor: 'pointer' }}>기록 추가</button>
        {isMobile && (
          <button type="button" onClick={() => setShowWorkoutForm(false)} style={{ padding: '9px 16px', background: C.bg1, border: `1px solid ${C.b1}`, color: C.t1, borderRadius: 8, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>취소</button>
        )}
      </div>
    </form>
  );

  const SleepForm = (
    <form onSubmit={handleAddSleep} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input type="date" value={sleepDate} onChange={(e) => setSleepDate(e.target.value)}
        style={{ background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, colorScheme: 'dark', width: '100%', boxSizing: 'border-box' }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <p style={{ color: C.t1, fontSize: 11, marginBottom: 4 }}>취침 시간</p>
          <input type="time" value={bedTime} onChange={(e) => setBedTime(e.target.value)}
            style={{ width: '100%', background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: mono, colorScheme: 'dark', boxSizing: 'border-box' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: C.t1, fontSize: 11, marginBottom: 4 }}>기상 시간</p>
          <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)}
            style={{ width: '100%', background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: mono, colorScheme: 'dark', boxSizing: 'border-box' }} />
        </div>
      </div>
      <div>
        <p style={{ color: C.t1, fontSize: 11, marginBottom: 6 }}>수면 질 — {qualityLabel(quality)}</p>
        <div style={{ display: 'flex', gap: 6 }}>
          {([1, 2, 3, 4, 5] as const).map((q) => (
            <button key={q} type="button" onClick={() => setQuality(q)}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: font,
                background: quality === q ? `${qualityColor(q)}20` : C.bg1,
                border: `1px solid ${quality === q ? qualityColor(q) : C.b1}`,
                color: quality === q ? qualityColor(q) : C.t1,
              }}
            >{q}점</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ color: C.sky, fontSize: 12, fontFamily: mono, flexShrink: 0 }}>
          {fmtDuration(calcSleepDuration(bedTime, wakeTime))}
        </span>
        <input value={sleepNotes} onChange={(e) => setSleepNotes(e.target.value)} placeholder="메모 (선택)"
          style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, outline: 'none' }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" style={{ flex: 1, padding: '9px', background: C.violet, color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: font, cursor: 'pointer' }}>기록 추가</button>
        {isMobile && (
          <button type="button" onClick={() => setShowSleepForm(false)} style={{ padding: '9px 16px', background: C.bg1, border: `1px solid ${C.b1}`, color: C.t1, borderRadius: 8, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>취소</button>
        )}
      </div>
    </form>
  );

  const tabs = [
    { id: 'dashboard' as const, label: '대시보드', icon: BarChart2, color: C.blue },
    { id: 'workout' as const, label: '운동', icon: Activity, color: C.teal },
    { id: 'sleep' as const, label: '수면', icon: Moon, color: C.violet },
  ];

  return (
    <div style={{ fontFamily: font, display: 'flex', gap: 20, alignItems: 'flex-start' }}>

      {/* ── Left column ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: 12 }}>
          <h1 style={{ color: C.t0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>건강</h1>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {tabs.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 7,
                fontSize: 12.5, cursor: 'pointer', fontFamily: font,
                background: tab === id ? C.bg3 : 'transparent',
                border: `1px solid ${tab === id ? C.b1 : 'transparent'}`,
                color: tab === id ? C.t0 : C.t1,
              }}
            >
              <Icon size={13} color={tab === id ? color : C.t1} />
              {label}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && <DashboardTab />}

        {tab === 'workout' && (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <StatCard label="이번 주 운동" value={weekItems.length} unit="회" icon={Activity} color={C.teal} />
              <StatCard label="총 운동 시간" value={fmtDuration(totalMins)} unit="" icon={Clock} color={C.blue} />
              <StatCard label="소모 칼로리" value={totalCal} unit="kcal" icon={Flame} color={C.amber} />
            </div>

            {/* Type pills: mobile only (desktop shows in right panel) */}
            {isMobile && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                {WORKOUT_TYPES.map((t) => (
                  <button key={t} onClick={() => { setWorkoutType(t); setShowWorkoutForm(true); }}
                    style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontFamily: font,
                      background: workoutType === t && showWorkoutForm ? `${C.teal}20` : C.bg2,
                      border: `1px solid ${workoutType === t && showWorkoutForm ? C.teal : C.b1}`,
                      color: workoutType === t && showWorkoutForm ? C.teal : C.t1,
                    }}
                  >{TYPE_EMOJI[t]} {t}</button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {loading && <p style={{ color: C.t2, fontSize: 13 }}>불러오는 중...</p>}
              {sortedWorkouts.map((w) => (
                <div key={w.id} style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: `${C.teal}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    {TYPE_EMOJI[w.type] ?? '💪'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: C.t0, fontSize: 13.5 }}>{w.type}</p>
                    <p style={{ color: C.t1, fontSize: 11, marginTop: 2 }}>{w.date}{w.notes && ` · ${w.notes}`}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ color: C.blue, fontSize: 12, fontFamily: mono, display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} />{fmtDuration(w.duration)}</span>
                    {w.calories && <span style={{ color: C.amber, fontSize: 12, fontFamily: mono, display: 'flex', alignItems: 'center', gap: 3 }}><Flame size={10} />{w.calories}kcal</span>}
                  </div>
                  <button onClick={() => remove(w.id)} style={{ color: C.t2, cursor: 'pointer', display: 'flex' }}><Trash2 size={13} /></button>
                </div>
              ))}
              {items.length === 0 && !loading && <p style={{ color: C.t2, fontSize: 13, padding: '20px 0' }}>운동 기록이 없습니다.</p>}
            </div>

            {isMobile && (
              showWorkoutForm ? WorkoutForm : (
                <button onClick={() => setShowWorkoutForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer', padding: '8px 0' }}>
                  <Plus size={14} />운동 기록 추가
                </button>
              )
            )}
          </>
        )}

        {tab === 'sleep' && (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <StatCard label="이번 주 기록" value={weekSleepLogs.length} unit="일" icon={Moon} color={C.violet} />
              <StatCard label="평균 수면 시간" value={avgSleepDur ? fmtDuration(avgSleepDur) : '-'} unit="" icon={Clock} color={C.sky} />
              <StatCard label="평균 수면 질" value={avgSleepQ || '-'} unit="/ 5" icon={Star} color={C.amber} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {loading && <p style={{ color: C.t2, fontSize: 13 }}>불러오는 중...</p>}
              {sortedSleep.map((l) => (
                <div key={l.id} style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: `${C.violet}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    🌙
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: C.t0, fontSize: 13.5 }}>{l.date}</span>
                      <span style={{ color: qualityColor(l.quality), fontSize: 11, fontFamily: mono }}>{qualityLabel(l.quality)}</span>
                    </div>
                    <p style={{ color: C.t1, fontSize: 11, marginTop: 2 }}>
                      {l.bedTime} → {l.wakeTime}{l.notes && ` · ${l.notes}`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ color: C.sky, fontSize: 12, fontFamily: mono, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={10} />{fmtDuration(l.duration)}
                    </span>
                    <QualityStars q={l.quality} />
                  </div>
                  <button onClick={() => removeSleepLog(l.id)} style={{ color: C.t2, cursor: 'pointer', display: 'flex' }}><Trash2 size={13} /></button>
                </div>
              ))}
              {sleepLogs.length === 0 && !loading && <p style={{ color: C.t2, fontSize: 13, padding: '20px 0' }}>수면 기록이 없습니다.</p>}
            </div>

            {isMobile && (
              showSleepForm ? SleepForm : (
                <button onClick={() => setShowSleepForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer', padding: '8px 0' }}>
                  <Plus size={14} />수면 기록 추가
                </button>
              )
            )}
          </>
        )}
      </div>

      {/* ── Right panel: desktop only ── */}
      {!isMobile && (
        <div style={{ width: 264, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {tab === 'dashboard' && (
            <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ color: C.t1, fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 12 }}>빠른 이동</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={() => setTab('workout')}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: `${C.teal}10`, border: `1px solid ${C.teal}30`, borderRadius: 10, cursor: 'pointer', fontFamily: font }}>
                  <Activity size={14} color={C.teal} />
                  <span style={{ color: C.teal, fontSize: 13, fontWeight: 600 }}>운동 기록 추가</span>
                </button>
                <button onClick={() => setTab('sleep')}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: `${C.violet}10`, border: `1px solid ${C.violet}30`, borderRadius: 10, cursor: 'pointer', fontFamily: font }}>
                  <Moon size={14} color={C.violet} />
                  <span style={{ color: C.violet, fontSize: 13, fontWeight: 600 }}>수면 기록 추가</span>
                </button>
              </div>
            </div>
          )}

          {tab === 'workout' && (
            <>
              {/* Type quick-select */}
              <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '14px 16px' }}>
                <p style={{ color: C.t1, fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 10 }}>운동 종류</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {WORKOUT_TYPES.map((t) => (
                    <button key={t} onClick={() => setWorkoutType(t)}
                      style={{
                        padding: '5px 10px', borderRadius: 16, fontSize: 11.5, cursor: 'pointer', fontFamily: font,
                        background: workoutType === t ? `${C.teal}20` : C.bg1,
                        border: `1px solid ${workoutType === t ? C.teal : C.b1}`,
                        color: workoutType === t ? C.teal : C.t1,
                      }}
                    >{TYPE_EMOJI[t]} {t}</button>
                  ))}
                </div>
              </div>

              <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '14px 16px' }}>
                <p style={{ color: C.teal, fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 12 }}>운동 기록</p>
                {WorkoutForm}
              </div>
            </>
          )}

          {tab === 'sleep' && (
            <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ color: C.violet, fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 12 }}>수면 기록</p>
              {SleepForm}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
