import { useEffect, useState } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, Target, PiggyBank, Sparkles, Loader } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useFinanceStore, type TxType } from '../../shared/stores/finance.store';
import { useWindowSize } from '../../shared/hooks/useWindowSize';

const C = {
  bg1: '#090D1F', bg2: '#0D1228', bg3: '#131B32',
  b0: 'rgba(255,255,255,0.04)', b1: 'rgba(255,255,255,0.08)',
  t0: '#DDE5F5', t1: '#556070', t2: '#253040',
  blue: '#3B8EF0', violet: '#7C5CF0', teal: '#00CCA0', amber: '#EFA020', rose: '#F05472', sky: '#58AEFF',
};
const font = '"Space Grotesk", system-ui, sans-serif';
const mono = '"JetBrains Mono", "Fira Code", monospace';

const EXPENSE_CATEGORIES = ['식비', '교통', '쇼핑', '구독', '의료', '교육', '여가', '기타'];
const INCOME_CATEGORIES = ['급여', '부업', '투자수익', '기타'];

function fmt(n: number) {
  return n.toLocaleString('ko-KR') + '원';
}

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

const inputStyle = {
  background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8,
  padding: '9px 12px', color: C.t0, fontSize: 13.5, fontFamily: font,
  outline: 'none', width: '100%', boxSizing: 'border-box' as const,
};

const selectStyle = {
  background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8,
  padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, cursor: 'pointer',
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.bg3, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '10px 14px', fontFamily: font }}>
      <p style={{ color: C.t1, fontSize: 11, marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.name === '수입' ? C.teal : C.rose, fontSize: 12, fontWeight: 600 }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

type TabId = 'transactions' | 'budget' | 'savings' | 'analysis';

export function FinanceView() {
  const {
    items, budgets, savingsGoals, loading, aiLoading,
    fetch, add, remove,
    fetchBudgets, setBudget, removeBudget,
    fetchSavingsGoals, addSavingsGoal, updateSavingsGoal, removeSavingsGoal,
    analyzeFinance,
  } = useFinanceStore();
  const { isMobile } = useWindowSize();

  const [tab, setTab] = useState<TabId>('transactions');

  // Transaction form
  const [showForm, setShowForm] = useState(false);
  const [txTitle, setTxTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TxType>('expense');
  const [category, setCategory] = useState('식비');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Budget form
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState('식비');
  const [budgetAmount, setBudgetAmount] = useState('');

  // Savings form
  const [showSavingsForm, setShowSavingsForm] = useState(false);
  const [savingsName, setSavingsName] = useState('');
  const [savingsTarget, setSavingsTarget] = useState('');
  const [savingsCurrent, setSavingsCurrent] = useState('');
  const [savingsDate, setSavingsDate] = useState('');
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  // FIN-06: AI analysis
  const [aiAnalysis, setAiAnalysis] = useState('');

  useEffect(() => {
    fetch();
    fetchBudgets();
    fetchSavingsGoals();
  }, [fetch, fetchBudgets, fetchSavingsGoals]);

  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split('T')[0];
  const totalIncome = items.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = items.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const monthIncome = items.filter((t) => t.type === 'income' && t.date >= firstOfMonth).reduce((s, t) => s + t.amount, 0);
  const monthExpense = items.filter((t) => t.type === 'expense' && t.date >= firstOfMonth).reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const monthBalance = monthIncome - monthExpense;

  const last7 = getLast7Days();
  const chartData = last7.map((d) => {
    const dayItems = items.filter((t) => t.date === d);
    return {
      name: d.slice(5),
      수입: dayItems.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      지출: dayItems.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    };
  });

  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));

  const expenseByCategory = EXPENSE_CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = items
      .filter((t) => t.type === 'expense' && t.category === cat && t.date >= firstOfMonth)
      .reduce((s, t) => s + t.amount, 0);
    return acc;
  }, {});

  const totalSavingsTarget = savingsGoals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSavingsCurrent = savingsGoals.reduce((s, g) => s + g.currentAmount, 0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(amount.replace(/,/g, ''));
    if (!txTitle.trim() || isNaN(n) || n <= 0) return;
    await add({ title: txTitle.trim(), amount: n, type, category, date });
    setTxTitle(''); setAmount(''); setCategory(type === 'expense' ? '식비' : '급여');
    if (isMobile) setShowForm(false);
  };

  const handleSetBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(budgetAmount.replace(/,/g, ''));
    if (isNaN(n) || n <= 0) return;
    await setBudget({ category: budgetCategory, amount: n, period: 'monthly' });
    setBudgetAmount('');
    if (isMobile) setShowBudgetForm(false);
  };

  const handleAddSavings = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(savingsTarget.replace(/,/g, ''));
    const current = parseFloat(savingsCurrent.replace(/,/g, '') || '0');
    if (!savingsName.trim() || isNaN(target) || target <= 0) return;
    await addSavingsGoal({
      name: savingsName.trim(),
      targetAmount: target,
      currentAmount: isNaN(current) ? 0 : current,
      targetDate: savingsDate || undefined,
    });
    setSavingsName(''); setSavingsTarget(''); setSavingsCurrent(''); setSavingsDate('');
    if (isMobile) setShowSavingsForm(false);
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoalId) return;
    const n = parseFloat(depositAmount.replace(/,/g, ''));
    if (isNaN(n) || n <= 0) return;
    const goal = savingsGoals.find((g) => g.id === depositGoalId);
    if (!goal) return;
    await updateSavingsGoal(depositGoalId, { currentAmount: goal.currentAmount + n });
    setDepositAmount(''); setDepositGoalId(null);
  };

  const TxForm = (
    <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input value={txTitle} onChange={(e) => setTxTitle(e.target.value)} placeholder="거래 내용" style={inputStyle} />
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="금액" inputMode="numeric"
          style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: mono, outline: 'none' }} />
        <select value={type} onChange={(e) => { setType(e.target.value as TxType); setCategory(e.target.value === 'expense' ? '식비' : '급여'); }}
          style={{ ...selectStyle, flex: 1 }}>
          <option value="expense">지출</option>
          <option value="income">수입</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
          {(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, colorScheme: 'dark' }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" style={{ flex: 1, padding: '9px', background: C.blue, color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: font, cursor: 'pointer' }}>추가</button>
        {isMobile && (
          <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 16px', background: C.bg1, border: `1px solid ${C.b1}`, color: C.t1, borderRadius: 8, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>취소</button>
        )}
      </div>
    </form>
  );

  const BudgetForm = (
    <form onSubmit={handleSetBudget} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <select value={budgetCategory} onChange={(e) => setBudgetCategory(e.target.value)} style={selectStyle}>
        {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <input value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} placeholder="월 예산 금액 (원)" inputMode="numeric" style={inputStyle} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" style={{ flex: 1, padding: '9px', background: C.amber, color: '#06091A', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: font, cursor: 'pointer' }}>예산 설정</button>
        {isMobile && (
          <button type="button" onClick={() => setShowBudgetForm(false)} style={{ padding: '9px 16px', background: C.bg1, border: `1px solid ${C.b1}`, color: C.t1, borderRadius: 8, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>취소</button>
        )}
      </div>
    </form>
  );

  const SavingsForm = (
    <form onSubmit={handleAddSavings} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input value={savingsName} onChange={(e) => setSavingsName(e.target.value)} placeholder="목표 이름 (예: 비상금, 여행)" style={inputStyle} />
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={savingsTarget} onChange={(e) => setSavingsTarget(e.target.value)} placeholder="목표 금액 (원)" inputMode="numeric"
          style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: mono, outline: 'none' }} />
        <input value={savingsCurrent} onChange={(e) => setSavingsCurrent(e.target.value)} placeholder="현재 금액" inputMode="numeric"
          style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: mono, outline: 'none' }} />
      </div>
      <input type="date" value={savingsDate} onChange={(e) => setSavingsDate(e.target.value)}
        style={{ background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, colorScheme: 'dark' }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" style={{ flex: 1, padding: '9px', background: C.sky, color: '#06091A', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: font, cursor: 'pointer' }}>목표 추가</button>
        {isMobile && (
          <button type="button" onClick={() => setShowSavingsForm(false)} style={{ padding: '9px 16px', background: C.bg1, border: `1px solid ${C.b1}`, color: C.t1, borderRadius: 8, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>취소</button>
        )}
      </div>
    </form>
  );

  const statCard = (label: string, value: number, color: string, Icon: React.ComponentType<{ size?: number; color?: string }>) => (
    <div style={{ flex: 1, background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Icon size={14} color={color} />
        <span style={{ color: C.t1, fontSize: 12 }}>{label}</span>
      </div>
      <p style={{ color, fontSize: 18, fontWeight: 700, fontFamily: mono }}>{fmt(value)}</p>
    </div>
  );

  const tabBtn = (id: TabId, label: string) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
        fontFamily: font, cursor: 'pointer', transition: 'all 0.14s',
        background: tab === id ? C.bg3 : 'transparent',
        border: `1px solid ${tab === id ? C.b1 : 'transparent'}`,
        color: tab === id ? C.t0 : C.t1,
      }}
    >{label}</button>
  );

  const rightFormLabel = tab === 'transactions' ? '새 거래' : tab === 'budget' ? '예산 설정' : tab === 'savings' ? '저축 목표' : 'AI 분석';
  const rightFormAccent = tab === 'transactions' ? C.blue : tab === 'budget' ? C.amber : tab === 'savings' ? C.sky : C.violet;

  return (
    <div style={{ fontFamily: font, display: 'flex', gap: 20, alignItems: 'flex-start' }}>

      {/* ── Left column ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: 14 }}>
          <h1 style={{ color: C.t0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>재정</h1>
          <p style={{ color: C.t1, fontSize: 12.5, marginTop: 3 }}>
            {loading ? '불러오는 중...' : `총 ${items.length}건의 거래내역`}
          </p>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {statCard('총 수입', totalIncome, C.teal, TrendingUp)}
          {statCard('총 지출', totalExpense, C.rose, TrendingDown)}
          <div style={{ flex: 1, background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 13 }}>💰</span>
              <span style={{ color: C.t1, fontSize: 12 }}>잔액</span>
            </div>
            <p style={{ color: balance >= 0 ? C.teal : C.rose, fontSize: 18, fontWeight: 700, fontFamily: mono }}>
              {balance >= 0 ? '+' : ''}{fmt(balance)}
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 20,
          background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10, padding: 4, width: 'fit-content',
        }}>
          {tabBtn('transactions', '거래 내역')}
          {tabBtn('budget', '예산 관리')}
          {tabBtn('savings', '저축 목표')}
          {tabBtn('analysis', 'AI 분석')}
        </div>

        {/* Transactions tab */}
        {tab === 'transactions' && (
          <>
            {items.length > 0 && (
              <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '20px', marginBottom: 24 }}>
                <p style={{ color: C.t1, fontSize: 12, marginBottom: 16 }}>최근 7일</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData} barSize={10} barGap={4}>
                    <CartesianGrid vertical={false} stroke={C.b1} />
                    <XAxis dataKey="name" tick={{ fill: C.t1, fontSize: 10, fontFamily: mono }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="수입" fill={C.teal} radius={[4, 4, 0, 0]} fillOpacity={0.8} />
                    <Bar dataKey="지출" fill={C.rose} radius={[4, 4, 0, 0]} fillOpacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {sorted.slice(0, 20).map((tx) => (
                <div key={tx.id} style={{
                  background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10,
                  padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: tx.type === 'income' ? `${C.teal}18` : `${C.rose}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {tx.type === 'income'
                      ? <TrendingUp size={13} color={C.teal} />
                      : <TrendingDown size={13} color={C.rose} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: C.t0, fontSize: 13.5 }}>{tx.title}</p>
                    <p style={{ color: C.t1, fontSize: 11, marginTop: 2 }}>{tx.category} · {tx.date}</p>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, fontFamily: mono, color: tx.type === 'income' ? C.teal : C.rose }}>
                    {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                  </span>
                  <button onClick={() => remove(tx.id)} style={{ color: C.t2, cursor: 'pointer', display: 'flex' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {items.length === 0 && !loading && (
                <p style={{ color: C.t2, fontSize: 13, padding: '20px 0' }}>거래 내역이 없습니다.</p>
              )}
            </div>

            {isMobile && (
              showForm ? TxForm : (
                <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer', padding: '8px 0' }}>
                  <Plus size={14} />새 거래 추가
                </button>
              )
            )}
          </>
        )}

        {/* Budget tab */}
        {tab === 'budget' && (
          <>
            <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
              <p style={{ color: C.t1, fontSize: 11.5, marginBottom: 4 }}>이번 달 총 지출</p>
              <p style={{ color: C.rose, fontSize: 22, fontWeight: 700, fontFamily: mono }}>{fmt(monthExpense)}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {EXPENSE_CATEGORIES.map((cat) => {
                const budget = budgets.find((b) => b.category === cat);
                const spent = expenseByCategory[cat] ?? 0;
                const pct = budget ? Math.min(100, (spent / budget.amount) * 100) : 0;
                const over = budget && spent > budget.amount;
                if (!budget && spent === 0) return null;
                return (
                  <div key={cat} style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <Target size={13} color={over ? C.rose : C.amber} />
                      <span style={{ color: C.t0, fontSize: 13.5, fontWeight: 500, flex: 1 }}>{cat}</span>
                      <span style={{ color: C.t1, fontSize: 12, fontFamily: mono }}>
                        {fmt(spent)}
                        {budget && <span style={{ color: over ? C.rose : C.t1 }}> / {fmt(budget.amount)}</span>}
                      </span>
                      {budget && (
                        <button onClick={() => removeBudget(budget.id)} style={{ color: C.t2, cursor: 'pointer', display: 'flex' }}>
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    {budget && (
                      <div style={{ height: 4, background: C.bg3, borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: over ? C.rose : pct > 80 ? C.amber : C.teal, borderRadius: 2, transition: 'width 0.3s' }} />
                      </div>
                    )}
                    {over && <p style={{ color: C.rose, fontSize: 11, marginTop: 6 }}>예산 {fmt(spent - budget!.amount)} 초과</p>}
                  </div>
                );
              })}
              {budgets.length === 0 && (
                <p style={{ color: C.t2, fontSize: 13, padding: '12px 0' }}>카테고리별 예산을 추가해보세요.</p>
              )}
            </div>

            {isMobile && (
              showBudgetForm ? BudgetForm : (
                <button onClick={() => setShowBudgetForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer', padding: '8px 0' }}>
                  <Plus size={14} />예산 추가
                </button>
              )
            )}
          </>
        )}

        {/* Savings tab */}
        {tab === 'savings' && (
          <>
            {savingsGoals.length > 0 && (
              <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <PiggyBank size={14} color={C.sky} />
                  <span style={{ color: C.t1, fontSize: 12 }}>전체 저축 진행률</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                  <span style={{ color: C.sky, fontSize: 20, fontWeight: 700, fontFamily: mono }}>{fmt(totalSavingsCurrent)}</span>
                  <span style={{ color: C.t1, fontSize: 12, fontFamily: mono }}>/ {fmt(totalSavingsTarget)}</span>
                  <span style={{ color: C.sky, fontSize: 12, fontWeight: 600, marginLeft: 'auto', fontFamily: mono }}>
                    {totalSavingsTarget > 0 ? Math.round((totalSavingsCurrent / totalSavingsTarget) * 100) : 0}%
                  </span>
                </div>
                <div style={{ height: 6, background: C.bg3, borderRadius: 3 }}>
                  <div style={{
                    height: '100%',
                    width: `${totalSavingsTarget > 0 ? Math.min(100, (totalSavingsCurrent / totalSavingsTarget) * 100) : 0}%`,
                    background: `linear-gradient(90deg, ${C.sky}, ${C.violet})`,
                    borderRadius: 3, transition: 'width 0.4s',
                  }} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              {savingsGoals.map((goal) => {
                const pct = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
                const done = goal.currentAmount >= goal.targetAmount;
                return (
                  <div key={goal.id} style={{
                    background: C.bg2, border: `1px solid ${done ? C.teal + '40' : C.b1}`, borderRadius: 12, padding: '16px 18px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: done ? `${C.teal}20` : `${C.sky}18`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <PiggyBank size={14} color={done ? C.teal : C.sky} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: C.t0, fontSize: 14, fontWeight: 600 }}>{goal.name}</p>
                        {goal.targetDate && (
                          <p style={{ color: C.t2, fontSize: 11, marginTop: 2, fontFamily: mono }}>목표: {goal.targetDate}</p>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: done ? C.teal : C.sky, fontSize: 14, fontWeight: 700, fontFamily: mono }}>{fmt(goal.currentAmount)}</p>
                        <p style={{ color: C.t1, fontSize: 11, fontFamily: mono }}>/ {fmt(goal.targetAmount)}</p>
                      </div>
                      <button onClick={() => removeSavingsGoal(goal.id)} style={{ color: C.t2, cursor: 'pointer', display: 'flex', flexShrink: 0, marginTop: 2 }}>
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <div style={{ height: 6, background: C.bg3, borderRadius: 3, marginBottom: 10 }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: done ? C.teal : `linear-gradient(90deg, ${C.sky}, ${C.violet})`,
                        borderRadius: 3, transition: 'width 0.4s',
                      }} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: C.t2, fontSize: 11, fontFamily: mono }}>{Math.round(pct)}%</span>
                      {done && <span style={{ color: C.teal, fontSize: 11, fontWeight: 600 }}>✓ 달성!</span>}
                      {!done && (
                        <button
                          onClick={() => setDepositGoalId(depositGoalId === goal.id ? null : goal.id)}
                          style={{
                            marginLeft: 'auto', fontSize: 11, padding: '4px 12px',
                            background: `${C.sky}18`, border: `1px solid ${C.sky}40`,
                            color: C.sky, borderRadius: 6, cursor: 'pointer', fontFamily: font, fontWeight: 600,
                          }}
                        >+ 입금</button>
                      )}
                    </div>

                    {depositGoalId === goal.id && (
                      <form onSubmit={handleDeposit} style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                        <input
                          autoFocus
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          placeholder="입금액 (원)"
                          inputMode="numeric"
                          style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '7px 12px', color: C.t0, fontSize: 13, fontFamily: mono, outline: 'none' }}
                        />
                        <button type="submit" style={{ padding: '7px 14px', background: C.sky, color: '#06091A', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: font, cursor: 'pointer' }}>추가</button>
                        <button type="button" onClick={() => setDepositGoalId(null)} style={{ padding: '7px 12px', background: C.bg1, border: `1px solid ${C.b1}`, color: C.t1, borderRadius: 8, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>취소</button>
                      </form>
                    )}
                  </div>
                );
              })}
              {savingsGoals.length === 0 && (
                <p style={{ color: C.t2, fontSize: 13, padding: '12px 0' }}>저축 목표를 추가해보세요.</p>
              )}
            </div>

            {isMobile && (
              showSavingsForm ? SavingsForm : (
                <button onClick={() => setShowSavingsForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer', padding: '8px 0' }}>
                  <Plus size={14} />저축 목표 추가
                </button>
              )
            )}
          </>
        )}

        {/* AI Analysis tab */}
        {tab === 'analysis' && (() => {
          const monthStr = new Date().toISOString().slice(0, 7);
          const byCategory = EXPENSE_CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
            acc[cat] = items
              .filter((t) => t.type === 'expense' && t.category === cat && t.date >= firstOfMonth)
              .reduce((s, t) => s + t.amount, 0);
            return acc;
          }, {});
          const topCategories = Object.entries(byCategory)
            .filter(([, v]) => v > 0)
            .sort(([, a], [, b]) => b - a);

          return (
            <>
              {/* Category breakdown */}
              <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
                <p style={{ color: C.t1, fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 14 }}>이번 달 카테고리별 지출</p>
                {topCategories.length === 0 && (
                  <p style={{ color: C.t2, fontSize: 13 }}>이번 달 지출 내역이 없습니다.</p>
                )}
                {topCategories.map(([cat, amount]) => {
                  const pct = monthExpense > 0 ? (amount / monthExpense) * 100 : 0;
                  return (
                    <div key={cat} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: C.t0, fontSize: 12.5 }}>{cat}</span>
                        <span style={{ color: C.rose, fontSize: 12, fontFamily: mono }}>{fmt(amount)}</span>
                      </div>
                      <div style={{ height: 4, background: C.bg3, borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: C.rose, borderRadius: 2, opacity: 0.7 }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AI generate button */}
              <button
                onClick={async () => {
                  const result = await analyzeFinance({ income: monthIncome, expense: monthExpense, byCategory, month: monthStr });
                  if (result) setAiAnalysis(result);
                }}
                disabled={aiLoading || monthExpense === 0}
                style={{
                  width: '100%', padding: '12px', borderRadius: 10, marginBottom: 16,
                  background: aiLoading || monthExpense === 0 ? C.b1 : `linear-gradient(135deg, ${C.violet}, #9B7CF5)`,
                  color: aiLoading || monthExpense === 0 ? C.t1 : '#fff',
                  fontSize: 13.5, fontWeight: 600, fontFamily: font, cursor: aiLoading || monthExpense === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {aiLoading
                  ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> AI 분석 중…</>
                  : <><Sparkles size={14} />AI 지출 분석</>
                }
              </button>

              {aiAnalysis && (
                <div style={{ background: C.bg2, border: `1px solid ${C.violet}30`, borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Sparkles size={13} color={C.violet} />
                    <span style={{ color: C.t0, fontSize: 13, fontWeight: 600 }}>AI 분석 결과</span>
                  </div>
                  <p style={{ color: C.t0, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{aiAnalysis}</p>
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* ── Right panel: desktop only ── */}
      {!isMobile && (
        <div style={{ width: 272, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Monthly summary */}
          <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ color: C.t1, fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 12 }}>이번 달</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <TrendingUp size={12} color={C.teal} />
                  <span style={{ color: C.t1, fontSize: 12 }}>수입</span>
                </div>
                <span style={{ color: C.teal, fontSize: 13, fontWeight: 700, fontFamily: mono }}>{fmt(monthIncome)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <TrendingDown size={12} color={C.rose} />
                  <span style={{ color: C.t1, fontSize: 12 }}>지출</span>
                </div>
                <span style={{ color: C.rose, fontSize: 13, fontWeight: 700, fontFamily: mono }}>{fmt(monthExpense)}</span>
              </div>
              <div style={{ height: 1, background: C.b1 }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: C.t1, fontSize: 12 }}>잔액</span>
                <span style={{ color: monthBalance >= 0 ? C.teal : C.rose, fontSize: 14, fontWeight: 700, fontFamily: mono }}>
                  {monthBalance >= 0 ? '+' : ''}{fmt(monthBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Add form */}
          {tab !== 'analysis' && (
            <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ color: rightFormAccent, fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 12 }}>{rightFormLabel}</p>
              {tab === 'transactions' && TxForm}
              {tab === 'budget' && BudgetForm}
              {tab === 'savings' && SavingsForm}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
