import { useEffect, useState } from 'react';
import { Plus, Trash2, Flame, Clock, Activity } from 'lucide-react';
import { useHealthStore } from '../../shared/stores/health.store';

const C = {
  bg1: '#090D1F', bg2: '#0D1228',
  b0: 'rgba(255,255,255,0.04)', b1: 'rgba(255,255,255,0.08)',
  t0: '#DDE5F5', t1: '#556070', t2: '#253040',
  blue: '#3B8EF0', teal: '#00CCA0', amber: '#EFA020', rose: '#F05472', sky: '#58AEFF',
};
const font = '"Space Grotesk", system-ui, sans-serif';
const mono = '"JetBrains Mono", "Fira Code", monospace';

const WORKOUT_TYPES = ['달리기', '걷기', '자전거', '수영', '요가', '필라테스', '웨이트', 'HIIT', '기타'];
const TYPE_EMOJI: Record<string, string> = {
  달리기: '🏃', 걷기: '🚶', 자전거: '🚴', 수영: '🏊', 요가: '🧘',
  필라테스: '🤸', 웨이트: '🏋️', HIIT: '⚡', 기타: '💪',
};

function getThisWeekStart(): string {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

export function HealthView() {
  const { items, loading, fetch, add, remove } = useHealthStore();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState('달리기');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => { fetch(); }, [fetch]);

  const weekStart = getThisWeekStart();
  const weekItems = items.filter((w) => w.date >= weekStart);
  const totalMinutes = weekItems.reduce((s, w) => s + w.duration, 0);
  const totalCalories = weekItems.reduce((s, w) => s + (w.calories ?? 0), 0);

  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const d = parseInt(duration);
    if (!d || d <= 0) return;
    await add({
      type,
      duration: d,
      calories: calories ? parseInt(calories) : undefined,
      date,
      notes: notes || undefined,
    });
    setDuration(''); setCalories(''); setNotes(''); setShowForm(false);
  };

  const statCard = (label: string, value: string | number, unit: string, Icon: React.ComponentType<{ size?: number; color?: string }>, color: string) => (
    <div style={{ flex: 1, background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Icon size={14} color={color} />
        <span style={{ color: C.t1, fontSize: 12 }}>{label}</span>
      </div>
      <p style={{ fontFamily: mono }}>
        <span style={{ color, fontSize: 22, fontWeight: 700 }}>{value}</span>
        <span style={{ color: C.t1, fontSize: 12, marginLeft: 4 }}>{unit}</span>
      </p>
    </div>
  );

  return (
    <div style={{ padding: '26px 28px', fontFamily: font }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ color: C.t0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>건강</h1>
        <p style={{ color: C.t1, fontSize: 12.5, marginTop: 4 }}>
          {loading ? '불러오는 중...' : `이번 주 ${weekItems.length}회 운동`}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {statCard('이번 주 운동', weekItems.length, '회', Activity, C.teal)}
        {statCard('총 운동 시간', totalMinutes, '분', Clock, C.blue)}
        {statCard('소모 칼로리', totalCalories, 'kcal', Flame, C.amber)}
      </div>

      {/* Workout type quick chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
        {WORKOUT_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => { setType(t); setShowForm(true); }}
            style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
              background: type === t && showForm ? `${C.teal}20` : C.bg2,
              border: `1px solid ${type === t && showForm ? C.teal : C.b1}`,
              color: type === t && showForm ? C.teal : C.t1,
              fontFamily: font,
            }}
          >
            {TYPE_EMOJI[t]} {t}
          </button>
        ))}
      </div>

      {/* Workout list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {sorted.map((w) => (
          <div key={w.id} style={{
            background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10,
            padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: `${C.teal}14`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>
              {TYPE_EMOJI[w.type] ?? '💪'}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: C.t0, fontSize: 13.5 }}>{w.type}</p>
              <p style={{ color: C.t1, fontSize: 11, marginTop: 2 }}>
                {w.date}
                {w.notes && ` · ${w.notes}`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ color: C.blue, fontSize: 12, fontFamily: mono, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Clock size={10} />{w.duration}분
              </span>
              {w.calories && (
                <span style={{ color: C.amber, fontSize: 12, fontFamily: mono, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Flame size={10} />{w.calories}kcal
                </span>
              )}
            </div>
            <button onClick={() => remove(w.id)} style={{ color: C.t2, cursor: 'pointer', display: 'flex' }}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {items.length === 0 && !loading && (
          <p style={{ color: C.t2, fontSize: 13, padding: '20px 0' }}>운동 기록이 없습니다.</p>
        )}
      </div>

      {/* Add form */}
      {showForm ? (
        <form
          onSubmit={handleAdd}
          style={{
            background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10,
            padding: '16px', display: 'flex', flexDirection: 'column', gap: 10,
          }}
        >
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, cursor: 'pointer' }}
          >
            {WORKOUT_TYPES.map((t) => <option key={t} value={t}>{TYPE_EMOJI[t]} {t}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={duration} onChange={(e) => setDuration(e.target.value)}
              placeholder="운동 시간 (분)" inputMode="numeric"
              style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: mono, outline: 'none' }}
            />
            <input
              value={calories} onChange={(e) => setCalories(e.target.value)}
              placeholder="칼로리 (선택)" inputMode="numeric"
              style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: mono, outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="date" value={date} onChange={(e) => setDate(e.target.value)}
              style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, colorScheme: 'dark' }}
            />
            <input
              value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="메모 (선택)"
              style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={{ flex: 1, padding: '9px', background: C.teal, color: '#06091A', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: font, cursor: 'pointer' }}>
              기록 추가
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 16px', background: C.bg1, border: `1px solid ${C.b1}`, color: C.t1, borderRadius: 8, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>
              취소
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer', padding: '8px 0' }}
        >
          <Plus size={14} />운동 기록 추가
        </button>
      )}
    </div>
  );
}
