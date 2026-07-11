import { useEffect, useRef, useState } from 'react';
import { Zap, Hash, Calendar, CheckSquare, X } from 'lucide-react';
import { useTasksStore } from '../stores/tasks.store';
import { useEventsStore } from '../stores/events.store';
import { useToastStore } from '../stores/toast.store';

const C = {
  bg0: '#06091A', bg1: '#090D1F', bg2: '#0D1228',
  b0: 'rgba(255,255,255,0.04)', b1: 'rgba(255,255,255,0.08)', b2: 'rgba(255,255,255,0.24)',
  t0: '#DDE5F5', t1: '#556070',
  blue: '#3B8EF0', violet: '#7C5CF0', teal: '#00CCA0', amber: '#EFA020',
};
const font = '"Space Grotesk", system-ui, sans-serif';
const mono = '"JetBrains Mono", "Fira Code", monospace';

type Mode = 'task' | 'event' | 'note';

function detectMode(value: string): Mode {
  if (value.startsWith('@')) return 'event';
  if (value.startsWith('#')) return 'note';
  return 'task';
}

const MODE_META: Record<Mode, { color: string; icon: typeof CheckSquare; label: string; hint: string }> = {
  task:  { color: C.blue,   icon: CheckSquare, label: '할 일',   hint: '접두사 없음 또는 !' },
  event: { color: C.violet, icon: Calendar,    label: '오늘 일정', hint: '@ 로 시작' },
  note:  { color: C.amber,  icon: Hash,        label: '메모',     hint: '# 로 시작' },
};

export function QuickCapture() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const addTask = useTasksStore((s) => s.add);
  const addEvent = useEventsStore((s) => s.add);
  const addToast = useToastStore((s) => s.add);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setValue('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const mode = detectMode(value);
  const meta = MODE_META[mode];
  const rawText = value.replace(/^[!@#]\s*/, '').trim();

  const handleSubmit = async () => {
    if (!rawText) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      if (mode === 'task' || mode === 'note') {
        await addTask({
          title: rawText,
          priority: 'medium',
          ...(mode === 'note' ? { tags: ['메모'] } : {}),
        });
        addToast(`할 일 추가: ${rawText}`);
      } else if (mode === 'event') {
        await addEvent({ title: rawText, date: today });
        addToast(`일정 추가: ${rawText}`);
      }
      setOpen(false);
    } catch {
      addToast('저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(6,9,26,0.75)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '18vh',
      }}
      onClick={() => setOpen(false)}
    >
      <div
        style={{
          width: '100%', maxWidth: 560, margin: '0 16px',
          background: C.bg1, border: `1px solid ${C.b2}`,
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
            background: `${meta.color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <meta.icon size={13} color={meta.color} />
          </div>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
              if (e.key === 'Escape') setOpen(false);
            }}
            placeholder="무엇을 추가할까요? (!할일  @일정  #메모)"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: C.t0, fontSize: 15, fontFamily: font,
            }}
          />
          <button onClick={() => setOpen(false)} style={{ color: C.t1, cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
            <X size={15} />
          </button>
        </div>

        {/* Mode bar */}
        <div style={{
          borderTop: `1px solid ${C.b0}`, padding: '10px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['task', 'event', 'note'] as Mode[]).map((m) => {
              const mm = MODE_META[m];
              const active = mode === m;
              return (
                <div key={m} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '3px 9px', borderRadius: 6,
                  background: active ? `${mm.color}18` : 'transparent',
                  border: `1px solid ${active ? mm.color + '50' : C.b0}`,
                }}>
                  <mm.icon size={10} color={active ? mm.color : C.t1} />
                  <span style={{ color: active ? mm.color : C.t1, fontSize: 11, fontFamily: mono }}>{mm.hint}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: C.t1, fontSize: 11, fontFamily: mono }}>
              → <span style={{ color: meta.color }}>{meta.label}</span>
            </span>
            <button
              onClick={handleSubmit}
              disabled={!rawText || saving}
              style={{
                padding: '5px 14px', borderRadius: 8,
                background: rawText ? `${meta.color}20` : C.b0,
                border: `1px solid ${rawText ? meta.color + '50' : C.b1}`,
                color: rawText ? meta.color : C.t1,
                fontSize: 12, fontFamily: font, cursor: rawText ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Zap size={10} />
              {saving ? '저장 중…' : 'Enter ↵'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
