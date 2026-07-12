import { useEffect, useState } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { ChevronRight, Loader, Zap, Target, Brain, GitBranch, RefreshCw, Plus, Trash2, Award, Layers, MapPin, CheckCircle2, Circle, PauseCircle, Briefcase, BookOpen, GraduationCap, Smile, Frown, Meh, Clock, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import { useCareerStore, type CareerTarget, type CareerPath, type CoachLog, type Skill, type Achievement, type SkillLevel, type CareerGoal, type GoalHorizon, type JobStage, type CertStatus } from '../../shared/stores/career.store';
import { useWindowSize } from '../../shared/hooks/useWindowSize';

const C = {
  bg1: '#090D1F', bg2: '#0D1228', bg3: '#131B32',
  b0: 'rgba(255,255,255,0.04)', b1: 'rgba(255,255,255,0.08)', b2: 'rgba(255,255,255,0.16)',
  t0: '#DDE5F5', t1: '#556070', t2: '#253040',
  blue: '#3B8EF0', violet: '#7C5CF0', teal: '#00CCA0',
  amber: '#EFA020', rose: '#F05472', sky: '#58AEFF',
};
const font = '"Space Grotesk", system-ui, sans-serif';
const mono = '"JetBrains Mono", "Fira Code", monospace';

const DIM_COLORS: Record<string, string> = {
  core_skills: C.blue, soft_skills: C.violet, education: C.teal,
  experience: C.sky, network: C.rose, market_fit: C.amber,
};
const DIM_LABELS: Record<string, string> = {
  core_skills: '기술 역량', soft_skills: '소프트 스킬', education: '교육/자격',
  experience: '경험', network: '네트워크', market_fit: '시장 적합',
};
const RISK_COLOR: Record<string, string> = { low: C.teal, medium: C.amber, high: C.rose };
const RISK_LABEL: Record<string, string> = { low: '낮음', medium: '중간', high: '높음' };

const INTERVIEW_QS = [
  { key: 'current_role', label: '현재 직무/직급을 알려주세요', placeholder: '예) 프론트엔드 개발자 3년차' },
  { key: 'main_skills', label: '주요 기술 스택은 무엇인가요?', placeholder: '예) React, TypeScript, Node.js' },
  { key: 'achievements', label: '최근 1~2년 주요 성과가 있다면?', placeholder: '예) MAU 50만 서비스 리팩토링, 로딩 40% 개선' },
  { key: 'weakness', label: '스스로 부족하다고 느끼는 부분은?', placeholder: '예) 시스템 설계, 리더십 경험 부족' },
  { key: 'timeline', label: '목표 달성까지 원하는 기간은?', placeholder: '예) 1년 이내' },
];

function Spinner() {
  return <Loader size={16} color={C.violet} style={{ animation: 'spin 1s linear infinite' }} />;
}

function CircularGauge({ value, color = C.violet, size = 120 }: { value: number; color?: string; size?: number }) {
  const r = 46;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={r} fill="none" stroke={C.b1} strokeWidth="9" />
      <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 60 60)"
        style={{ filter: `drop-shadow(0 0 10px ${color}90)`, transition: 'stroke-dashoffset 0.8s ease' }} />
      <text x="60" y="55" textAnchor="middle" fill={C.t0} fontSize="24" fontWeight="700" fontFamily={font}>{value}</text>
      <text x="60" y="70" textAnchor="middle" fill={C.t1} fontSize="9" fontFamily={font}>준비도 %</text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Set target
// ---------------------------------------------------------------------------
function SetupStep({ onSubmit, loading }: { onSubmit: (title: string, ctx: string) => void; loading: boolean }) {
  const [title, setTitle] = useState('');
  const [ctx, setCtx] = useState('');
  const inp: React.CSSProperties = {
    background: C.bg3, border: `1px solid ${C.b1}`, borderRadius: 8,
    padding: '10px 13px', color: C.t0, fontSize: 13.5, fontFamily: font,
    outline: 'none', width: '100%', boxSizing: 'border-box',
  };
  return (
    <div style={{ maxWidth: 540, margin: '60px auto', fontFamily: font }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <Target size={22} color={C.violet} />
        <h2 style={{ color: C.t0, fontSize: 20, fontWeight: 700 }}>커리어 목표 설정</h2>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ color: C.t1, fontSize: 11.5, display: 'block', marginBottom: 7 }}>목표 포지션</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예) 프론트엔드 시니어 개발자" style={inp} />
      </div>
      <div style={{ marginBottom: 24 }}>
        <label style={{ color: C.t1, fontSize: 11.5, display: 'block', marginBottom: 7 }}>추가 맥락 (선택)</label>
        <textarea value={ctx} onChange={(e) => setCtx(e.target.value)}
          placeholder="현재 상황이나 목표 회사/도메인을 자유롭게 적어주세요"
          rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
      </div>
      <button
        onClick={() => title.trim() && onSubmit(title.trim(), ctx.trim())}
        disabled={!title.trim() || loading}
        style={{
          background: loading || !title.trim() ? C.b1 : C.violet, color: loading || !title.trim() ? C.t1 : '#fff',
          border: 'none', borderRadius: 9, padding: '11px 24px', fontSize: 13.5,
          fontFamily: font, fontWeight: 600, cursor: title.trim() && !loading ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        {loading ? <><Spinner /> AI 분석 중…</> : <>목표 설정 → AI 프로파일링</>}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Assess
// ---------------------------------------------------------------------------
function AssessStep({ target, onSubmit, loading }: {
  target: CareerTarget; onSubmit: (answers: Record<string, string>) => void; loading: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const inp: React.CSSProperties = {
    background: C.bg3, border: `1px solid ${C.b1}`, borderRadius: 8,
    padding: '9px 12px', color: C.t0, fontSize: 13, fontFamily: font,
    outline: 'none', width: '100%', boxSizing: 'border-box',
  };
  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: font }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <Brain size={20} color={C.sky} />
        <h2 style={{ color: C.t0, fontSize: 18, fontWeight: 700 }}>현재 상태 진단</h2>
      </div>
      <p style={{ color: C.t1, fontSize: 12.5, marginBottom: 26 }}>
        목표: <span style={{ color: C.violet }}>{target.title}</span> · AI가 갭을 분석합니다
      </p>
      {INTERVIEW_QS.map((q) => (
        <div key={q.key} style={{ marginBottom: 16 }}>
          <label style={{ color: C.t1, fontSize: 11.5, display: 'block', marginBottom: 6 }}>{q.label}</label>
          <input value={answers[q.key] ?? ''} onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
            placeholder={q.placeholder} style={inp} />
        </div>
      ))}
      <button
        onClick={() => onSubmit(answers)}
        disabled={loading}
        style={{
          marginTop: 8, background: loading ? C.b1 : C.sky, color: loading ? C.t1 : '#000',
          border: 'none', borderRadius: 9, padding: '11px 24px', fontSize: 13.5,
          fontFamily: font, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        {loading ? <><Spinner /> AI 갭 분석 중…</> : <>갭 분석 시작</>}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Show assessment + generate paths
// ---------------------------------------------------------------------------
function AssessmentView({ target, paths, onGeneratePaths, onSelectPath, aiLoading }: {
  target: CareerTarget;
  paths: CareerPath[];
  onGeneratePaths: () => void;
  onSelectPath: (id: string) => void;
  aiLoading: boolean;
}) {
  const assessments = target.currentAssessment ?? [];
  const radarData = assessments.map((a) => ({
    subject: DIM_LABELS[a.dimension] ?? a.dimension,
    value: a.score,
  }));

  return (
    <div style={{ fontFamily: font }}>
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ color: C.t1, fontSize: 10.5, letterSpacing: '0.6px', textTransform: 'uppercase', fontFamily: mono, marginBottom: 5 }}>
          AI 커리어 코치
        </div>
        <h1 style={{ color: C.t0, fontSize: 21, fontWeight: 700, letterSpacing: '-0.4px' }}>{target.title}</h1>
        {target.estimatedMonths && (
          <p style={{ color: C.t1, fontSize: 12.5, marginTop: 4 }}>예상 기간 {target.estimatedMonths}개월</p>
        )}
      </div>

      {/* Gauge + radar */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 14, marginBottom: 14 }}>
        <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <CircularGauge value={target.overallReadiness} color="#9B7CF5" />
          <div style={{ width: '100%' }}>
            {assessments.slice(0, 4).map((a) => (
              <div key={a.dimension} style={{ marginBottom: 9 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ color: C.t1, fontSize: 10.5 }}>{DIM_LABELS[a.dimension] ?? a.dimension}</span>
                  <span style={{ color: C.t0, fontSize: 10.5, fontFamily: mono }}>{a.score}%</span>
                </div>
                <div style={{ height: 4, background: C.b0, borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${a.score}%`, background: DIM_COLORS[a.dimension] ?? C.violet, borderRadius: 2, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ color: C.t1, fontSize: 11, fontWeight: 500, marginBottom: 2 }}>6차원 갭 분석</div>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={185}>
              <RadarChart data={radarData} margin={{ top: 4, right: 24, bottom: 4, left: 24 }}>
                <PolarGrid stroke="rgba(255,255,255,0.07)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: C.t1, fontSize: 9.5, fontFamily: font }} />
                <Radar dataKey="value" stroke="#9B7CF5" fill="#9B7CF5" fillOpacity={0.18} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 185, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.t1, fontSize: 12 }}>데이터 없음</div>
          )}
          {assessments.slice(4).map((a) => (
            <div key={a.dimension} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ color: C.t1, fontSize: 10.5 }}>{DIM_LABELS[a.dimension] ?? a.dimension}</span>
                <span style={{ color: C.t0, fontSize: 10.5, fontFamily: mono }}>{a.score}%</span>
              </div>
              <div style={{ height: 3, background: C.b0, borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${a.score}%`, background: DIM_COLORS[a.dimension] ?? C.violet, borderRadius: 2 }} />
              </div>
            </div>
          ))}
          {assessments[0]?.aiDiagnosis && (
            <div style={{ marginTop: 12, background: `${C.violet}12`, border: `1px solid ${C.violet}30`, borderRadius: 8, padding: '9px 12px', fontSize: 12, color: `${C.violet}E0`, lineHeight: 1.5 }}>
              💡 {assessments[0].aiDiagnosis}
            </div>
          )}
        </div>
      </div>

      {/* Paths */}
      {paths.length === 0 ? (
        <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '22px 20px', textAlign: 'center' }}>
          <GitBranch size={28} color={C.t2} style={{ marginBottom: 12 }} />
          <p style={{ color: C.t1, fontSize: 13, marginBottom: 16 }}>AI가 맞춤형 커리어 경로를 생성합니다</p>
          <button
            onClick={onGeneratePaths} disabled={aiLoading}
            style={{
              background: aiLoading ? C.b1 : C.violet, color: aiLoading ? C.t1 : '#fff',
              border: 'none', borderRadius: 9, padding: '10px 22px', fontSize: 13,
              fontFamily: font, fontWeight: 600, cursor: aiLoading ? 'not-allowed' : 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            {aiLoading ? <><Spinner /> 경로 생성 중…</> : <>경로 생성</>}
          </button>
        </div>
      ) : (
        <PathsView paths={paths} onSelect={onSelectPath} aiLoading={aiLoading} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Paths view
// ---------------------------------------------------------------------------
function PathsView({ paths, onSelect, aiLoading }: {
  paths: CareerPath[]; onSelect: (id: string) => void; aiLoading: boolean;
}) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ color: C.t1, fontSize: 11, fontWeight: 500, marginBottom: 14 }}>AI 추천 경로</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {paths.map((p) => (
          <div key={p.id} style={{ border: `1px solid ${p.isSelected ? C.violet + '60' : C.b1}`, borderRadius: 10, overflow: 'hidden', background: p.isSelected ? `${C.violet}08` : 'transparent' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
              <button onClick={() => setOpen(open === p.id ? null : p.id)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: font }}>
                <span style={{ color: C.t0, fontSize: 13.5, fontWeight: 600 }}>{p.name}</span>
                <span style={{ color: C.t2, fontSize: 11, fontFamily: mono }}>{p.estimatedMonths}개월</span>
                <span style={{ color: RISK_COLOR[p.riskLevel] ?? C.t1, fontSize: 11, marginLeft: 2 }}>위험 {RISK_LABEL[p.riskLevel] ?? p.riskLevel}</span>
                <ChevronRight size={12} color={C.t2} style={{ marginLeft: 'auto', transform: open === p.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {!p.isSelected && (
                <button onClick={() => onSelect(p.id)} disabled={aiLoading}
                  style={{ background: C.violet, color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 11.5, fontFamily: font, fontWeight: 600, cursor: aiLoading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                  {aiLoading ? '…' : '선택'}
                </button>
              )}
              {p.isSelected && <span style={{ color: C.teal, fontSize: 11, fontFamily: mono, whiteSpace: 'nowrap' }}>● 진행중</span>}
            </div>
            {open === p.id && (
              <div style={{ padding: '0 14px 14px 14px' }}>
                <p style={{ color: C.t1, fontSize: 12.5, marginBottom: 12, lineHeight: 1.6 }}>{p.description}</p>
                {p.phases?.map((phase) => (
                  <div key={phase.order} style={{ marginBottom: 10 }}>
                    <div style={{ color: C.t0, fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                      Phase {phase.order}: {phase.name} <span style={{ color: C.t2, fontWeight: 400 }}>({phase.durationMonths}개월)</span>
                    </div>
                    {phase.actions?.map((a) => (
                      <div key={a.order} style={{ display: 'flex', gap: 8, marginBottom: 4, paddingLeft: 10 }}>
                        <span style={{ color: C.t2, fontSize: 11 }}>·</span>
                        <span style={{ color: C.t1, fontSize: 12 }}>{a.title}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Active coaching view (has selected path)
// ---------------------------------------------------------------------------
function CoachingView({ target, paths, coachLogs, onRunCoaching, aiLoading }: {
  target: CareerTarget;
  paths: CareerPath[];
  coachLogs: CoachLog[];
  onRunCoaching: () => void;
  aiLoading: boolean;
}) {
  const activePath = paths.find((p) => p.isSelected);
  const LOG_COLOR: Record<string, string> = { checkin: C.teal, deviation_alert: C.rose, opportunity: C.amber, milestone: C.violet };
  const LOG_ICON: Record<string, string> = { checkin: '✓', deviation_alert: '⚠', opportunity: '💡', milestone: '🏆' };

  return (
    <div style={{ fontFamily: font }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ color: C.t1, fontSize: 10.5, letterSpacing: '0.6px', textTransform: 'uppercase', fontFamily: mono, marginBottom: 5 }}>AI 커리어 코치</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ color: C.t0, fontSize: 21, fontWeight: 700, letterSpacing: '-0.4px' }}>{target.title}</h1>
          <button onClick={onRunCoaching} disabled={aiLoading}
            style={{ background: C.b1, border: `1px solid ${C.b2}`, borderRadius: 8, padding: '7px 14px', color: C.t0, fontSize: 12, fontFamily: font, cursor: aiLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {aiLoading ? <Spinner /> : <RefreshCw size={13} color={C.t1} />}
            {aiLoading ? '코칭 중…' : '코칭 업데이트'}
          </button>
        </div>
        {activePath && <p style={{ color: C.t1, fontSize: 12.5, marginTop: 4 }}>경로: {activePath.name} · {activePath.estimatedMonths}개월</p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 14, marginBottom: 14 }}>
        {/* Gauge */}
        <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <CircularGauge value={target.overallReadiness} color="#9B7CF5" />
          {(target.currentAssessment ?? []).slice(0, 4).map((a) => (
            <div key={a.dimension} style={{ width: '100%', marginBottom: 5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ color: C.t1, fontSize: 10 }}>{DIM_LABELS[a.dimension] ?? a.dimension}</span>
                <span style={{ color: C.t0, fontSize: 10, fontFamily: mono }}>{a.score}%</span>
              </div>
              <div style={{ height: 3, background: C.b0, borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${a.score}%`, background: DIM_COLORS[a.dimension] ?? C.violet, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Coaching logs */}
        <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
            <Zap size={12} color={C.violet} />
            <span style={{ color: C.t1, fontSize: 11, fontWeight: 500 }}>AI 코칭 로그</span>
          </div>
          {coachLogs.length === 0 ? (
            <p style={{ color: C.t2, fontSize: 12.5 }}>아직 코칭 기록이 없어요. "코칭 업데이트"를 눌러보세요.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {coachLogs.map((log) => (
                <div key={log.id} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: `${LOG_COLOR[log.type] ?? C.violet}0E`, border: `1px solid ${LOG_COLOR[log.type] ?? C.violet}25`, borderRadius: 8 }}>
                  <span style={{ fontSize: 13 }}>{LOG_ICON[log.type] ?? '·'}</span>
                  <p style={{ color: C.t0, fontSize: 12.5, lineHeight: 1.6, flex: 1 }}>{log.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Roadmap */}
      {activePath && (
        <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ color: C.t1, fontSize: 11, fontWeight: 500, marginBottom: 14 }}>준비 로드맵 — {activePath.name}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activePath.phases?.map((phase, i) => (
              <div key={i} style={{ border: `1px solid ${i === 0 ? C.b2 : C.b0}`, borderRadius: 10, padding: '11px 14px', background: i === 0 ? `${C.violet}10` : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: i === 0 ? C.violet : C.t2, boxShadow: i === 0 ? `0 0 7px ${C.violet}` : 'none' }} />
                  <span style={{ color: i === 0 ? C.t0 : C.t1, fontSize: 13, fontWeight: i === 0 ? 600 : 400 }}>{phase.name}</span>
                  <span style={{ color: C.t2, fontSize: 11, fontFamily: mono }}>{phase.durationMonths}개월</span>
                  {i === 0 && <span style={{ marginLeft: 'auto', color: C.violet, fontSize: 10.5 }}>● 진행중</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Roadmap Tab (CAR-01)
// ---------------------------------------------------------------------------
const HORIZONS: { id: GoalHorizon; label: string; sub: string; color: string }[] = [
  { id: 'short', label: '단기', sub: '~6개월', color: '#00CCA0' },
  { id: 'mid', label: '중기', sub: '6개월~2년', color: '#3B8EF0' },
  { id: 'long', label: '장기', sub: '2년 이상', color: '#7C5CF0' },
];

function RoadmapTab() {
  const { careerGoals, target, paths, addCareerGoal, updateCareerGoal, removeCareerGoal } = useCareerStore();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [horizon, setHorizon] = useState<GoalHorizon>('short');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');

  const activePath = paths.find((p) => p.isSelected);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await addCareerGoal({ title: title.trim(), horizon, targetDate: targetDate || undefined, status: 'active', notes: notes || undefined });
    setTitle(''); setTargetDate(''); setNotes(''); setShowForm(false);
  };

  const statusIcon = (s: CareerGoal['status']) => {
    if (s === 'completed') return <CheckCircle2 size={14} color={C.teal} />;
    if (s === 'paused') return <PauseCircle size={14} color={C.t1} />;
    return <Circle size={14} color={C.sky} />;
  };

  return (
    <div>
      {/* Current target banner */}
      {target && (
        <div style={{ background: `${C.violet}10`, border: `1px solid ${C.violet}30`, borderLeft: `3px solid ${C.violet}`, borderRadius: 10, padding: '12px 16px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Target size={16} color={C.violet} />
          <div style={{ flex: 1 }}>
            <p style={{ color: C.t0, fontSize: 13, fontWeight: 600 }}>{target.title}</p>
            {activePath && <p style={{ color: C.t1, fontSize: 11, marginTop: 2 }}>선택 경로: {activePath.name} · {activePath.estimatedMonths}개월</p>}
          </div>
          <div style={{ background: `${C.violet}20`, borderRadius: 20, padding: '3px 10px' }}>
            <span style={{ color: C.violet, fontSize: 11, fontFamily: mono }}>{target.overallReadiness}% 준비</span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: C.t0, fontSize: 17, fontWeight: 700 }}>커리어 로드맵</h2>
          <p style={{ color: C.t1, fontSize: 12, marginTop: 3 }}>단기·중기·장기 목표를 설정하고 진행 상황을 추적하세요</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: `${C.violet}18`, border: `1px solid ${C.violet}40`, borderRadius: 8, color: C.violet, fontSize: 12.5, fontFamily: font, cursor: 'pointer' }}
        >
          <Plus size={13} />목표 추가
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10, padding: 16, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="목표 (예: 시니어 개발자로 승진)" required style={{ background: '#090D1F', border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, outline: 'none' }} />
          <div>
            <p style={{ color: C.t1, fontSize: 11, marginBottom: 6 }}>시간 지평</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {HORIZONS.map(({ id, label, sub, color }) => (
                <button key={id} type="button" onClick={() => setHorizon(id)}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: font, background: horizon === id ? `${color}18` : '#090D1F', border: `1px solid ${horizon === id ? color : C.b1}`, color: horizon === id ? color : C.t1 }}>
                  {label}<br /><span style={{ fontSize: 10 }}>{sub}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} placeholder="목표일 (선택)" style={{ flex: 1, background: '#090D1F', border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, colorScheme: 'dark' }} />
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="메모 (선택)" style={{ flex: 2, background: '#090D1F', border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={{ flex: 1, padding: 9, background: C.violet, color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: font, cursor: 'pointer' }}>추가</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 16px', background: '#090D1F', border: `1px solid ${C.b1}`, color: C.t1, borderRadius: 8, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>취소</button>
          </div>
        </form>
      )}

      {/* Horizon columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {HORIZONS.map(({ id, label, sub, color }) => {
          const goals = careerGoals.filter((g) => g.horizon === id);
          return (
            <div key={id} style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.b0}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                <span style={{ color: C.t0, fontSize: 13, fontWeight: 600 }}>{label}</span>
                <span style={{ color: C.t1, fontSize: 11 }}>{sub}</span>
                <span style={{ marginLeft: 'auto', color: color, fontSize: 11, fontFamily: mono }}>{goals.length}개</span>
              </div>
              <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7, minHeight: 80 }}>
                {goals.length === 0 && <p style={{ color: C.t2, fontSize: 12, padding: '8px 0' }}>목표가 없습니다</p>}
                {goals.map((g) => (
                  <div key={g.id} style={{ background: g.status === 'completed' ? `${C.teal}0A` : '#090D1F', border: `1px solid ${g.status === 'completed' ? C.teal + '30' : C.b1}`, borderRadius: 8, padding: '9px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <button onClick={() => updateCareerGoal(g.id, { status: g.status === 'completed' ? 'active' : 'completed' })} style={{ display: 'flex', cursor: 'pointer', flexShrink: 0, marginTop: 1 }}>
                        {statusIcon(g.status)}
                      </button>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: g.status === 'completed' ? C.t1 : C.t0, fontSize: 12.5, textDecoration: g.status === 'completed' ? 'line-through' : 'none', lineHeight: 1.4 }}>{g.title}</p>
                        {g.targetDate && <p style={{ color: C.t1, fontSize: 10.5, marginTop: 2, fontFamily: mono }}>{g.targetDate}</p>}
                        {g.notes && <p style={{ color: C.t1, fontSize: 11, marginTop: 3 }}>{g.notes}</p>}
                      </div>
                      <button onClick={() => removeCareerGoal(g.id)} style={{ color: C.t2, cursor: 'pointer', display: 'flex', flexShrink: 0 }}><Trash2 size={11} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI coach path phases as reference */}
      {activePath && activePath.phases && activePath.phases.length > 0 && (
        <div style={{ marginTop: 20, background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
            <MapPin size={12} color={C.violet} />
            <span style={{ color: C.t1, fontSize: 11 }}>AI 코치 선택 경로 단계 — {activePath.name}</span>
          </div>
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
            {activePath.phases.map((phase, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
                <div style={{ background: i === 0 ? `${C.violet}18` : C.bg3, border: `1px solid ${i === 0 ? C.violet + '40' : C.b1}`, borderRadius: 8, padding: '8px 12px', minWidth: 120 }}>
                  <p style={{ color: i === 0 ? C.t0 : C.t1, fontSize: 11.5, fontWeight: i === 0 ? 600 : 400 }}>{phase.name}</p>
                  <p style={{ color: C.t1, fontSize: 10, marginTop: 2, fontFamily: mono }}>{phase.durationMonths}개월</p>
                </div>
                {i < (activePath.phases?.length ?? 0) - 1 && (
                  <ChevronRight size={12} color={C.t2} style={{ flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skills Tab (CAR-02)
// ---------------------------------------------------------------------------
const SKILL_LEVELS: { value: SkillLevel; label: string; color: string }[] = [
  { value: 'beginner', label: '입문', color: C.t1 },
  { value: 'intermediate', label: '중급', color: C.sky },
  { value: 'advanced', label: '고급', color: C.blue },
  { value: 'expert', label: '전문가', color: C.violet },
];
const SKILL_CATS = ['개발', '디자인', '데이터', '관리', 'AI/ML', '언어', '기타'];

function SkillsTab() {
  const { skills, addSkill, removeSkill } = useCareerStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('개발');
  const [level, setLevel] = useState<SkillLevel>('intermediate');
  const [yearsExp, setYearsExp] = useState('');
  const [notes, setNotes] = useState('');

  const grouped = SKILL_CATS.reduce<Record<string, Skill[]>>((acc, cat) => {
    const items = skills.filter((s) => s.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});
  const other = skills.filter((s) => !SKILL_CATS.slice(0, -1).includes(s.category));
  if (other.length) grouped['기타'] = other;

  const levelInfo = (l: SkillLevel) => SKILL_LEVELS.find((x) => x.value === l) ?? SKILL_LEVELS[0];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await addSkill({ name: name.trim(), category, level, yearsExp: yearsExp ? Number(yearsExp) : undefined, notes: notes || undefined });
    setName(''); setYearsExp(''); setNotes(''); setShowForm(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: C.t0, fontSize: 17, fontWeight: 700 }}>스킬 인벤토리</h2>
          <p style={{ color: C.t1, fontSize: 12, marginTop: 3 }}>보유 기술과 역량을 카테고리별로 관리하세요</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: `${C.blue}18`, border: `1px solid ${C.blue}40`, borderRadius: 8, color: C.blue, fontSize: 12.5, fontFamily: font, cursor: 'pointer' }}
        >
          <Plus size={13} />스킬 추가
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10, padding: 16, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="스킬명 (예: React, TypeScript)" required style={{ flex: 2, background: '#090D1F', border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, outline: 'none' }} />
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ flex: 1, background: '#090D1F', border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>
              {SKILL_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <p style={{ color: C.t1, fontSize: 11, marginBottom: 6 }}>숙련도</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {SKILL_LEVELS.map(({ value, label, color }) => (
                <button key={value} type="button" onClick={() => setLevel(value)}
                  style={{ flex: 1, padding: '6px 0', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: font, background: level === value ? `${color}18` : '#090D1F', border: `1px solid ${level === value ? color : C.b1}`, color: level === value ? color : C.t1 }}
                >{label}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={yearsExp} onChange={(e) => setYearsExp(e.target.value)} placeholder="경력 연수 (선택)" inputMode="decimal" style={{ flex: 1, background: '#090D1F', border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: mono, outline: 'none' }} />
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="메모 (선택)" style={{ flex: 2, background: '#090D1F', border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={{ flex: 1, padding: 9, background: C.blue, color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: font, cursor: 'pointer' }}>추가</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 16px', background: '#090D1F', border: `1px solid ${C.b1}`, color: C.t1, borderRadius: 8, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>취소</button>
          </div>
        </form>
      )}

      {skills.length === 0 && (
        <p style={{ color: C.t2, fontSize: 13, padding: '20px 0' }}>스킬을 추가해 역량 인벤토리를 만들어보세요.</p>
      )}

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} style={{ marginBottom: 20 }}>
          <p style={{ color: C.t1, fontSize: 11, fontFamily: mono, textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 8 }}>{cat}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {items.map((s) => {
              const li = levelInfo(s.level);
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: li.color, flexShrink: 0 }} />
                  <span style={{ color: C.t0, fontSize: 13 }}>{s.name}</span>
                  <span style={{ color: li.color, fontSize: 10.5, fontFamily: mono, background: `${li.color}14`, border: `1px solid ${li.color}30`, borderRadius: 4, padding: '1px 6px' }}>{li.label}</span>
                  {s.yearsExp && <span style={{ color: C.t1, fontSize: 10.5, fontFamily: mono }}>{s.yearsExp}y</span>}
                  <button onClick={() => removeSkill(s.id)} style={{ color: C.t2, cursor: 'pointer', display: 'flex', marginLeft: 2 }}><Trash2 size={11} /></button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Achievements Tab (CAR-03)
// ---------------------------------------------------------------------------
function AchievementsTab() {
  const { achievements, aiLoading, addAchievement, removeAchievement, generateStarStory } = useCareerStore();
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [situation, setSituation] = useState('');
  const [task, setTask] = useState('');
  const [action, setAction] = useState('');
  const [result, setResult] = useState('');
  const [impact, setImpact] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // CAR-08: STAR 자소서 generation
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetRole, setTargetRole] = useState('');
  const [generatedStory, setGeneratedStory] = useState('');
  const [showGenerator, setShowGenerator] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (selectedIds.size === 0) return;
    const story = await generateStarStory(Array.from(selectedIds), targetRole);
    if (story) setGeneratedStory(story);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !situation.trim() || !task.trim() || !action.trim() || !result.trim()) return;
    await addAchievement({ title: title.trim(), situation, task, action, result, date, impact: impact || undefined });
    setTitle(''); setSituation(''); setTask(''); setAction(''); setResult(''); setImpact(''); setShowForm(false);
  };

  const starFields: { key: keyof Achievement; label: string; color: string; desc: string }[] = [
    { key: 'situation', label: 'S — Situation', color: C.sky, desc: '상황/배경' },
    { key: 'task', label: 'T — Task', color: C.blue, desc: '맡은 역할/과제' },
    { key: 'action', label: 'A — Action', color: C.violet, desc: '취한 행동' },
    { key: 'result', label: 'R — Result', color: C.teal, desc: '결과/성과' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: C.t0, fontSize: 17, fontWeight: 700 }}>업무 성과 로그</h2>
          <p style={{ color: C.t1, fontSize: 12, marginTop: 3 }}>STAR 포맷으로 성과를 기록하고 이력서/면접에 활용하세요</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: `${C.teal}18`, border: `1px solid ${C.teal}40`, borderRadius: 8, color: C.teal, fontSize: 12.5, fontFamily: font, cursor: 'pointer' }}
        >
          <Plus size={13} />성과 추가
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10, padding: 16, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="성과 제목 (예: 결제 전환율 28% 개선)" required style={{ flex: 3, background: '#090D1F', border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, outline: 'none' }} />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ flex: 1, background: '#090D1F', border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, colorScheme: 'dark' }} />
          </div>
          {starFields.map(({ key, label, color, desc }) => (
            <div key={key}>
              <p style={{ color, fontSize: 11, fontFamily: mono, marginBottom: 5 }}>{label} <span style={{ color: C.t1 }}>— {desc}</span></p>
              <textarea
                value={key === 'situation' ? situation : key === 'task' ? task : key === 'action' ? action : result}
                onChange={(e) => {
                  const v = e.target.value;
                  if (key === 'situation') setSituation(v);
                  else if (key === 'task') setTask(v);
                  else if (key === 'action') setAction(v);
                  else setResult(v);
                }}
                required rows={2} placeholder={`${desc}을 입력하세요`}
                style={{ width: '100%', background: '#090D1F', border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, outline: 'none', resize: 'vertical', lineHeight: 1.5 }}
              />
            </div>
          ))}
          <input value={impact} onChange={(e) => setImpact(e.target.value)} placeholder="수치화된 임팩트 (선택, 예: 매출 +15%, 처리시간 -40%)" style={{ background: '#090D1F', border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, outline: 'none' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={{ flex: 1, padding: 9, background: C.teal, color: '#06091A', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: font, cursor: 'pointer' }}>저장</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 16px', background: '#090D1F', border: `1px solid ${C.b1}`, color: C.t1, borderRadius: 8, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>취소</button>
          </div>
        </form>
      )}

      {achievements.length === 0 && !showForm && (
        <p style={{ color: C.t2, fontSize: 13, padding: '20px 0' }}>아직 성과 기록이 없습니다. 면접 준비를 위해 STAR 포맷으로 성과를 기록해보세요.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[...achievements].sort((a, b) => b.date.localeCompare(a.date)).map((ach) => {
          const isExpanded = expanded === ach.id;
          const isSelected = selectedIds.has(ach.id);
          return (
            <div key={ach.id} style={{ background: C.bg2, border: `1px solid ${isSelected ? `${C.violet}60` : C.b1}`, borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.15s' }}>
              <div
                onClick={() => setExpanded(isExpanded ? null : ach.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer' }}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSelect(ach.id); }}
                  title="자소서 생성에 포함"
                  style={{
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                    background: isSelected ? C.violet : 'transparent',
                    border: `1.5px solid ${isSelected ? C.violet : C.t2}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}
                >
                  {isSelected && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✓</span>}
                </button>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: `${C.teal}14`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={16} color={C.teal} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: C.t0, fontSize: 13.5, fontWeight: 600 }}>{ach.title}</p>
                  <p style={{ color: C.t1, fontSize: 11, marginTop: 2 }}>
                    {ach.date}
                    {ach.impact && <span style={{ color: C.teal, marginLeft: 8, fontFamily: mono }}>{ach.impact}</span>}
                  </p>
                </div>
                <ChevronRight size={14} color={C.t1} style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                <button onClick={(e) => { e.stopPropagation(); removeAchievement(ach.id); }} style={{ color: C.t2, cursor: 'pointer', display: 'flex' }}><Trash2 size={13} /></button>
              </div>
              {isExpanded && (
                <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10, borderTop: `1px solid ${C.b0}` }}>
                  {starFields.map(({ key, label, color }) => (
                    <div key={key}>
                      <p style={{ color, fontSize: 10.5, fontFamily: mono, marginBottom: 4 }}>{label}</p>
                      <p style={{ color: C.t0, fontSize: 12.5, lineHeight: 1.6 }}>{String(ach[key as keyof Achievement] ?? '')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CAR-08: STAR 자소서 Generator */}
      {achievements.length > 0 && (
        <div style={{ marginTop: 24, background: C.bg2, border: `1px solid ${C.violet}30`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Zap size={14} color={C.violet} />
            <span style={{ color: C.t0, fontSize: 13.5, fontWeight: 700 }}>AI 자소서 생성</span>
            <span style={{ color: C.t1, fontSize: 11, marginLeft: 4 }}>
              {selectedIds.size > 0 ? `${selectedIds.size}개 성과 선택됨` : '위 성과를 체크하여 선택'}
            </span>
            <button
              onClick={() => setShowGenerator(!showGenerator)}
              style={{ marginLeft: 'auto', color: C.t1, cursor: 'pointer', fontSize: 11, fontFamily: font }}
            >
              {showGenerator ? '접기' : '펼치기'}
            </button>
          </div>

          {showGenerator && (
            <>
              <input
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="지원 포지션 / 회사 (예: 카카오 프론트엔드 엔지니어)"
                style={{
                  width: '100%', background: C.bg3, border: `1px solid ${C.b1}`, borderRadius: 8,
                  padding: '9px 12px', color: C.t0, fontSize: 13, fontFamily: font,
                  outline: 'none', boxSizing: 'border-box', marginBottom: 10,
                }}
              />
              <button
                onClick={handleGenerate}
                disabled={aiLoading || selectedIds.size === 0}
                style={{
                  width: '100%', padding: '11px', borderRadius: 9, fontSize: 13.5, fontWeight: 600,
                  fontFamily: font, cursor: aiLoading || selectedIds.size === 0 ? 'not-allowed' : 'pointer',
                  background: aiLoading || selectedIds.size === 0 ? C.b1 : C.violet,
                  color: aiLoading || selectedIds.size === 0 ? C.t1 : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  marginBottom: generatedStory ? 12 : 0,
                }}
              >
                {aiLoading ? <><Spinner /> 생성 중…</> : <><Zap size={14} />자소서 생성</>}
              </button>

              {generatedStory && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ color: C.t1, fontSize: 11, marginBottom: 6 }}>생성된 자소서 — 복사하여 수정하세요</p>
                  <textarea
                    readOnly
                    value={generatedStory}
                    style={{
                      width: '100%', minHeight: 200, background: C.bg3,
                      border: `1px solid ${C.b1}`, borderRadius: 8,
                      padding: '12px', color: C.t0, fontSize: 13, fontFamily: font,
                      lineHeight: 1.7, resize: 'vertical', boxSizing: 'border-box',
                    }}
                  />
                  <button
                    onClick={() => navigator.clipboard?.writeText(generatedStory)}
                    style={{ marginTop: 6, color: C.violet, fontSize: 11.5, fontFamily: font, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    복사
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI Coach Tab (existing wizard wrapped)
// ---------------------------------------------------------------------------
function CoachTab() {
  const { target, paths, coachLogs, loading, aiLoading, profileTarget, assessState, generatePaths, selectPath, runCoaching } = useCareerStore();

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.t1, fontFamily: font, padding: '40px 0' }}><Spinner /> 불러오는 중…</div>;
  }
  if (!target) return <SetupStep onSubmit={profileTarget} loading={aiLoading} />;
  const hasAssessment = (target.currentAssessment?.length ?? 0) > 0;
  if (!hasAssessment) return <AssessStep target={target} onSubmit={assessState} loading={aiLoading} />;
  const hasActivePath = paths.some((p) => p.isSelected) || !!target.selectedPathId;
  return hasActivePath
    ? <CoachingView target={target} paths={paths} coachLogs={coachLogs} onRunCoaching={runCoaching} aiLoading={aiLoading} />
    : <AssessmentView target={target} paths={paths} onGeneratePaths={generatePaths} onSelectPath={selectPath} aiLoading={aiLoading} />;
}

// ---------------------------------------------------------------------------
// Pipeline Tab (CAR-05)
// ---------------------------------------------------------------------------
const STAGE_META: Record<JobStage, { label: string; color: string }> = {
  research:  { label: '리서치',  color: C.t1 },
  applied:   { label: '지원',    color: C.sky },
  screening: { label: '서류',    color: C.blue },
  interview: { label: '면접',    color: C.violet },
  offer:     { label: '오퍼',    color: C.amber },
  accepted:  { label: '합격',    color: C.teal },
  rejected:  { label: '불합격',  color: C.rose },
};

function PipelineTab() {
  const { jobApplications, addJobApplication, updateJobApplication, removeJobApplication } = useCareerStore();
  const { isMobile } = useWindowSize();
  const inp: React.CSSProperties = {
    background: C.bg3, border: `1px solid ${C.b1}`, borderRadius: 8,
    padding: '9px 12px', color: C.t0, fontSize: 13.5, fontFamily: font,
    outline: 'none', width: '100%', boxSizing: 'border-box',
  };
  const sel: React.CSSProperties = { ...inp, cursor: 'pointer' };

  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [stage, setStage] = useState<JobStage>('research');
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !position.trim()) return;
    await addJobApplication({ company: company.trim(), position: position.trim(), stage, notes: notes.trim() || undefined });
    setCompany(''); setPosition(''); setNotes(''); setStage('research');
    if (isMobile) setShowForm(false);
  };

  const activeStages: JobStage[] = ['research', 'applied', 'screening', 'interview', 'offer'];
  const activeApps = jobApplications.filter((j) => activeStages.includes(j.stage));
  const accepted = jobApplications.filter((j) => j.stage === 'accepted').length;
  const rejected = jobApplications.filter((j) => j.stage === 'rejected').length;

  const AppForm = (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="회사명" style={inp} />
      <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="포지션" style={inp} />
      <select value={stage} onChange={(e) => setStage(e.target.value as JobStage)} style={sel}>
        {(Object.keys(STAGE_META) as JobStage[]).map((s) => (
          <option key={s} value={s}>{STAGE_META[s].label}</option>
        ))}
      </select>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="메모 (선택)" rows={2}
        style={{ ...inp, resize: 'vertical' }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" style={{ flex: 1, padding: '9px', background: C.amber, color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: font, cursor: 'pointer' }}>추가</button>
        {isMobile && <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 14px', background: C.bg2, border: `1px solid ${C.b1}`, color: C.t1, borderRadius: 8, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>취소</button>}
      </div>
    </form>
  );

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {activeStages.map((s) => {
          const apps = jobApplications.filter((j) => j.stage === s);
          return (
            <div key={s} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: STAGE_META[s].color }} />
                <span style={{ color: STAGE_META[s].color, fontSize: 12.5, fontWeight: 600 }}>{STAGE_META[s].label}</span>
                <span style={{ color: C.t2, fontSize: 11, fontFamily: mono }}>({apps.length})</span>
              </div>
              {apps.map((app) => (
                <div key={app.id} style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: C.t0, fontSize: 13.5, fontWeight: 600 }}>{app.company}</div>
                    <div style={{ color: C.t1, fontSize: 12.5, marginTop: 2 }}>{app.position}</div>
                    {app.notes && <div style={{ color: C.t2, fontSize: 11.5, marginTop: 4 }}>{app.notes}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <select
                      value={app.stage}
                      onChange={(e) => updateJobApplication(app.id, { stage: e.target.value as JobStage })}
                      style={{ background: C.bg3, border: `1px solid ${C.b1}`, borderRadius: 6, padding: '4px 8px', color: STAGE_META[app.stage].color, fontSize: 11.5, fontFamily: font, cursor: 'pointer' }}
                    >
                      {(Object.keys(STAGE_META) as JobStage[]).map((st) => (
                        <option key={st} value={st}>{STAGE_META[st].label}</option>
                      ))}
                    </select>
                    <button onClick={() => removeJobApplication(app.id)} style={{ color: C.t2, cursor: 'pointer', display: 'flex' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {apps.length === 0 && <p style={{ color: C.t2, fontSize: 12, paddingLeft: 16, marginBottom: 4 }}>없음</p>}
            </div>
          );
        })}

        {isMobile && !showForm && (
          <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer', padding: '8px 0' }}>
            <Plus size={14} />지원 추가
          </button>
        )}
        {isMobile && showForm && AppForm}
      </div>

      {!isMobile && (
        <div style={{ width: 272, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ color: C.t1, fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 12 }}>파이프라인 현황</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: '진행 중', value: activeApps.length, color: C.amber },
                { label: '합격', value: accepted, color: C.teal },
                { label: '불합격', value: rejected, color: C.rose },
                { label: '전체', value: jobApplications.length, color: C.sky },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: C.bg1, borderRadius: 9, padding: '10px 12px' }}>
                  <div style={{ color, fontSize: 18, fontWeight: 700, fontFamily: mono }}>{value}</div>
                  <div style={{ color: C.t1, fontSize: 11, marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ color: C.t1, fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 12 }}>지원 추가</p>
            {AppForm}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Journal Tab (CAR-10)
// ---------------------------------------------------------------------------
const MOOD_META = [
  { value: 1 as const, icon: Frown, label: '힘든', color: C.rose },
  { value: 2 as const, icon: Frown, label: '지침', color: C.amber },
  { value: 3 as const, icon: Meh, label: '보통', color: C.t1 },
  { value: 4 as const, icon: Smile, label: '좋음', color: C.sky },
  { value: 5 as const, icon: Smile, label: '최고', color: C.teal },
];

function JournalTab() {
  const { growthJournals, addGrowthJournal, removeGrowthJournal } = useCareerStore();
  const { isMobile } = useWindowSize();
  const inp: React.CSSProperties = {
    background: C.bg3, border: `1px solid ${C.b1}`, borderRadius: 8,
    padding: '9px 12px', color: C.t0, fontSize: 13.5, fontFamily: font,
    outline: 'none', width: '100%', boxSizing: 'border-box',
  };
  const ta: React.CSSProperties = { ...inp, resize: 'vertical' };

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [lessons, setLessons] = useState('');
  const [challenges, setChallenges] = useState('');
  const [wins, setWins] = useState('');
  const [goalsNext, setGoalsNext] = useState('');
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessons.trim() || !challenges.trim()) return;
    await addGrowthJournal({ date, lessonsLearned: lessons.trim(), challenges: challenges.trim(), wins: wins.trim() || undefined, goalsNextWeek: goalsNext.trim() || undefined, mood });
    setLessons(''); setChallenges(''); setWins(''); setGoalsNext(''); setMood(3); setDate(today);
    if (isMobile) setShowForm(false);
  };

  const JournalForm = (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
        style={{ ...inp, colorScheme: 'dark' }} />
      <div>
        <label style={{ color: C.t1, fontSize: 11, display: 'block', marginBottom: 5 }}>기분</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {MOOD_META.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMood(m.value)}
              style={{
                flex: 1, padding: '6px 0', borderRadius: 8, fontSize: 10, fontFamily: font, cursor: 'pointer',
                background: mood === m.value ? `${m.color}22` : C.bg3,
                border: `1px solid ${mood === m.value ? m.color : C.b1}`,
                color: mood === m.value ? m.color : C.t2,
              }}
            >{m.label}</button>
          ))}
        </div>
      </div>
      <textarea value={lessons} onChange={(e) => setLessons(e.target.value)} placeholder="이번 주 배운 점 *" rows={2} style={ta} />
      <textarea value={challenges} onChange={(e) => setChallenges(e.target.value)} placeholder="챌린지/어려웠던 점 *" rows={2} style={ta} />
      <textarea value={wins} onChange={(e) => setWins(e.target.value)} placeholder="성과/좋았던 점 (선택)" rows={2} style={ta} />
      <textarea value={goalsNext} onChange={(e) => setGoalsNext(e.target.value)} placeholder="다음 주 목표 (선택)" rows={2} style={ta} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" style={{ flex: 1, padding: '9px', background: C.violet, color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: font, cursor: 'pointer' }}>저장</button>
        {isMobile && <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 14px', background: C.bg2, border: `1px solid ${C.b1}`, color: C.t1, borderRadius: 8, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>취소</button>}
      </div>
    </form>
  );

  const sorted = [...growthJournals].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {sorted.map((j) => {
          const moodMeta = MOOD_META.find((m) => m.value === j.mood) ?? MOOD_META[2];
          const isOpen = expanded === j.id;
          return (
            <div key={j.id} style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, marginBottom: 10 }}>
              <button
                onClick={() => setExpanded(isOpen ? null : j.id)}
                style={{ width: '100%', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
              >
                <span style={{ color: moodMeta.color, fontSize: 11, fontWeight: 600, background: `${moodMeta.color}18`, borderRadius: 5, padding: '2px 8px' }}>{moodMeta.label}</span>
                <span style={{ color: C.t0, fontSize: 13.5, fontWeight: 600, flex: 1, textAlign: 'left' }}>{j.date}</span>
                <ChevronRight size={13} color={C.t1} style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>
              {isOpen && (
                <div style={{ padding: '0 14px 14px' }}>
                  <div style={{ color: C.t2, fontSize: 11, marginBottom: 6, display: 'flex', gap: 10 }}>
                    <span>💡 배운 점</span>
                  </div>
                  <p style={{ color: C.t0, fontSize: 13, marginBottom: 10 }}>{j.lessonsLearned}</p>
                  <div style={{ color: C.t2, fontSize: 11, marginBottom: 6 }}>⚠️ 챌린지</div>
                  <p style={{ color: C.t0, fontSize: 13, marginBottom: j.wins ? 10 : 0 }}>{j.challenges}</p>
                  {j.wins && (
                    <>
                      <div style={{ color: C.t2, fontSize: 11, marginBottom: 6, marginTop: 6 }}>🎉 성과</div>
                      <p style={{ color: C.t0, fontSize: 13 }}>{j.wins}</p>
                    </>
                  )}
                  {j.goalsNextWeek && (
                    <>
                      <div style={{ color: C.t2, fontSize: 11, marginBottom: 6, marginTop: 6 }}>🎯 다음 주 목표</div>
                      <p style={{ color: C.t0, fontSize: 13 }}>{j.goalsNextWeek}</p>
                    </>
                  )}
                  <button onClick={() => removeGrowthJournal(j.id)} style={{ color: C.rose, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, marginTop: 10 }}>
                    <Trash2 size={11} />삭제
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {sorted.length === 0 && (
          <p style={{ color: C.t2, fontSize: 13, padding: '30px 0' }}>성장 저널이 없습니다. 첫 회고를 작성해보세요!</p>
        )}

        {isMobile && !showForm && (
          <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer', padding: '8px 0', marginTop: 8 }}>
            <Plus size={14} />새 회고 작성
          </button>
        )}
        {isMobile && showForm && JournalForm}
      </div>

      {!isMobile && (
        <div style={{ width: 272, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ color: C.t1, fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 12 }}>회고 현황</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: '총 회고', value: growthJournals.length, color: C.violet },
                { label: '이번 달', value: growthJournals.filter((j) => j.date.startsWith(new Date().toISOString().slice(0, 7))).length, color: C.sky },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: C.bg1, borderRadius: 9, padding: '10px 12px' }}>
                  <div style={{ color, fontSize: 18, fontWeight: 700, fontFamily: mono }}>{value}</div>
                  <div style={{ color: C.t1, fontSize: 11, marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ color: C.t1, fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 12 }}>새 회고</p>
            {JournalForm}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Certifications Tab (CAR-11)
// ---------------------------------------------------------------------------
const CERT_STATUS_META: Record<CertStatus, { label: string; color: string }> = {
  planned:  { label: '계획', color: C.t1 },
  studying: { label: '준비 중', color: C.amber },
  obtained: { label: '취득', color: C.teal },
  expired:  { label: '만료', color: C.rose },
};

function CertsTab() {
  const { certifications, addCertification, updateCertification, removeCertification } = useCareerStore();
  const { isMobile } = useWindowSize();
  const inp: React.CSSProperties = {
    background: C.bg3, border: `1px solid ${C.b1}`, borderRadius: 8,
    padding: '9px 12px', color: C.t0, fontSize: 13.5, fontFamily: font,
    outline: 'none', width: '100%', boxSizing: 'border-box',
  };
  const sel: React.CSSProperties = { ...inp, cursor: 'pointer' };

  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [status, setStatus] = useState<CertStatus>('planned');
  const [obtainedDate, setObtainedDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !issuer.trim()) return;
    await addCertification({ name: name.trim(), issuer: issuer.trim(), status, obtainedDate: obtainedDate || undefined, expiryDate: expiryDate || undefined });
    setName(''); setIssuer(''); setStatus('planned'); setObtainedDate(''); setExpiryDate('');
    if (isMobile) setShowForm(false);
  };

  const CertForm = (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="자격증명 (예: AWS SAA)" style={inp} />
      <input value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder="발급 기관" style={inp} />
      <select value={status} onChange={(e) => setStatus(e.target.value as CertStatus)} style={sel}>
        {(Object.keys(CERT_STATUS_META) as CertStatus[]).map((s) => (
          <option key={s} value={s}>{CERT_STATUS_META[s].label}</option>
        ))}
      </select>
      {(status === 'obtained' || status === 'expired') && (
        <input type="date" value={obtainedDate} onChange={(e) => setObtainedDate(e.target.value)}
          placeholder="취득일" style={{ ...inp, colorScheme: 'dark' }} />
      )}
      {(status === 'obtained' || status === 'expired') && (
        <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
          placeholder="만료일" style={{ ...inp, colorScheme: 'dark' }} />
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" style={{ flex: 1, padding: '9px', background: C.teal, color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: font, cursor: 'pointer' }}>추가</button>
        {isMobile && <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 14px', background: C.bg2, border: `1px solid ${C.b1}`, color: C.t1, borderRadius: 8, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>취소</button>}
      </div>
    </form>
  );

  const byStatus = (Object.keys(CERT_STATUS_META) as CertStatus[]).map((s) => ({
    s,
    certs: certifications.filter((c) => c.status === s),
  })).filter(({ certs }) => certs.length > 0);

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {certifications.length === 0 && (
          <p style={{ color: C.t2, fontSize: 13, padding: '30px 0' }}>자격증이 없습니다. 취득했거나 준비 중인 자격증을 추가해보세요.</p>
        )}
        {byStatus.map(({ s, certs }) => (
          <div key={s} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: CERT_STATUS_META[s].color }} />
              <span style={{ color: CERT_STATUS_META[s].color, fontSize: 12.5, fontWeight: 600 }}>{CERT_STATUS_META[s].label}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {certs.map((cert) => (
                <div key={cert.id} style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '14px 16px', position: 'relative' }}>
                  <div style={{ color: C.t0, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{cert.name}</div>
                  <div style={{ color: C.t1, fontSize: 12.5, marginBottom: 8 }}>{cert.issuer}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <select
                      value={cert.status}
                      onChange={(e) => updateCertification(cert.id, { status: e.target.value as CertStatus })}
                      style={{ background: C.bg3, border: `1px solid ${C.b1}`, borderRadius: 6, padding: '4px 8px', color: CERT_STATUS_META[cert.status].color, fontSize: 11.5, fontFamily: font, cursor: 'pointer' }}
                    >
                      {(Object.keys(CERT_STATUS_META) as CertStatus[]).map((st) => (
                        <option key={st} value={st}>{CERT_STATUS_META[st].label}</option>
                      ))}
                    </select>
                    {cert.obtainedDate && <span style={{ color: C.t2, fontSize: 10.5, fontFamily: mono }}>{cert.obtainedDate}</span>}
                    <button onClick={() => removeCertification(cert.id)} style={{ color: C.t2, cursor: 'pointer', display: 'flex', marginLeft: 'auto' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {cert.expiryDate && (
                    <div style={{ color: cert.status === 'expired' ? C.rose : C.t2, fontSize: 10.5, marginTop: 6, fontFamily: mono }}>
                      만료: {cert.expiryDate}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {isMobile && !showForm && (
          <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer', padding: '8px 0', marginTop: 8 }}>
            <Plus size={14} />자격증 추가
          </button>
        )}
        {isMobile && showForm && CertForm}
      </div>

      {!isMobile && (
        <div style={{ width: 272, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ color: C.t1, fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 12 }}>자격증 현황</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(Object.keys(CERT_STATUS_META) as CertStatus[]).map((s) => {
                const count = certifications.filter((c) => c.status === s).length;
                return (
                  <div key={s} style={{ background: C.bg1, borderRadius: 9, padding: '10px 12px' }}>
                    <div style={{ color: CERT_STATUS_META[s].color, fontSize: 18, fontWeight: 700, fontFamily: mono }}>{count}</div>
                    <div style={{ color: C.t1, fontSize: 11, marginTop: 2 }}>{CERT_STATUS_META[s].label}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ color: C.t1, fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 12 }}>자격증 추가</p>
            {CertForm}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CAR-07: WorklifeTab — 워라밸 탭
// ---------------------------------------------------------------------------
function WorklifeTab() {
  const { workLogs, addWorkLog, removeWorkLog } = useCareerStore();
  const { isMobile } = useWindowSize();
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], startTime: '09:00', endTime: '18:00', breakMinutes: 60, notes: '' });
  const [saving, setSaving] = useState(false);

  const calcHours = (start: string, end: string, brk: number) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return Math.max(0, (eh * 60 + em - sh * 60 - sm - brk) / 60);
  };

  const getWeekKey = (date: string) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    return mon.toISOString().split('T')[0];
  };

  const weeklyData = (() => {
    const map: Record<string, number> = {};
    workLogs.forEach((w) => {
      const wk = getWeekKey(w.date);
      map[wk] = (map[wk] ?? 0) + calcHours(w.startTime, w.endTime, w.breakMinutes);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([week, hours]) => ({
        label: `${week.slice(5, 7)}/${week.slice(8, 10)}주`,
        regular: Math.min(hours, 40),
        overtime: Math.max(0, Math.min(hours, 52) - 40),
        excess: Math.max(0, hours - 52),
        total: hours,
      }));
  })();

  const thisWeek = weeklyData[weeklyData.length - 1]?.total ?? 0;
  const burnout = Math.min(100, Math.round((thisWeek / 52) * 100));
  const burnoutColor = thisWeek >= 52 ? C.rose : thisWeek >= 40 ? C.amber : C.teal;

  const monthlyAvg = (() => {
    if (!workLogs.length) return 0;
    const now = new Date();
    const month = now.toISOString().slice(0, 7);
    const monthLogs = workLogs.filter((w) => w.date.startsWith(month));
    if (!monthLogs.length) return 0;
    const totalH = monthLogs.reduce((s, w) => s + calcHours(w.startTime, w.endTime, w.breakMinutes), 0);
    const weeks = Math.ceil(monthLogs.length / 5);
    return +(totalH / Math.max(1, weeks)).toFixed(1);
  })();

  const inp: React.CSSProperties = { background: C.bg3, border: `1px solid ${C.b1}`, borderRadius: 7, padding: '8px 10px', color: C.t0, fontSize: 13, fontFamily: font, outline: 'none', width: '100%', boxSizing: 'border-box' };

  const handleAdd = async () => {
    setSaving(true);
    try { await addWorkLog({ ...form }); setForm((f) => ({ ...f, notes: '' })); } finally { setSaving(false); }
  };

  const LogForm = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div><label style={{ color: C.t1, fontSize: 11, display: 'block', marginBottom: 5 }}>날짜</label><input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} style={inp} /></div>
        <div><label style={{ color: C.t1, fontSize: 11, display: 'block', marginBottom: 5 }}>휴게(분)</label><input type="number" value={form.breakMinutes} onChange={(e) => setForm((f) => ({ ...f, breakMinutes: Number(e.target.value) }))} style={inp} /></div>
        <div><label style={{ color: C.t1, fontSize: 11, display: 'block', marginBottom: 5 }}>출근</label><input type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} style={inp} /></div>
        <div><label style={{ color: C.t1, fontSize: 11, display: 'block', marginBottom: 5 }}>퇴근</label><input type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} style={inp} /></div>
      </div>
      <div><label style={{ color: C.t1, fontSize: 11, display: 'block', marginBottom: 5 }}>메모</label><input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="오늘 작업 요약 (선택)" style={inp} /></div>
      <button onClick={() => void handleAdd()} disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 8, background: `${C.teal}20`, border: `1px solid ${C.teal}50`, color: C.teal, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>
        <Plus size={14} />{saving ? '저장 중…' : '기록 추가'}
      </button>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Burnout gauge + stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { label: '이번 주', value: `${thisWeek.toFixed(1)}h`, color: burnoutColor, sub: thisWeek >= 52 ? '⚠ 52h 초과' : `${(52 - thisWeek).toFixed(1)}h 여유` },
            { label: '번아웃 지수', value: `${burnout}%`, color: burnoutColor, sub: burnout >= 100 ? '경고' : burnout >= 77 ? '주의' : '양호' },
            { label: '이번 달 주평균', value: `${monthlyAvg}h`, color: C.sky, sub: '주간 평균' },
          ].map((s) => (
            <div key={s.label} style={{ background: C.bg2, border: `1px solid ${s.color}30`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ color: C.t1, fontSize: 11, marginBottom: 6 }}>{s.label}</div>
              <div style={{ color: s.color, fontSize: 22, fontWeight: 700, fontFamily: mono }}>{s.value}</div>
              <div style={{ color: C.t1, fontSize: 11, marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Weekly trend chart */}
        {weeklyData.length > 0 && (
          <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <TrendingUp size={14} color={C.teal} />
              <span style={{ color: C.t0, fontSize: 13, fontWeight: 600 }}>주간 근무 트렌드</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
                {[{ color: C.teal, label: '정규' }, { color: C.amber, label: '연장' }, { color: C.rose, label: '초과' }].map((l) => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
                    <span style={{ color: C.t1, fontSize: 10 }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData} barSize={14} barGap={1}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.b0} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: C.t1, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.t1, fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 60]} unit="h" width={32} />
                <Tooltip contentStyle={{ background: C.bg3, border: `1px solid ${C.b1}`, borderRadius: 8, fontFamily: font, fontSize: 12 }} labelStyle={{ color: C.t0 }} itemStyle={{ color: C.t1 }} formatter={(v) => typeof v === 'number' ? `${v.toFixed(1)}h` : String(v)} />
                <Bar dataKey="regular" stackId="a" fill={C.teal} radius={[0, 0, 0, 0]} />
                <Bar dataKey="overtime" stackId="a" fill={C.amber} />
                <Bar dataKey="excess" stackId="a" fill={C.rose} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Log list */}
        <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.b0}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={13} color={C.teal} />
            <span style={{ color: C.t0, fontSize: 13, fontWeight: 600 }}>근무 기록</span>
            <span style={{ marginLeft: 'auto', color: C.t1, fontSize: 11, fontFamily: mono }}>{workLogs.length}건</span>
          </div>
          {workLogs.length === 0 && <div style={{ padding: '24px 16px', color: C.t1, fontSize: 13, textAlign: 'center' }}>기록이 없습니다</div>}
          {workLogs.slice(0, 20).map((w) => {
            const h = calcHours(w.startTime, w.endTime, w.breakMinutes);
            const over = h > 52 / 5;
            return (
              <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderTop: `1px solid ${C.b0}` }}>
                {over && <AlertTriangle size={12} color={C.rose} style={{ flexShrink: 0 }} />}
                {!over && <Clock size={12} color={C.t1} style={{ flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: C.t0, fontSize: 13 }}>{w.date} <span style={{ color: C.t1, fontSize: 11 }}>{w.startTime}–{w.endTime}</span></div>
                  {w.notes && <div style={{ color: C.t1, fontSize: 11, marginTop: 2 }}>{w.notes}</div>}
                </div>
                <span style={{ color: over ? C.rose : C.teal, fontSize: 13, fontWeight: 600, fontFamily: mono, flexShrink: 0 }}>{h.toFixed(1)}h</span>
                <button onClick={() => void removeWorkLog(w.id)} style={{ color: C.t1, cursor: 'pointer', display: 'flex', flexShrink: 0 }}><Trash2 size={13} /></button>
              </div>
            );
          })}
        </div>

        {isMobile && LogForm}
      </div>

      {!isMobile && (
        <div style={{ width: 272, flexShrink: 0 }}>
          <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ color: C.t1, fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 12 }}>근무 기록 추가</p>
            {LogForm}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CAR-06: SalaryTab — 급여 트래커
// ---------------------------------------------------------------------------
function SalaryTab() {
  const { salaryRecords, addSalaryRecord, removeSalaryRecord } = useCareerStore();
  const { isMobile } = useWindowSize();
  const [form, setForm] = useState({ year: new Date().getFullYear(), company: '', baseSalary: 0, incentive: 0, notes: '' });
  const [deductInsurance, setDeductInsurance] = useState(false);
  const [saving, setSaving] = useState(false);

  const INSURANCE_RATE = 0.094;
  const netPackage = (base: number, inc: number) => {
    const gross = base + inc;
    return deductInsurance ? gross * (1 - INSURANCE_RATE) : gross;
  };

  const chartData = salaryRecords.map((r, i) => ({
    year: String(r.year),
    연봉: r.baseSalary,
    인센티브: r.incentive,
    yoy: i > 0 ? +(((r.baseSalary - salaryRecords[i - 1].baseSalary) / salaryRecords[i - 1].baseSalary) * 100).toFixed(1) : null,
  }));

  const inp: React.CSSProperties = { background: C.bg3, border: `1px solid ${C.b1}`, borderRadius: 7, padding: '8px 10px', color: C.t0, fontSize: 13, fontFamily: font, outline: 'none', width: '100%', boxSizing: 'border-box' };

  const handleAdd = async () => {
    if (!form.company || !form.baseSalary) return;
    setSaving(true);
    try { await addSalaryRecord({ ...form }); setForm((f) => ({ ...f, company: '', baseSalary: 0, incentive: 0, notes: '' })); } finally { setSaving(false); }
  };

  const SalaryForm = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div><label style={{ color: C.t1, fontSize: 11, display: 'block', marginBottom: 5 }}>연도</label><input type="number" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))} style={inp} /></div>
        <div><label style={{ color: C.t1, fontSize: 11, display: 'block', marginBottom: 5 }}>회사명</label><input value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} placeholder="회사명" style={inp} /></div>
        <div><label style={{ color: C.t1, fontSize: 11, display: 'block', marginBottom: 5 }}>기본급 (만원)</label><input type="number" value={form.baseSalary || ''} onChange={(e) => setForm((f) => ({ ...f, baseSalary: Number(e.target.value) }))} style={inp} /></div>
        <div><label style={{ color: C.t1, fontSize: 11, display: 'block', marginBottom: 5 }}>인센티브 (만원)</label><input type="number" value={form.incentive || ''} onChange={(e) => setForm((f) => ({ ...f, incentive: Number(e.target.value) }))} style={inp} /></div>
      </div>
      <div><label style={{ color: C.t1, fontSize: 11, display: 'block', marginBottom: 5 }}>메모 (시장 비교)</label><input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="시장 평균 대비, 복리후생 등" style={inp} /></div>
      <button onClick={() => void handleAdd()} disabled={saving || !form.company || !form.baseSalary} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 8, background: form.company && form.baseSalary ? `${C.amber}20` : C.bg3, border: `1px solid ${form.company && form.baseSalary ? `${C.amber}50` : C.b1}`, color: form.company && form.baseSalary ? C.amber : C.t1, fontSize: 13, fontFamily: font, cursor: form.company && form.baseSalary ? 'pointer' : 'default' }}>
        <Plus size={14} />{saving ? '저장 중…' : '기록 추가'}
      </button>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Summary cards */}
        {salaryRecords.length > 0 && (() => {
          const latest = salaryRecords[salaryRecords.length - 1];
          const prev = salaryRecords.length > 1 ? salaryRecords[salaryRecords.length - 2] : null;
          const growth = prev ? +(((latest.baseSalary - prev.baseSalary) / prev.baseSalary) * 100).toFixed(1) : null;
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: '현재 기본급', value: `${latest.baseSalary.toLocaleString()}만`, color: C.amber },
                { label: 'YoY 성장률', value: growth != null ? `${growth > 0 ? '+' : ''}${growth}%` : '—', color: growth != null && growth > 0 ? C.teal : C.rose },
                { label: `연간 패키지${deductInsurance ? ' (세후)' : ''}`, value: `${Math.round(netPackage(latest.baseSalary, latest.incentive)).toLocaleString()}만`, color: C.sky },
              ].map((s) => (
                <div key={s.label} style={{ background: C.bg2, border: `1px solid ${s.color}30`, borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ color: C.t1, fontSize: 11, marginBottom: 6 }}>{s.label}</div>
                  <div style={{ color: s.color, fontSize: 22, fontWeight: 700, fontFamily: mono }}>{s.value}</div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Chart */}
        {chartData.length > 0 && (
          <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <TrendingUp size={14} color={C.amber} />
              <span style={{ color: C.t0, fontSize: 13, fontWeight: 600 }}>연봉 성장 추이</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
                {[{ color: C.amber, label: '기본급' }, { color: C.sky, label: '인센티브' }].map((l) => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
                    <span style={{ color: C.t1, fontSize: 10 }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barSize={18} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.b0} vertical={false} />
                <XAxis dataKey="year" tick={{ fill: C.t1, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.t1, fontSize: 10 }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `${(v / 1000).toFixed(0)}천`} />
                <Tooltip contentStyle={{ background: C.bg3, border: `1px solid ${C.b1}`, borderRadius: 8, fontFamily: font, fontSize: 12 }} labelStyle={{ color: C.t0 }} itemStyle={{ color: C.t1 }} formatter={(v) => typeof v === 'number' ? `${v.toLocaleString()}만원` : String(v)} />
                <Bar dataKey="연봉" fill={C.amber} radius={[0, 0, 0, 0]} />
                <Bar dataKey="인센티브" fill={C.sky} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Salary list */}
        <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.b0}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarSign size={13} color={C.amber} />
            <span style={{ color: C.t0, fontSize: 13, fontWeight: 600 }}>연봉 이력</span>
            <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={deductInsurance} onChange={(e) => setDeductInsurance(e.target.checked)} />
              <span style={{ color: C.t1, fontSize: 11 }}>4대보험 공제</span>
            </label>
          </div>
          {salaryRecords.length === 0 && <div style={{ padding: '24px 16px', color: C.t1, fontSize: 13, textAlign: 'center' }}>기록이 없습니다</div>}
          {[...salaryRecords].reverse().map((r, i, arr) => {
            const prev = arr[i + 1];
            const growth = prev ? +(((r.baseSalary - prev.baseSalary) / prev.baseSalary) * 100).toFixed(1) : null;
            return (
              <div key={r.id} style={{ padding: '12px 16px', borderTop: `1px solid ${C.b0}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: C.t0, fontSize: 13, fontWeight: 600 }}>{r.year}년</span>
                      <span style={{ color: C.t1, fontSize: 12 }}>{r.company}</span>
                      {growth != null && (
                        <span style={{ color: growth > 0 ? C.teal : C.rose, fontSize: 11, fontFamily: mono }}>{growth > 0 ? '+' : ''}{growth}%</span>
                      )}
                    </div>
                    {r.notes && <div style={{ color: C.t1, fontSize: 11, marginTop: 3 }}>{r.notes}</div>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ color: C.amber, fontSize: 14, fontWeight: 700, fontFamily: mono }}>{r.baseSalary.toLocaleString()}만</div>
                    {r.incentive > 0 && <div style={{ color: C.t1, fontSize: 11 }}>+인센 {r.incentive.toLocaleString()}만</div>}
                    {deductInsurance && <div style={{ color: C.sky, fontSize: 11 }}>실수령 ≈{Math.round(netPackage(r.baseSalary, r.incentive)).toLocaleString()}만</div>}
                  </div>
                  <button onClick={() => void removeSalaryRecord(r.id)} style={{ color: C.t1, cursor: 'pointer', display: 'flex', flexShrink: 0 }}><Trash2 size={13} /></button>
                </div>
              </div>
            );
          })}
        </div>

        {isMobile && SalaryForm}
      </div>

      {!isMobile && (
        <div style={{ width: 272, flexShrink: 0 }}>
          <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ color: C.t1, fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 12 }}>연봉 기록 추가</p>
            {SalaryForm}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export function CareerView() {
  const { fetch } = useCareerStore();
  const [tab, setTab] = useState<'coach' | 'roadmap' | 'skills' | 'achievements' | 'pipeline' | 'journal' | 'certs' | 'worklife' | 'salary'>('coach');

  useEffect(() => { fetch(); }, [fetch]);

  const tabs = [
    { id: 'coach' as const, label: 'AI 코치', icon: Brain, color: C.violet },
    { id: 'roadmap' as const, label: '로드맵', icon: MapPin, color: C.sky },
    { id: 'skills' as const, label: '스킬', icon: Layers, color: C.blue },
    { id: 'achievements' as const, label: '성과', icon: Award, color: C.teal },
    { id: 'pipeline' as const, label: '파이프라인', icon: Briefcase, color: C.amber },
    { id: 'journal' as const, label: '성장저널', icon: BookOpen, color: C.violet },
    { id: 'certs' as const, label: '자격증', icon: GraduationCap, color: C.teal },
    { id: 'worklife' as const, label: '워라밸', icon: Clock, color: C.teal },
    { id: 'salary' as const, label: '급여', icon: DollarSign, color: C.amber },
  ];

  return (
    <div style={{ fontFamily: font }}>
      <div style={{ marginBottom: 12 }}>
        <h1 style={{ color: C.t0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>커리어</h1>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16, background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10, padding: 4 }}>
        {tabs.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 7,
              fontSize: 12.5, cursor: 'pointer', fontFamily: font,
              background: tab === id ? C.bg3 : 'transparent',
              border: `1px solid ${tab === id ? C.b1 : 'transparent'}`,
              color: tab === id ? C.t0 : C.t1,
            }}
          >
            <Icon size={13} color={tab === id ? color : C.t1} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'coach' && <CoachTab />}
      {tab === 'roadmap' && <RoadmapTab />}
      {tab === 'skills' && <SkillsTab />}
      {tab === 'achievements' && <AchievementsTab />}
      {tab === 'pipeline' && <PipelineTab />}
      {tab === 'journal' && <JournalTab />}
      {tab === 'certs' && <CertsTab />}
      {tab === 'worklife' && <WorklifeTab />}
      {tab === 'salary' && <SalaryTab />}
    </div>
  );
}
