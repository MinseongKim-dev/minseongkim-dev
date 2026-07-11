import { useEffect, useRef, useState, useMemo } from 'react';
import { Zap, Hash, Calendar, CheckSquare, X, Search, ArrowRight } from 'lucide-react';
import { useTasksStore } from '../stores/tasks.store';
import { useEventsStore } from '../stores/events.store';
import { useToastStore } from '../stores/toast.store';
import { useFinanceStore } from '../stores/finance.store';
import { useHealthStore } from '../stores/health.store';
import { useRelationshipsStore } from '../stores/relationships.store';
import { useLearningStore } from '../stores/learning.store';
import { useAppStore, type ViewId } from '../stores/app.store';

const C = {
  bg0: '#06091A', bg1: '#090D1F', bg2: '#0D1228',
  b0: 'rgba(255,255,255,0.04)', b1: 'rgba(255,255,255,0.08)', b2: 'rgba(255,255,255,0.24)',
  t0: '#DDE5F5', t1: '#556070',
  blue: '#3B8EF0', violet: '#7C5CF0', teal: '#00CCA0', amber: '#EFA020',
  rose: '#F05472', sky: '#58AEFF',
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

interface SearchResult {
  id: string;
  label: string;
  sub?: string;
  view: ViewId;
  color: string;
  type: string;
}

function useSearch(query: string): SearchResult[] {
  const tasks = useTasksStore((s) => s.items);
  const events = useEventsStore((s) => s.items);
  const transactions = useFinanceStore((s) => s.items);
  const workouts = useHealthStore((s) => s.items);
  const contacts = useRelationshipsStore((s) => s.items);
  const books = useLearningStore((s) => s.books);

  return useMemo(() => {
    const lq = query.toLowerCase();
    if (!lq) return [];

    const match = (text: string) => text.toLowerCase().includes(lq);
    const results: SearchResult[] = [];

    tasks.forEach((t) => {
      if (match(t.title)) results.push({ id: `task-${t.id}`, label: t.title, sub: t.due ?? undefined, view: 'tasks', color: C.blue, type: '할 일' });
    });
    events.forEach((e) => {
      if (match(e.title)) results.push({ id: `event-${e.id}`, label: e.title, sub: e.date, view: 'schedule', color: C.violet, type: '일정' });
    });
    transactions.forEach((t) => {
      if (match(t.title) || match(t.category)) results.push({ id: `fin-${t.id}`, label: t.title, sub: `${t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}원`, view: 'finance', color: C.amber, type: '거래' });
    });
    workouts.forEach((w) => {
      if (match(w.type) || match(w.notes ?? '')) results.push({ id: `wk-${w.id}`, label: w.type, sub: w.date, view: 'health', color: C.teal, type: '운동' });
    });
    contacts.forEach((c) => {
      if (match(c.name)) results.push({ id: `rel-${c.id}`, label: c.name, sub: c.email ?? undefined, view: 'relations', color: C.rose, type: '연락처' });
    });
    books.forEach((b) => {
      if (match(b.title) || match(b.author ?? '')) results.push({ id: `bk-${b.id}`, label: b.title, sub: b.author ?? undefined, view: 'learning', color: C.sky, type: '책' });
    });

    return results.slice(0, 8);
  }, [query, tasks, events, transactions, workouts, contacts, books]);
}

export function QuickCapture() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const addTask = useTasksStore((s) => s.add);
  const addEvent = useEventsStore((s) => s.add);
  const addToast = useToastStore((s) => s.add);
  const setView = useAppStore((s) => s.setView);

  const isSearch = value.startsWith('/');
  const searchQuery = isSearch ? value.slice(1) : '';
  const searchResults = useSearch(searchQuery);

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
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [searchResults.length]);

  const mode = detectMode(value);
  const meta = MODE_META[mode];
  const rawText = value.replace(/^[!@#]\s*/, '').trim();

  const navigateTo = (view: ViewId) => {
    setView(view);
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (isSearch) {
      const hit = searchResults[selectedIdx];
      if (hit) navigateTo(hit.view);
      return;
    }
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
            background: isSearch ? `${C.sky}18` : `${meta.color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isSearch
              ? <Search size={13} color={C.sky} />
              : <meta.icon size={13} color={meta.color} />
            }
          </div>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (isSearch) {
                if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, searchResults.length - 1)); }
                if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
              }
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSubmit(); }
              if (e.key === 'Escape') setOpen(false);
            }}
            placeholder={isSearch ? '검색어를 입력하세요…' : '무엇을 추가할까요? (!할일  @일정  #메모  /검색)'}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: C.t0, fontSize: 15, fontFamily: font,
            }}
          />
          <button onClick={() => setOpen(false)} style={{ color: C.t1, cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
            <X size={15} />
          </button>
        </div>

        {/* Search results */}
        {isSearch && (
          <div style={{ borderTop: `1px solid ${C.b0}` }}>
            {searchQuery && searchResults.length === 0 && (
              <div style={{ padding: '16px', color: C.t1, fontSize: 13, textAlign: 'center', fontFamily: font }}>결과 없음</div>
            )}
            {searchResults.map((r, i) => (
              <button
                key={r.id}
                onClick={() => navigateTo(r.view)}
                onMouseEnter={() => setSelectedIdx(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '10px 16px', textAlign: 'left', fontFamily: font,
                  background: i === selectedIdx ? `${r.color}10` : 'transparent',
                  borderTop: `1px solid ${C.b0}`,
                }}
              >
                <span style={{
                  padding: '2px 7px', borderRadius: 5, fontSize: 10, fontFamily: mono,
                  background: `${r.color}18`, color: r.color, flexShrink: 0,
                }}>{r.type}</span>
                <span style={{ flex: 1, color: C.t0, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
                {r.sub && <span style={{ color: C.t1, fontSize: 11, flexShrink: 0 }}>{r.sub}</span>}
                {i === selectedIdx && <ArrowRight size={12} color={r.color} style={{ flexShrink: 0 }} />}
              </button>
            ))}
            {!searchQuery && (
              <div style={{ padding: '12px 16px', color: C.t1, fontSize: 12, fontFamily: font }}>
                모든 할 일, 일정, 거래, 연락처, 책을 검색합니다
              </div>
            )}
          </div>
        )}

        {/* Mode bar — capture mode only */}
        {!isSearch && (
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
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '3px 9px', borderRadius: 6,
                background: 'transparent', border: `1px solid ${C.b0}`,
              }}>
                <Search size={10} color={C.t1} />
                <span style={{ color: C.t1, fontSize: 11, fontFamily: mono }}>/ 로 검색</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: C.t1, fontSize: 11, fontFamily: mono }}>
                → <span style={{ color: meta.color }}>{meta.label}</span>
              </span>
              <button
                onClick={() => void handleSubmit()}
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
        )}
      </div>
    </div>
  );
}
