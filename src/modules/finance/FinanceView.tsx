import { useEffect, useState } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useFinanceStore, type TxType } from '../../shared/stores/finance.store';

const C = {
  bg1: '#090D1F', bg2: '#0D1228', bg3: '#131B32',
  b0: 'rgba(255,255,255,0.04)', b1: 'rgba(255,255,255,0.08)',
  t0: '#DDE5F5', t1: '#556070', t2: '#253040',
  blue: '#3B8EF0', teal: '#00CCA0', amber: '#EFA020', rose: '#F05472',
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

export function FinanceView() {
  const { items, budgets, loading, fetch, add, remove, fetchBudgets, setBudget, removeBudget } = useFinanceStore();
  const [tab, setTab] = useState<'transactions' | 'budget'>('transactions');
  const [showForm, setShowForm] = useState(false);
  const [txTitle, setTxTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TxType>('expense');
  const [category, setCategory] = useState('식비');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Budget form state
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState('식비');
  const [budgetAmount, setBudgetAmount] = useState('');

  useEffect(() => {
    fetch();
    fetchBudgets();
  }, [fetch, fetchBudgets]);

  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split('T')[0];
  const totalIncome = items.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = items.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const monthExpense = items
    .filter((t) => t.type === 'expense' && t.date >= firstOfMonth)
    .reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(amount.replace(/,/g, ''));
    if (!txTitle.trim() || isNaN(n) || n <= 0) return;
    await add({ title: txTitle.trim(), amount: n, type, category, date });
    setTxTitle(''); setAmount(''); setCategory(type === 'expense' ? '식비' : '급여'); setShowForm(false);
  };

  const handleSetBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(budgetAmount.replace(/,/g, ''));
    if (isNaN(n) || n <= 0) return;
    await setBudget({ category: budgetCategory, amount: n, period: 'monthly' });
    setBudgetAmount(''); setShowBudgetForm(false);
  };

  // Per-category expense this month
  const expenseByCategory = EXPENSE_CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = items
      .filter((t) => t.type === 'expense' && t.category === cat && t.date >= firstOfMonth)
      .reduce((s, t) => s + t.amount, 0);
    return acc;
  }, {});

  const statCard = (label: string, value: number, color: string, Icon: React.ComponentType<{ size?: number; color?: string }>) => (
    <div style={{ flex: 1, background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Icon size={14} color={color} />
        <span style={{ color: C.t1, fontSize: 12 }}>{label}</span>
      </div>
      <p style={{ color, fontSize: 18, fontWeight: 700, fontFamily: mono }}>{fmt(value)}</p>
    </div>
  );

  const tabBtn = (id: 'transactions' | 'budget', label: string) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: '7px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
        fontFamily: font, cursor: 'pointer',
        background: tab === id ? `${C.amber}18` : 'transparent',
        border: `1px solid ${tab === id ? C.amber : C.b1}`,
        color: tab === id ? C.amber : C.t1,
      }}
    >{label}</button>
  );

  return (
    <div style={{ padding: '26px 28px', fontFamily: font }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ color: C.t0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>재정</h1>
        <p style={{ color: C.t1, fontSize: 12.5, marginTop: 4 }}>
          {loading ? '불러오는 중...' : `총 ${items.length}건의 거래내역`}
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {statCard('총 수입', totalIncome, C.teal, TrendingUp)}
        {statCard('총 지출', totalExpense, C.rose, TrendingDown)}
        <div style={{ flex: 1, background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 14 }}>💰</span>
            <span style={{ color: C.t1, fontSize: 12 }}>잔액</span>
          </div>
          <p style={{ color: balance >= 0 ? C.teal : C.rose, fontSize: 18, fontWeight: 700, fontFamily: mono }}>
            {balance >= 0 ? '+' : ''}{fmt(balance)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {tabBtn('transactions', '거래 내역')}
        {tabBtn('budget', '예산 관리')}
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

          {showForm ? (
            <form onSubmit={handleAdd} style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input autoFocus value={txTitle} onChange={(e) => setTxTitle(e.target.value)} placeholder="거래 내용" style={inputStyle} />
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="금액" inputMode="numeric"
                  style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: mono, outline: 'none' }}
                />
                <select
                  value={type}
                  onChange={(e) => { setType(e.target.value as TxType); setCategory(e.target.value === 'expense' ? '식비' : '급여'); }}
                  style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, cursor: 'pointer' }}
                >
                  <option value="expense">지출</option>
                  <option value="income">수입</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>
                  {(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, colorScheme: 'dark' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={{ flex: 1, padding: '9px', background: C.blue, color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: font, cursor: 'pointer' }}>추가</button>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 16px', background: C.bg1, border: `1px solid ${C.b1}`, color: C.t1, borderRadius: 8, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>취소</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer', padding: '8px 0' }}>
              <Plus size={14} />새 거래 추가
            </button>
          )}
        </>
      )}

      {/* Budget tab */}
      {tab === 'budget' && (
        <>
          {/* This month summary */}
          <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
            <p style={{ color: C.t1, fontSize: 11.5, marginBottom: 4 }}>이번 달 총 지출</p>
            <p style={{ color: C.rose, fontSize: 22, fontWeight: 700, fontFamily: mono }}>{fmt(monthExpense)}</p>
          </div>

          {/* Budget list by category */}
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
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: over ? C.rose : pct > 80 ? C.amber : C.teal,
                        borderRadius: 2, transition: 'width 0.3s',
                      }} />
                    </div>
                  )}
                  {over && (
                    <p style={{ color: C.rose, fontSize: 11, marginTop: 6 }}>
                      예산 {fmt(spent - budget!.amount)} 초과
                    </p>
                  )}
                </div>
              );
            })}
            {budgets.length === 0 && (
              <p style={{ color: C.t2, fontSize: 13, padding: '12px 0' }}>설정된 예산이 없습니다. 카테고리별 예산을 추가해보세요.</p>
            )}
          </div>

          {/* Budget form */}
          {showBudgetForm ? (
            <form onSubmit={handleSetBudget} style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <select value={budgetCategory} onChange={(e) => setBudgetCategory(e.target.value)} style={{ background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '9px 12px', color: C.t0, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                autoFocus value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="월 예산 금액 (원)" inputMode="numeric"
                style={inputStyle}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={{ flex: 1, padding: '9px', background: C.amber, color: '#06091A', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: font, cursor: 'pointer' }}>예산 설정</button>
                <button type="button" onClick={() => setShowBudgetForm(false)} style={{ padding: '9px 16px', background: C.bg1, border: `1px solid ${C.b1}`, color: C.t1, borderRadius: 8, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>취소</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowBudgetForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer', padding: '8px 0' }}>
              <Plus size={14} />예산 추가
            </button>
          )}
        </>
      )}
    </div>
  );
}
