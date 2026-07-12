import { useEffect, useState } from 'react';
import { Plus, Trash2, BookOpen, Target, Clock, Layers, RotateCcw } from 'lucide-react';
import { useLearningStore, type BookStatus } from '../../shared/stores/learning.store';
import { useWindowSize } from '../../shared/hooks/useWindowSize';

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

const selectStyle = {
  background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8,
  padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, cursor: 'pointer',
  width: '100%', boxSizing: 'border-box' as const,
};

function fmtMins(mins: number): string {
  if (mins === 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const QUALITY_BUTTONS: { label: string; quality: number; color: string }[] = [
  { label: '다시', quality: 1, color: '#F05472' },
  { label: '어려움', quality: 3, color: '#EFA020' },
  { label: '잘 알아요', quality: 4, color: '#58AEFF' },
  { label: '완벽', quality: 5, color: '#00CCA0' },
];

export function LearningView() {
  const { goals, books, studyLogs, flashcards, loading, fetch, addGoal, updateGoal, removeGoal, addBook, removeBook, addStudyLog, removeStudyLog, addFlashcard, reviewFlashcard, removeFlashcard } = useLearningStore();
  const { isMobile } = useWindowSize();
  const [tab, setTab] = useState<'goals' | 'books' | 'study' | 'flashcard'>('goals');

  // Flashcard state
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  const [cardCategory, setCardCategory] = useState('');
  const [showCardForm, setShowCardForm] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [studyIndex, setStudyIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  // Goal form
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState('프로그래밍');
  const [goalTarget, setGoalTarget] = useState('');

  // Book form
  const [showBookForm, setShowBookForm] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookStatus, setBookStatus] = useState<BookStatus>('reading');

  // Study log form
  const [showStudyForm, setShowStudyForm] = useState(false);
  const [studySubject, setStudySubject] = useState('');
  const [studyDuration, setStudyDuration] = useState('');
  const [studyDate, setStudyDate] = useState(new Date().toISOString().split('T')[0]);
  const [studyNotes, setStudyNotes] = useState('');

  useEffect(() => { fetch(); }, [fetch]);

  const reading = books.filter((b) => b.status === 'reading').length;
  const completed = books.filter((b) => b.status === 'completed').length;
  const wishlist = books.filter((b) => b.status === 'wishlist').length;
  const avgProgress = goals.length > 0 ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const weekAgoStr = (() => { const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().split('T')[0]; })();
  const weekMinutes = studyLogs.filter((l) => l.date >= weekAgoStr).reduce((s, l) => s + l.duration, 0);
  const todayMinutes = studyLogs.filter((l) => l.date === todayStr).reduce((s, l) => s + l.duration, 0);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    await addGoal({ title: goalTitle.trim(), category: goalCategory, progress: 0, targetDate: goalTarget || undefined });
    setGoalTitle(''); setGoalTarget('');
    if (isMobile) setShowGoalForm(false);
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim()) return;
    await addBook({ title: bookTitle.trim(), author: bookAuthor || undefined, status: bookStatus });
    setBookTitle(''); setBookAuthor('');
    if (isMobile) setShowBookForm(false);
  };

  const handleAddStudyLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(studyDuration, 10);
    if (!studySubject.trim() || isNaN(mins) || mins <= 0) return;
    await addStudyLog({ subject: studySubject.trim(), duration: mins, date: studyDate, notes: studyNotes || undefined });
    setStudySubject(''); setStudyDuration(''); setStudyNotes('');
    if (isMobile) setShowStudyForm(false);
  };

  const todayForCards = new Date().toISOString().split('T')[0];
  const dueCards = flashcards.filter((c) => c.nextReview <= todayForCards);
  const masteredCards = flashcards.filter((c) => c.interval > 21);
  const studyQueue = [...dueCards];
  const activeStudyCard = studyQueue[studyIndex] ?? null;

  const handleAddFlashcard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardFront.trim() || !cardBack.trim()) return;
    await addFlashcard({ front: cardFront.trim(), back: cardBack.trim(), category: cardCategory || undefined });
    setCardFront(''); setCardBack(''); setCardCategory('');
    if (isMobile) setShowCardForm(false);
  };

  const handleReview = async (quality: number) => {
    if (!activeStudyCard) return;
    await reviewFlashcard(activeStudyCard.id, quality);
    setRevealed(false);
    if (studyIndex + 1 >= studyQueue.length) {
      setStudyMode(false);
      setStudyIndex(0);
    } else {
      setStudyIndex((i) => i + 1);
    }
  };

  const FlashcardForm = (
    <form onSubmit={handleAddFlashcard} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <textarea value={cardFront} onChange={(e) => setCardFront(e.target.value)} placeholder="앞면 (질문)" rows={2}
        style={{ ...inputStyle, resize: 'vertical', minHeight: 56 }} />
      <textarea value={cardBack} onChange={(e) => setCardBack(e.target.value)} placeholder="뒷면 (정답)" rows={2}
        style={{ ...inputStyle, resize: 'vertical', minHeight: 56 }} />
      <input value={cardCategory} onChange={(e) => setCardCategory(e.target.value)} placeholder="카테고리 (선택)" style={inputStyle} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" style={{ flex: 1, padding: '9px', background: C.violet, color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: font, cursor: 'pointer' }}>추가</button>
        {isMobile && (
          <button type="button" onClick={() => setShowCardForm(false)} style={{ padding: '9px 16px', background: C.bg1, border: `1px solid ${C.b1}`, color: C.t1, borderRadius: 8, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>취소</button>
        )}
      </div>
    </form>
  );

  const GoalForm = (
    <form onSubmit={handleAddGoal} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="학습 목표 제목" style={inputStyle} />
      <div style={{ display: 'flex', gap: 8 }}>
        <select value={goalCategory} onChange={(e) => setGoalCategory(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
          {GOAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)}
          style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, colorScheme: 'dark' }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" style={{ flex: 1, padding: '9px', background: C.sky, color: '#06091A', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: font, cursor: 'pointer' }}>추가</button>
        {isMobile && (
          <button type="button" onClick={() => setShowGoalForm(false)} style={{ padding: '9px 16px', background: C.bg1, border: `1px solid ${C.b1}`, color: C.t1, borderRadius: 8, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>취소</button>
        )}
      </div>
    </form>
  );

  const BookForm = (
    <form onSubmit={handleAddBook} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} placeholder="책 제목" style={inputStyle} />
      <input value={bookAuthor} onChange={(e) => setBookAuthor(e.target.value)} placeholder="저자 (선택)" style={inputStyle} />
      <select value={bookStatus} onChange={(e) => setBookStatus(e.target.value as BookStatus)} style={selectStyle}>
        {BOOK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" style={{ flex: 1, padding: '9px', background: C.blue, color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: font, cursor: 'pointer' }}>추가</button>
        {isMobile && (
          <button type="button" onClick={() => setShowBookForm(false)} style={{ padding: '9px 16px', background: C.bg1, border: `1px solid ${C.b1}`, color: C.t1, borderRadius: 8, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>취소</button>
        )}
      </div>
    </form>
  );

  const StudyForm = (
    <form onSubmit={handleAddStudyLog} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input value={studySubject} onChange={(e) => setStudySubject(e.target.value)} placeholder="학습 주제 (예: React hooks)" style={inputStyle} />
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={studyDuration} onChange={(e) => setStudyDuration(e.target.value)} placeholder="시간 (분)" inputMode="numeric"
          style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: mono, outline: 'none' }} />
        <input type="date" value={studyDate} onChange={(e) => setStudyDate(e.target.value)}
          style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, colorScheme: 'dark' }} />
      </div>
      <input value={studyNotes} onChange={(e) => setStudyNotes(e.target.value)} placeholder="메모 (선택)" style={inputStyle} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" style={{ flex: 1, padding: '9px', background: C.teal, color: '#06091A', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: font, cursor: 'pointer' }}>기록 추가</button>
        {isMobile && (
          <button type="button" onClick={() => setShowStudyForm(false)} style={{ padding: '9px 16px', background: C.bg1, border: `1px solid ${C.b1}`, color: C.t1, borderRadius: 8, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>취소</button>
        )}
      </div>
    </form>
  );

  const TAB_COLORS: Record<string, string> = { goals: C.sky, books: C.blue, study: C.teal, flashcard: C.violet };

  const tabBtn = (id: 'goals' | 'books' | 'study' | 'flashcard', label: string) => {
    const color = TAB_COLORS[id];
    return (
      <button
        onClick={() => setTab(id)}
        style={{
          padding: '7px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          fontFamily: font, cursor: 'pointer',
          background: tab === id ? `${color}18` : 'transparent',
          border: `1px solid ${tab === id ? color : C.b1}`,
          color: tab === id ? color : C.t1,
        }}
      >{label}</button>
    );
  };

  const rightAccent = TAB_COLORS[tab] ?? C.sky;
  const rightLabel = tab === 'goals' ? '새 목표' : tab === 'books' ? '책 추가' : tab === 'study' ? '학습 기록' : '새 카드';

  return (
    <div style={{ fontFamily: font, display: 'flex', gap: 20, alignItems: 'flex-start' }}>

      {/* ── Left column ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: 14 }}>
          <h1 style={{ color: C.t0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>학습</h1>
          <p style={{ color: C.t1, fontSize: 12.5, marginTop: 3 }}>
            {loading ? '불러오는 중...' : `목표 ${goals.length}개 · 독서 중 ${reading}권 · 완독 ${completed}권`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {tabBtn('goals', '학습 목표')}
          {tabBtn('books', '독서')}
          {tabBtn('study', '학습 기록')}
          {tabBtn('flashcard', `플래시카드${dueCards.length > 0 ? ` (${dueCards.length})` : ''}`)}
        </div>

        {/* Goals tab */}
        {tab === 'goals' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              {goals.map((g) => (
                <div key={g.id} style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                    <Target size={14} color={C.sky} style={{ marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ color: C.t0, fontSize: 13.5 }}>{g.title}</p>
                      <p style={{ color: C.t1, fontSize: 11, marginTop: 2 }}>
                        {g.category}{g.targetDate ? ` · 목표일: ${g.targetDate}` : ''}
                      </p>
                    </div>
                    <span style={{ color: C.sky, fontSize: 12, fontFamily: mono, fontWeight: 700 }}>{g.progress}%</span>
                    <button onClick={() => removeGoal(g.id)} style={{ color: C.t2, cursor: 'pointer', display: 'flex' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div style={{ height: 4, background: C.bg3, borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${g.progress}%`, background: C.sky, borderRadius: 2, transition: 'width 0.3s' }} />
                  </div>
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
            {isMobile && (
              showGoalForm ? GoalForm : (
                <button onClick={() => setShowGoalForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer', padding: '8px 0' }}>
                  <Plus size={14} />새 학습 목표 추가
                </button>
              )
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
                  <div key={b.id} style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
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
            {isMobile && (
              showBookForm ? BookForm : (
                <button onClick={() => setShowBookForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer', padding: '8px 0' }}>
                  <Plus size={14} />책 추가
                </button>
              )
            )}
          </>
        )}

        {/* Study log tab */}
        {tab === 'study' && (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '14px 16px' }}>
                <p style={{ color: C.t1, fontSize: 11.5, marginBottom: 4 }}>오늘 학습</p>
                <p style={{ color: C.sky, fontSize: 18, fontWeight: 700, fontFamily: mono }}>{fmtMins(todayMinutes)}</p>
              </div>
              <div style={{ flex: 1, background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '14px 16px' }}>
                <p style={{ color: C.t1, fontSize: 11.5, marginBottom: 4 }}>이번 주 학습</p>
                <p style={{ color: C.teal, fontSize: 18, fontWeight: 700, fontFamily: mono }}>{fmtMins(weekMinutes)}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {[...studyLogs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20).map((log) => (
                <div key={log.id} style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.sky}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Clock size={14} color={C.sky} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: C.t0, fontSize: 13.5 }}>{log.subject}</p>
                    <p style={{ color: C.t1, fontSize: 11, marginTop: 2 }}>
                      {log.date}{log.notes && <span> · {log.notes}</span>}
                    </p>
                  </div>
                  <span style={{ color: C.sky, fontSize: 13, fontWeight: 700, fontFamily: mono, flexShrink: 0 }}>
                    {fmtMins(log.duration)}
                  </span>
                  <button onClick={() => removeStudyLog(log.id)} style={{ color: C.t2, cursor: 'pointer', display: 'flex' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {studyLogs.length === 0 && !loading && (
                <p style={{ color: C.t2, fontSize: 13, padding: '20px 0' }}>학습 기록이 없습니다. 오늘 공부한 내용을 기록해보세요.</p>
              )}
            </div>

            {isMobile && (
              showStudyForm ? StudyForm : (
                <button onClick={() => setShowStudyForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer', padding: '8px 0' }}>
                  <Plus size={14} />학습 기록 추가
                </button>
              )
            )}
          </>
        )}
        {/* Flashcard tab */}
        {tab === 'flashcard' && (
          <>
            {/* Study mode */}
            {studyMode && activeStudyCard ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ color: C.t1, fontSize: 12 }}>{studyIndex + 1} / {studyQueue.length}</span>
                  <button onClick={() => { setStudyMode(false); setStudyIndex(0); setRevealed(false); }}
                    style={{ marginLeft: 'auto', color: C.t1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    <RotateCcw size={11} />종료
                  </button>
                </div>

                {/* Card face */}
                <div
                  onClick={() => setRevealed(true)}
                  style={{
                    background: C.bg2, border: `1px solid ${revealed ? C.violet : C.b1}`,
                    borderRadius: 16, padding: '32px 24px', minHeight: 180,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: revealed ? 'default' : 'pointer', textAlign: 'center', gap: 16,
                    transition: 'border-color 0.2s',
                  }}
                >
                  {activeStudyCard.category && (
                    <span style={{ fontSize: 10, color: C.violet, background: `${C.violet}18`, borderRadius: 5, padding: '2px 8px' }}>
                      {activeStudyCard.category}
                    </span>
                  )}
                  <p style={{ color: C.t0, fontSize: 15, lineHeight: 1.5 }}>{activeStudyCard.front}</p>
                  {!revealed && (
                    <p style={{ color: C.t2, fontSize: 12 }}>클릭하여 정답 보기</p>
                  )}
                  {revealed && (
                    <>
                      <div style={{ width: '100%', height: 1, background: C.b1 }} />
                      <p style={{ color: C.teal, fontSize: 15, lineHeight: 1.5 }}>{activeStudyCard.back}</p>
                    </>
                  )}
                </div>

                {revealed && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {QUALITY_BUTTONS.map(({ label, quality, color }) => (
                      <button
                        key={label}
                        onClick={() => handleReview(quality)}
                        style={{
                          padding: '10px 4px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          fontFamily: font, cursor: 'pointer',
                          background: `${color}18`, border: `1px solid ${color}50`, color,
                        }}
                      >{label}</button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Summary row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                  {[
                    { label: '전체', value: flashcards.length, color: C.violet },
                    { label: '오늘 복습', value: dueCards.length, color: '#EFA020' },
                    { label: '마스터', value: masteredCards.length, color: C.teal },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                      <p style={{ color, fontSize: 20, fontWeight: 700, fontFamily: mono }}>{value}</p>
                      <p style={{ color: C.t1, fontSize: 11, marginTop: 2 }}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Start study button */}
                {dueCards.length > 0 && (
                  <button
                    onClick={() => { setStudyMode(true); setStudyIndex(0); setRevealed(false); }}
                    style={{
                      width: '100%', padding: '14px', borderRadius: 12, marginBottom: 16,
                      background: `linear-gradient(135deg, ${C.violet}, #9B7CF5)`,
                      color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: font, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    <Layers size={15} />
                    복습 시작 ({dueCards.length}장)
                  </button>
                )}

                {/* Card list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {flashcards.map((card) => {
                    const isDue = card.nextReview <= todayForCards;
                    return (
                      <div key={card.id} style={{ background: C.bg2, border: `1px solid ${isDue ? `${C.violet}40` : C.b0}`, borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ color: C.t0, fontSize: 13 }}>{card.front}</p>
                            <p style={{ color: C.t1, fontSize: 11.5, marginTop: 4 }}>{card.back}</p>
                          </div>
                          <button onClick={() => removeFlashcard(card.id)} style={{ color: C.t2, cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                          {card.category && (
                            <span style={{ fontSize: 10, color: C.violet, background: `${C.violet}18`, borderRadius: 5, padding: '1px 6px' }}>{card.category}</span>
                          )}
                          <span style={{ fontSize: 10, fontFamily: mono, color: isDue ? C.amber : C.t2, marginLeft: 'auto' }}>
                            {isDue ? '복습 필요' : `다음 복습: ${card.nextReview}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {flashcards.length === 0 && !loading && (
                    <p style={{ color: C.t2, fontSize: 13, padding: '20px 0' }}>플래시카드가 없습니다. 새 카드를 추가해보세요.</p>
                  )}
                </div>

                {isMobile && (
                  showCardForm ? FlashcardForm : (
                    <button onClick={() => setShowCardForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer', padding: '8px 0' }}>
                      <Plus size={14} />새 카드 추가
                    </button>
                  )
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* ── Right panel: desktop only ── */}
      {!isMobile && (
        <div style={{ width: 264, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Stats */}
          <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ color: C.t1, fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 12 }}>현황</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: '학습 목표', value: goals.length, color: C.sky },
                { label: '평균 진도', value: `${avgProgress}%`, color: C.sky },
                { label: '읽는 중', value: reading, color: C.blue },
                { label: '완독', value: completed, color: C.teal },
                { label: '읽을 책', value: wishlist, color: C.amber },
                { label: '이번 주', value: fmtMins(weekMinutes), color: C.violet },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: C.bg1, borderRadius: 8, padding: '10px 12px' }}>
                  <p style={{ color: C.t2, fontSize: 10.5, marginBottom: 4 }}>{label}</p>
                  <p style={{ color, fontSize: 15, fontWeight: 700, fontFamily: mono }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Add form */}
          <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ color: rightAccent, fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 12 }}>{rightLabel}</p>
            {tab === 'goals' && GoalForm}
            {tab === 'books' && BookForm}
            {tab === 'study' && StudyForm}
            {tab === 'flashcard' && FlashcardForm}
          </div>
        </div>
      )}
    </div>
  );
}
