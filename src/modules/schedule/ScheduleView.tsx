import { useEffect, useState } from 'react';
import { Clock, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useEventsStore, type CalendarEvent } from '../../shared/stores/events.store';
import { useWindowSize } from '../../shared/hooks/useWindowSize';

const C = {
  bg1: '#090D1F', bg2: '#0D1228',
  b0: 'rgba(255,255,255,0.04)', b1: 'rgba(255,255,255,0.08)',
  t0: '#DDE5F5', t1: '#556070', t2: '#253040',
  blue: '#3B8EF0', violet: '#7C5CF0', teal: '#00CCA0', amber: '#EFA020', sky: '#58AEFF',
};
const font = '"Space Grotesk", system-ui, sans-serif';
const mono = '"JetBrains Mono", "Fira Code", monospace';

const CATEGORY_COLOR: Record<string, string> = {
  work: C.blue, personal: C.violet, health: C.teal, meeting: C.amber, study: C.sky, other: '#8899AA',
};
const CATEGORY_LABEL: Record<string, string> = {
  work: '업무', personal: '개인', health: '건강', meeting: '미팅', study: '학습', other: '기타',
};

const inputStyle = {
  background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8,
  padding: '9px 12px', color: C.t0, fontSize: 13.5, fontFamily: font,
  outline: 'none', width: '100%', boxSizing: 'border-box' as const,
};

const DAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

function getWeekDays(): string[] {
  const today = new Date();
  const mon = new Date(today);
  mon.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m ?? 0);
}

function detectConflicts(events: CalendarEvent[]): Set<string> {
  const conflictIds = new Set<string>();
  const withTime = events.filter((e) => e.time);
  for (let i = 0; i < withTime.length; i++) {
    for (let j = i + 1; j < withTime.length; j++) {
      const a = withTime[i];
      const b = withTime[j];
      const diff = Math.abs(timeToMinutes(a.time!) - timeToMinutes(b.time!));
      if (diff < 60) {
        conflictIds.add(a.id);
        conflictIds.add(b.id);
      }
    }
  }
  return conflictIds;
}

export function ScheduleView() {
  const { items, loading, fetch, add, remove } = useEventsStore();
  const { isMobile } = useWindowSize();
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState('');
  const [category, setCategory] = useState('work');

  useEffect(() => { fetch(); }, [fetch]);

  const weekDays = getWeekDays();
  const totalThisWeek = weekDays.reduce(
    (n, d) => n + items.filter((e) => e.date === d).length, 0,
  );
  const selectedEvents = items
    .filter((e) => e.date === selectedDate)
    .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));

  const conflictIds = detectConflicts(selectedEvents);
  const hasConflicts = conflictIds.size > 0;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await add({ title: title.trim(), date, time: time || undefined, category });
    setTitle(''); setTime('');
    if (isMobile) setShowForm(false);
  };

  const AddForm = (
    <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="일정 제목"
        style={inputStyle}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="date" value={date} onChange={(e) => setDate(e.target.value)}
          style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, colorScheme: 'dark' }}
        />
        <input
          type="time" value={time} onChange={(e) => setTime(e.target.value)}
          style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, colorScheme: 'dark' }}
        />
      </div>
      <select
        value={category} onChange={(e) => setCategory(e.target.value)}
        style={{ background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, cursor: 'pointer' }}
      >
        {Object.entries(CATEGORY_LABEL).map(([val, label]) => (
          <option key={val} value={val}>{label}</option>
        ))}
      </select>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" style={{ flex: 1, padding: '9px', background: C.blue, color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: font, cursor: 'pointer' }}>
          추가
        </button>
        {isMobile && (
          <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 16px', background: C.bg1, border: `1px solid ${C.b1}`, color: C.t1, borderRadius: 8, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>
            취소
          </button>
        )}
      </div>
    </form>
  );

  return (
    <div style={{ fontFamily: font, display: 'flex', gap: 20, alignItems: 'flex-start' }}>

      {/* ── Left: events for selected day ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: 14 }}>
          <h1 style={{ color: C.t0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>일정</h1>
          <p style={{ color: C.t1, fontSize: 12.5, marginTop: 3 }}>
            {loading ? '불러오는 중...' : `이번 주 ${totalThisWeek}개의 일정`}
          </p>
        </div>

        {/* Mobile: horizontal week strip */}
        {isMobile && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {weekDays.map((d) => {
              const jsDate = new Date(d + 'T12:00:00');
              const isToday = d === todayStr;
              const isSelected = d === selectedDate;
              const count = items.filter((e) => e.date === d).length;
              const dayConflicts = detectConflicts(items.filter((e) => e.date === d));
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  style={{
                    flex: 1, padding: '10px 4px', borderRadius: 10, cursor: 'pointer',
                    background: isSelected ? `${C.blue}20` : C.bg2,
                    border: `1px solid ${isSelected ? C.blue : isToday ? `${C.blue}40` : C.b1}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative',
                  }}
                >
                  {dayConflicts.size > 0 && (
                    <div style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: '50%', background: C.amber }} />
                  )}
                  <span style={{ fontSize: 10, color: isSelected ? C.blue : C.t1 }}>{DAY_KO[jsDate.getDay()]}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: isSelected ? C.blue : isToday ? C.t0 : C.t1 }}>{jsDate.getDate()}</span>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: count > 0 ? (isSelected ? C.blue : C.t1) : 'transparent' }} />
                </button>
              );
            })}
          </div>
        )}

        {/* Events for selected date */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: C.t1, fontSize: 11.5, marginBottom: 10, fontFamily: mono }}>
            {selectedDate === todayStr ? '오늘 · ' : ''}{selectedDate}
          </p>

          {hasConflicts && (
            <div style={{
              background: `${C.amber}12`, border: `1px solid ${C.amber}30`,
              borderRadius: 8, padding: '10px 14px', marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <AlertTriangle size={13} color={C.amber} />
              <p style={{ color: C.amber, fontSize: 12 }}>시간이 겹치는 일정이 있습니다. 일정을 확인해보세요.</p>
            </div>
          )}

          {selectedEvents.length === 0 ? (
            <p style={{ color: C.t2, fontSize: 13, padding: '20px 0' }}>일정이 없습니다.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedEvents.map((ev) => {
                const col = CATEGORY_COLOR[ev.category ?? 'other'] ?? CATEGORY_COLOR.other;
                const isConflict = conflictIds.has(ev.id);
                return (
                  <div key={ev.id} style={{
                    background: C.bg2,
                    border: `1px solid ${isConflict ? C.amber + '50' : C.b1}`,
                    borderRadius: 10, padding: '12px 16px',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{ width: 3, minHeight: 32, borderRadius: 2, background: col, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <p style={{ color: C.t0, fontSize: 13.5 }}>{ev.title}</p>
                        {isConflict && <AlertTriangle size={11} color={C.amber} />}
                      </div>
                      {ev.time && (
                        <p style={{ color: C.t1, fontSize: 11.5, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={10} />{ev.time}
                        </p>
                      )}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: col, background: `${col}18`, borderRadius: 5, padding: '2px 8px' }}>
                      {CATEGORY_LABEL[ev.category ?? 'other'] ?? ev.category}
                    </span>
                    <button onClick={() => remove(ev.id)} style={{ color: C.t2, cursor: 'pointer', display: 'flex' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile add form / button */}
        {isMobile && (
          showForm ? AddForm : (
            <button
              onClick={() => { setDate(selectedDate); setShowForm(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer', padding: '8px 0' }}
            >
              <Plus size={14} />새 일정 추가
            </button>
          )
        )}
      </div>

      {/* ── Right panel: week strip + add form (desktop only) ── */}
      {!isMobile && (
        <div style={{ width: 264, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Vertical week strip */}
          <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '12px' }}>
            <p style={{ color: C.t1, fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 10 }}>이번 주</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {weekDays.map((d) => {
                const jsDate = new Date(d + 'T12:00:00');
                const isToday = d === todayStr;
                const isSelected = d === selectedDate;
                const count = items.filter((e) => e.date === d).length;
                const dayConflicts = detectConflicts(items.filter((e) => e.date === d));
                return (
                  <button
                    key={d}
                    onClick={() => { setSelectedDate(d); setDate(d); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                      background: isSelected ? `${C.blue}18` : 'transparent',
                      border: `1px solid ${isSelected ? C.blue + '50' : 'transparent'}`,
                    }}
                  >
                    <span style={{ fontSize: 11, color: isSelected ? C.blue : C.t1, width: 14 }}>{DAY_KO[jsDate.getDay()]}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: isSelected ? C.blue : isToday ? C.t0 : C.t1, width: 22 }}>{jsDate.getDate()}</span>
                    <div style={{ flex: 1, display: 'flex', gap: 3, alignItems: 'center' }}>
                      {Array.from({ length: Math.min(count, 4) }, (_, i) => (
                        <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? C.blue : C.t2 }} />
                      ))}
                    </div>
                    {dayConflicts.size > 0 && (
                      <AlertTriangle size={10} color={C.amber} />
                    )}
                    {count > 0 && (
                      <span style={{ fontSize: 10, color: isSelected ? C.blue : C.t2, fontFamily: mono }}>{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add event form (desktop always-visible) */}
          <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ color: C.t1, fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 12 }}>새 일정</p>
            {AddForm}
          </div>
        </div>
      )}
    </div>
  );
}
