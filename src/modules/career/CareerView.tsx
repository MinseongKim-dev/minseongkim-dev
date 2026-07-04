import { useEffect, useState } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
} from 'recharts';
import { ChevronRight, Loader, Zap, Target, Brain, GitBranch, RefreshCw } from 'lucide-react';
import { useCareerStore, type CareerTarget, type CareerPath, type Assessment } from '../../shared/stores/career.store';

const C = {
  bg2: '#0D1228', bg3: '#131B32',
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
  coachLogs: ReturnType<typeof useCareerStore>['coachLogs'];
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
// Main
// ---------------------------------------------------------------------------
export function CareerView() {
  const { target, paths, coachLogs, loading, aiLoading, fetch, profileTarget, assessState, generatePaths, selectPath, runCoaching } = useCareerStore();

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) {
    return (
      <div style={{ padding: '26px 28px', display: 'flex', alignItems: 'center', gap: 10, color: C.t1, fontFamily: font }}>
        <Spinner /> 불러오는 중…
      </div>
    );
  }

  // Step 1: no target
  if (!target) {
    return (
      <div style={{ padding: '26px 28px' }}>
        <SetupStep onSubmit={profileTarget} loading={aiLoading} />
      </div>
    );
  }

  // Step 2: has target but no assessment
  const hasAssessment = (target.currentAssessment?.length ?? 0) > 0;
  if (!hasAssessment) {
    return (
      <div style={{ padding: '26px 28px' }}>
        <AssessStep target={target} onSubmit={assessState} loading={aiLoading} />
      </div>
    );
  }

  // Step 3+: has assessment
  const hasActivePath = paths.some((p) => p.isSelected) || !!target.selectedPathId;
  return (
    <div style={{ padding: '26px 28px' }}>
      {hasActivePath ? (
        <CoachingView target={target} paths={paths} coachLogs={coachLogs} onRunCoaching={runCoaching} aiLoading={aiLoading} />
      ) : (
        <AssessmentView target={target} paths={paths} onGeneratePaths={generatePaths} onSelectPath={selectPath} aiLoading={aiLoading} />
      )}
    </div>
  );
}
