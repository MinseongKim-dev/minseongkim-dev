import { useEffect, useState } from 'react';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { useTasksStore, type Priority } from '../../shared/stores/tasks.store';

const C = {
  bg1: '#090D1F', bg2: '#0D1228',
  b0: 'rgba(255,255,255,0.04)', b1: 'rgba(255,255,255,0.08)',
  t0: '#DDE5F5', t1: '#556070', t2: '#253040',
  blue: '#3B8EF0', teal: '#00CCA0', amber: '#EFA020', rose: '#F05472', sky: '#58AEFF',
};
const font = '"Space Grotesk", system-ui, sans-serif';
const mono = '"JetBrains Mono", "Fira Code", monospace';

const PRIORITY_COLOR: Record<Priority, string> = {
  urgent: C.rose, high: C.amber, medium: C.sky, low: C.teal,
};
const PRIORITY_LABEL: Record<Priority, string> = {
  urgent: '긴급', high: '높음', medium: '보통', low: '낮음',
};

const inputStyle = {
  background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8,
  padding: '9px 12px', color: C.t0, fontSize: 13.5, fontFamily: font,
  outline: 'none', width: '100%', boxSizing: 'border-box' as const,
};

export function TasksView() {
  const { items, loading, fetch, add, toggle, remove } = useTasksStore();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [due, setDue] = useState('');

  useEffect(() => { fetch(); }, [fetch]);

  const done = items.filter((t) => t.done).length;
  const urgent = items.filter((t) => !t.done && t.priority === 'urgent').length;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await add({ title: title.trim(), priority, due: due || undefined });
    setTitle(''); setDue(''); setPriority('medium'); setShowForm(false);
  };

  return (
    <div style={{ padding: '26px 28px', fontFamily: font }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ color: C.t0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>할 일</h1>
        <p style={{ color: C.t1, fontSize: 12.5, marginTop: 4 }}>
          {loading
            ? '불러오는 중...'
            : `${items.length}개 중 ${done}개 완료${urgent ? ` · 긴급 ${urgent}개` : ''}`}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((task) => (
          <div key={task.id} style={{
            background: task.done ? C.bg1 : C.bg2,
            border: `1px solid ${task.done ? C.b0 : C.b1}`,
            borderRadius: 10, padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.14s',
          }}>
            <button
              onClick={() => toggle(task.id, !task.done)}
              style={{ display: 'flex', cursor: 'pointer', flexShrink: 0 }}
            >
              <CheckCircle2
                size={16}
                color={task.done ? C.teal : C.t2}
                style={{ filter: task.done ? `drop-shadow(0 0 4px ${C.teal}80)` : 'none' }}
              />
            </button>
            <span style={{
              flex: 1, color: task.done ? C.t1 : C.t0, fontSize: 13.5,
              textDecoration: task.done ? 'line-through' : 'none',
            }}>{task.title}</span>
            {task.due && (
              <span style={{ fontSize: 10, fontFamily: mono, color: task.done ? C.t2 : C.t1, flexShrink: 0 }}>
                {task.due}
              </span>
            )}
            <span style={{
              fontSize: 10, fontWeight: 600, flexShrink: 0,
              color: PRIORITY_COLOR[task.priority],
              background: `${PRIORITY_COLOR[task.priority]}18`,
              borderRadius: 5, padding: '2px 8px',
            }}>{PRIORITY_LABEL[task.priority]}</span>
            <button
              onClick={() => remove(task.id)}
              style={{ color: C.t2, cursor: 'pointer', display: 'flex', flexShrink: 0 }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}

        {items.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: C.t2, fontSize: 13 }}>
            할 일이 없어요. 새 항목을 추가해보세요.
          </div>
        )}
      </div>

      {showForm ? (
        <form
          onSubmit={handleAdd}
          style={{
            marginTop: 14, background: C.bg2, border: `1px solid ${C.b1}`,
            borderRadius: 10, padding: '16px',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}
        >
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="할 일 제목"
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              style={{
                flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8,
                padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, cursor: 'pointer',
              }}
            >
              {(['urgent', 'high', 'medium', 'low'] as Priority[]).map((p) => (
                <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
              ))}
            </select>
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              style={{
                flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8,
                padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font,
                colorScheme: 'dark',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="submit"
              style={{
                flex: 1, padding: '9px', background: C.blue, color: '#fff',
                borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: font, cursor: 'pointer',
              }}
            >추가</button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                padding: '9px 16px', background: C.bg1, border: `1px solid ${C.b1}`,
                color: C.t1, borderRadius: 8, fontSize: 13, fontFamily: font, cursor: 'pointer',
              }}
            >취소</button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          style={{
            marginTop: 14, display: 'flex', alignItems: 'center', gap: 7,
            color: C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer', padding: '8px 0',
          }}
        >
          <Plus size={14} />새 할 일 추가
        </button>
      )}
    </div>
  );
}
