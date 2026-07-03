import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

const C = {
  bg1: '#090D1F', bg2: '#0D1228',
  b0: 'rgba(255,255,255,0.04)', b1: 'rgba(255,255,255,0.08)',
  t0: '#DDE5F5', t1: '#556070', t2: '#253040',
  teal: '#00CCA0', amber: '#EFA020', rose: '#F05472', sky: '#58AEFF',
};
const font = '"Space Grotesk", system-ui, sans-serif';
const mono = '"JetBrains Mono", "Fira Code", monospace';

type Tag = 'urgent' | 'high' | 'medium' | 'low';

const TAG_COLOR: Record<Tag, string> = {
  urgent: C.rose, high: C.amber, medium: C.sky, low: C.teal,
};

interface Task {
  title: string;
  tag: Tag;
  due: string;
  done: boolean;
}

const INITIAL_TASKS: Task[] = [
  { title: '기획서 초안 작성',    tag: 'urgent', due: '내일',       done: false },
  { title: 'API 명세 리뷰',       tag: 'high',   due: '이번 주',    done: false },
  { title: '디자인 리뷰 참석',    tag: 'medium', due: '오늘 14:00', done: true  },
  { title: '주간 회고 작성',      tag: 'low',    due: '이번 주',    done: false },
  { title: '배포 파이프라인 점검', tag: 'high',   due: '오늘',       done: false },
];

export function TasksView() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  const toggle = (i: number) =>
    setTasks((t) => t.map((task, idx) => (idx === i ? { ...task, done: !task.done } : task)));

  return (
    <div style={{ padding: '26px 28px', maxWidth: 700, fontFamily: font }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ color: C.t0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>할 일</h1>
        <p style={{ color: C.t1, fontSize: 12.5, marginTop: 4 }}>12개 중 5개 완료 · 마감 임박 2개</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tasks.map((task, i) => (
          <div
            key={i}
            onClick={() => toggle(i)}
            style={{
              background: task.done ? C.bg1 : C.bg2,
              border: `1px solid ${task.done ? C.b0 : C.b1}`,
              borderRadius: 10, padding: '12px 16px', cursor: 'pointer', transition: 'all 0.14s',
              display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            <CheckCircle2
              size={16}
              color={task.done ? C.teal : C.t2}
              style={{ filter: task.done ? `drop-shadow(0 0 4px ${C.teal}80)` : 'none' }}
            />
            <span style={{
              flex: 1, color: task.done ? C.t1 : C.t0, fontSize: 13.5,
              textDecoration: task.done ? 'line-through' : 'none',
            }}>{task.title}</span>
            <span style={{ fontSize: 10, fontFamily: mono, color: task.done ? C.t2 : C.t1 }}>{task.due}</span>
            <span style={{
              fontSize: 10, fontWeight: 600, color: TAG_COLOR[task.tag],
              background: `${TAG_COLOR[task.tag]}18`, borderRadius: 5, padding: '2px 8px',
            }}>{task.tag}</span>
          </div>
        ))}
      </div>
      <button style={{
        marginTop: 14, display: 'flex', alignItems: 'center', gap: 7,
        color: C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer', padding: '8px 0',
      }}>
        + 새 할 일 추가
      </button>
    </div>
  );
}
