import { useState } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
} from 'recharts';
import { ChevronRight } from 'lucide-react';

const C = {
  bg2: '#0D1228', bg3: '#131B32',
  b0: 'rgba(255,255,255,0.04)', b1: 'rgba(255,255,255,0.08)', b2: 'rgba(255,255,255,0.16)',
  t0: '#DDE5F5', t1: '#556070', t2: '#253040',
  blue: '#3B8EF0', violet: '#7C5CF0', teal: '#00CCA0',
  amber: '#EFA020', rose: '#F05472', sky: '#58AEFF',
};
const font = '"Space Grotesk", system-ui, sans-serif';
const mono = '"JetBrains Mono", "Fira Code", monospace';

const GAP_BARS = [
  { label: '기술 역량',  score: 67, color: C.blue   },
  { label: '소프트 스킬', score: 50, color: C.violet },
  { label: '교육/자격', score: 83, color: C.teal   },
  { label: '경험',      score: 67, color: C.sky    },
  { label: '네트워크',  score: 33, color: C.rose   },
  { label: '시장 적합', score: 83, color: C.amber  },
];

const RADAR_DATA = [
  { subject: '기술역량',   value: 67 },
  { subject: '소프트스킬', value: 50 },
  { subject: '교육/자격',  value: 83 },
  { subject: '경험',       value: 67 },
  { subject: '네트워크',   value: 33 },
  { subject: '시장적합',   value: 83 },
];

const PHASES = [
  {
    name: '기반 다지기', dur: '1~3개월', status: 'active',
    actions: ['TypeScript 심화 학습 ─ 진행 중', '기술 블로그 개설', '프론트엔드 밋업 참여'],
  },
  {
    name: '역량 확장', dur: '4~6개월', status: 'pending',
    actions: ['성능 최적화 프로젝트', '디자인 시스템 기여', '주니어 멘토링'],
  },
  {
    name: '포지셔닝', dur: '7~10개월', status: 'pending',
    actions: ['컨퍼런스 발표', '테크 리드 역할 경험', '이력서/포트폴리오 최종 정리'],
  },
];

function CircularGauge({ value, color = C.violet, size = 124 }: { value: number; color?: string; size?: number }) {
  const r = 48;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 124 124">
      <circle cx="62" cy="62" r={r} fill="none" stroke={C.b1} strokeWidth="9" />
      <circle
        cx="62" cy="62" r={r} fill="none" stroke={color}
        strokeWidth="9" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 62 62)"
        style={{ filter: `drop-shadow(0 0 10px ${color}90)` }}
      />
      <text x="62" y="57" textAnchor="middle" fill={C.t0} fontSize="24" fontWeight="700" fontFamily={font}>{value}</text>
      <text x="62" y="72" textAnchor="middle" fill={C.t1} fontSize="9.5" fontFamily={font}>준비도 %</text>
    </svg>
  );
}

function Dot({ color, glow }: { color: string; glow?: boolean }) {
  return (
    <div style={{
      width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0,
      boxShadow: glow ? `0 0 7px ${color}` : 'none',
    }} />
  );
}

export function CareerView() {
  const [openPhase, setOpenPhase] = useState(0);

  return (
    <div style={{ padding: '26px 28px', fontFamily: font }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ color: C.t1, fontSize: 10.5, letterSpacing: '0.6px', textTransform: 'uppercase', fontFamily: mono, marginBottom: 5 }}>
          AI 커리어 코치
        </div>
        <h1 style={{ color: C.t0, fontSize: 21, fontWeight: 700, letterSpacing: '-0.4px' }}>프론트엔드 시니어 개발자</h1>
        <p style={{ color: C.t1, fontSize: 12.5, marginTop: 4 }}>예상 기간 8~12개월 · 현직 성장형 경로</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, marginBottom: 16 }}>
        {/* Gauge + bars */}
        <div style={{
          background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12,
          padding: '20px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        }}>
          <CircularGauge value={64} color="#9B7CF5" />
          <div style={{ width: '100%' }}>
            {GAP_BARS.slice(0, 4).map((b) => (
              <div key={b.label} style={{ marginBottom: 9 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ color: C.t1, fontSize: 10.5 }}>{b.label}</span>
                  <span style={{ color: C.t0, fontSize: 10.5, fontFamily: mono }}>{b.score}%</span>
                </div>
                <div style={{ height: 4, background: C.b0, borderRadius: 2 }}>
                  <div style={{
                    height: '100%', width: `${b.score}%`, background: b.color,
                    borderRadius: 2, boxShadow: `0 0 5px ${b.color}60`, transition: 'width 0.8s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Radar + remaining bars */}
        <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ color: C.t1, fontSize: 11, fontWeight: 500, marginBottom: 2 }}>6차원 갭 분석</div>
          <ResponsiveContainer width="100%" height={185}>
            <RadarChart data={RADAR_DATA} margin={{ top: 4, right: 24, bottom: 4, left: 24 }}>
              <PolarGrid stroke="rgba(255,255,255,0.07)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: C.t1, fontSize: 9.5, fontFamily: font }} />
              <Radar dataKey="value" stroke="#9B7CF5" fill="#9B7CF5" fillOpacity={0.18} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', marginTop: 6 }}>
            {GAP_BARS.slice(4).map((b) => (
              <div key={b.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ color: C.t1, fontSize: 10.5 }}>{b.label}</span>
                  <span style={{ color: C.t0, fontSize: 10.5, fontFamily: mono }}>{b.score}%</span>
                </div>
                <div style={{ height: 3, background: C.b0, borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${b.score}%`, background: b.color, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 14, background: `${C.violet}12`, border: `1px solid ${C.violet}30`,
            borderRadius: 8, padding: '9px 12px', fontSize: 12, color: `${C.violet}E0`, lineHeight: 1.5,
          }}>
            💡 네트워크(33%) 갭이 가장 커요. 기술 블로그 + 밋업 참여로 빠르게 올릴 수 있어요.
          </div>
        </div>
      </div>

      {/* Roadmap */}
      <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '18px 20px' }}>
        <div style={{ color: C.t1, fontSize: 11, fontWeight: 500, marginBottom: 14 }}>준비 로드맵</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PHASES.map((phase, i) => {
            const isOpen = openPhase === i;
            const isActive = phase.status === 'active';
            return (
              <div key={i} style={{ border: `1px solid ${isActive ? C.b2 : C.b0}`, borderRadius: 10, overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenPhase(isOpen ? -1 : i)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 14px', background: isActive ? `${C.violet}10` : 'transparent',
                    cursor: 'pointer', fontFamily: font, textAlign: 'left',
                  }}
                >
                  <Dot color={isActive ? C.violet : C.t2} glow={isActive} />
                  <span style={{ color: isActive ? C.t0 : C.t1, fontSize: 13.5, fontWeight: isActive ? 600 : 400 }}>{phase.name}</span>
                  <span style={{ color: C.t2, fontSize: 11, fontFamily: mono, marginLeft: 4 }}>{phase.dur}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10.5, color: isActive ? C.violet : C.t2, fontWeight: 500 }}>
                    {isActive ? '● 진행중' : '대기'}
                  </span>
                  <ChevronRight
                    size={12} color={C.t2}
                    style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
                  />
                </button>
                {isOpen && (
                  <div style={{ padding: '10px 14px 14px 34px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {phase.actions.map((action, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 4, height: 4, borderRadius: '50%',
                          background: isActive && j === 0 ? C.violet : C.t2, flexShrink: 0,
                        }} />
                        <span style={{ color: isActive && j === 0 ? C.t0 : C.t1, fontSize: 12.5 }}>{action}</span>
                        {isActive && j === 0 && (
                          <span style={{
                            marginLeft: 'auto', fontSize: 10, color: C.teal,
                            background: `${C.teal}15`, borderRadius: 4, padding: '2px 7px',
                          }}>진행중</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
