import { useEffect, useState } from 'react';
import { Plus, Trash2, BookOpen, Target } from 'lucide-react';
import { useLearningStore, type BookStatus } from '../../shared/stores/learning.store';

const C = {
  bg1: '#090D1F', bg2: '#0D1228', bg3: '#131B32',
  b0: 'rgba(255,255,255,0.04)', b1: 'rgba(255,255,255,0.08)',
  t0: '#DDE5F5', t1: '#556070', t2: '#253040',
  blue: '#3B8EF0', violet: '#7C5CF0', teal: '#00CCA0', amber: '#EFA020', sky: '#58AEFF',
};
const font = '"Space Grotesk", system-ui, sans-serif';
const mono = '"JetBrains Mono", "Fira Code", monospace';

const GOAL_CATEGORIES = ['프로그래밍', '언어', '디자인', '비즈니스', '수학/과학', '예술', '기타'];
const BOOK_STATUSES: { value: BookStatus; label: string; color: string }[] = [
  { value: 'reading', label: '읽는 중', color: C.blue },
  { value: 'completed', label: '완독', color: C.teal },
  { value: 'wishlist', label: '읽을 책', color: C.amber },
];

const inputStyle = {
  background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8,
  padding: '9px 12px', color: C.t0, fontSize: 13.5, fontFamily: font,
  outline: 'none', width: '100%', boxSizing: 'border-box' as const,
};

export function LearningView() {
  const { goals, books, loading, fetch, addGoal, updateGoal, removeGoal, addBook, removeBook } = useLearningStore();
  const [tab, setTab] = useState<'goals' | 'books'>('goals');
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showBookForm, setShowBookForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState('프로그래밍');
  const [goalTarget, setGoalTarget] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookStatus, setBookStatus] = useState<BookStatus>('reading');

  useEffect(() => { fetch(); }, [fetch]);

  const reading = books.filter((b) => b.status === 'reading').length;
  const completed = books.filter((b) => b.status === 'completed').length;

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    await addGoal({ title: goalTitle.trim(), category: goalCategory, progress: 0, targetDate: goalTarget || undefined });
    setGoalTitle(''); setGoalTarget(''); setShowGoalForm(false);
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim()) return;
    await addBook({ title: bookTitle.trim(), author: bookAuthor || undefined, status: bookStatus });
    setBookTitle(''); setBookAuthor(''); setShowBookForm(false);
  };

  const tabBtn = (id: 'goals' | 'books', label: string) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: '7px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
        fontFamily: font, cursor: 'pointer',
        background: tab === id ? `${C.sky}18` : 'transparent',
        border: `1px solid ${tab === id ? C.sky : C.b1}`,
        color: tab === id ? C.sky : C.t1,
      }}
    >{label}</button>
  );

  return (
    <div style={{ padding: '26px 28px', fontFamily: font }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ color: C.t0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>학습</h1>
        <p style={{ color: C.t1, fontSize: 12.5, marginTop: 4 }}>
          {loading ? '불러오는 중...' : `목표 ${goals.length}개 · 독서 중 ${reading}권 · 완독 ${completed}권`}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {tabBtn('goals', '학습 목표')}
        {tabBtn('books', '독서')}
      </div>

      {/* Goals tab */}
      {tab === 'goals' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            {goals.map((g) => (
              <div key={g.id} style={{
                background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10,
                padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                  <Target size={14} color={C.sky} style={{ marginTop: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ color: C.t0, fontSize: 13.5 }}>{g.title}</p>
                    <p style={{ color: C.t1, fontSize: 11, marginTop: 2 }}>
                      {g.category}{g.targetDate ? ` · 목표일: ${g.targetDate}` : ''}
                    </p>
                  </div>
                  <span style={{ color: C.sky, fontSize: 12, fontFamily: mono, fontWeight: 700 }}>
                    {g.progress}%
                  </span>
                  <button onClick={() => removeGoal(g.id)} style={{ color: C.t2, cursor: 'pointer', display: 'flex' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
                {/* Progress bar */}
                <div style={{ height: 4, background: C.bg3, borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${g.progress}%`, background: C.sky, borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
                {/* Progress slider */}
                <input
                  type="range" min={0} max={100} value={g.progress}
                  onChange={(e) => updateGoal(g.id, { progress: parseInt(e.target.value) })}
                  style={{ width: '100%', marginTop: 8, accentColor: C.sky, cursor: 'pointer' }}
                />
              </div>
            ))}
            {goals.length === 0 && !loading && (
              <p style={{ color: C.t2, fontSize: 13, padding: '20px 0' }}>학습 목표가 없습니다.</p>
            )}
          </div>

          {showGoalForm ? (
            <form onSubmit={handleAddGoal} style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input autoFocus value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="학습 목표 제목" style={inputStyle} />
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={goalCategory} onChange={(e) => setGoalCategory(e.target.value)} style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>
                  {GOAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="date" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, colorScheme: 'dark' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={{ flex: 1, padding: '9px', background: C.sky, color: '#06091A', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: font, cursor: 'pointer' }}>추가</button>
                <button type="button" onClick={() => setShowGoalForm(false)} style={{ padding: '9px 16px', background: C.bg1, border: `1px solid ${C.b1}`, color: C.t1, borderRadius: 8, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>취소</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowGoalForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer', padding: '8px 0' }}>
              <Plus size={14} />새 학습 목표 추가
            </button>
          )}
        </>
      )}

      {/* Books tab */}
      {tab === 'books' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {books.map((b) => {
              const st = BOOK_STATUSES.find((s) => s.value === b.status) ?? BOOK_STATUSES[0];
              return (
                <div key={b.id} style={{
                  background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10,
                  padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: `${st.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BookOpen size={15} color={st.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: C.t0, fontSize: 13.5 }}>{b.title}</p>
                    {b.author && <p style={{ color: C.t1, fontSize: 11.5, marginTop: 2 }}>{b.author}</p>}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: st.color, background: `${st.color}18`, borderRadius: 5, padding: '2px 8px' }}>
                    {st.label}
                  </span>
                  <button onClick={() => removeBook(b.id)} style={{ color: C.t2, cursor: 'pointer', display: 'flex' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
            {books.length === 0 && !loading && (
              <p style={{ color: C.t2, fontSize: 13, padding: '20px 0' }}>독서 목록이 없습니다.</p>
            )}
          </div>

          {showBookForm ? (
            <form onSubmit={handleAddBook} style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input autoFocus value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} placeholder="책 제목" style={inputStyle} />
              <input value={bookAuthor} onChange={(e) => setBookAuthor(e.target.value)} placeholder="저자 (선택)" style={inputStyle} />
              <select value={bookStatus} onChange={(e) => setBookStatus(e.target.value as BookStatus)} style={{ background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>
                {BOOK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={{ flex: 1, padding: '9px', background: C.blue, color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: font, cursor: 'pointer' }}>추가</button>
                <button type="button" onClick={() => setShowBookForm(false)} style={{ padding: '9px 16px', background: C.bg1, border: `1px solid ${C.b1}`, color: C.t1, borderRadius: 8, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>취소</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowBookForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer', padding: '8px 0' }}>
              <Plus size={14} />책 추가
            </button>
          )}
        </>
      )}
    </div>
  );
}
