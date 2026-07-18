import { useEffect } from 'react';
import { useAppStore, type ViewId } from '../stores/app.store';
import { useBriefingStore } from '../stores/briefing.store';
import { SPECIALISTS } from '../specialists';

const C = {
  bg2: '#0D1228', bg3: '#131B32',
  b0: 'rgba(255,255,255,0.04)', b1: 'rgba(255,255,255,0.08)',
  t0: '#DDE5F5', t1: '#556070',
};
const font = '"Space Grotesk", system-ui, sans-serif';

interface Props {
  view: ViewId;
}

export function SpecialistBanner({ view }: Props) {
  const { sendToChatOpen } = useAppStore();
  const { specialistInsights, fetch, item } = useBriefingStore();
  const spec = SPECIALISTS[view];
  const insight = specialistInsights[view] ?? null;

  useEffect(() => {
    if (!item && !insight) fetch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (view === 'dashboard') return null;

  return (
    <div style={{
      background: C.bg2,
      border: `1px solid ${spec.color}22`,
      borderLeft: `3px solid ${spec.color}`,
      borderRadius: 12,
      padding: '12px 16px',
      marginBottom: 14,
      fontFamily: font,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: insight ? 8 : 10 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: `${spec.color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: spec.color,
          flexShrink: 0,
        }}>
          AI
        </div>
        <div>
          <span style={{ color: C.t0, fontSize: 12.5, fontWeight: 600 }}>{spec.name}</span>
          <span style={{ color: C.t1, fontSize: 11, marginLeft: 7 }}>{spec.role}</span>
        </div>
        <div style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: spec.color, boxShadow: `0 0 5px ${spec.color}` }} />
          <span style={{ color: spec.color, fontSize: 10 }}>활성</span>
        </div>
      </div>

      {/* AI insight */}
      {insight && (
        <p style={{
          color: C.t0, fontSize: 12.5, lineHeight: 1.6, marginBottom: 10,
          paddingLeft: 4,
        }}>
          {insight}
        </p>
      )}

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {spec.quickActions.map((action) => (
          <button
            key={action}
            onClick={() => sendToChatOpen(action)}
            style={{
              background: `${spec.color}12`,
              border: `1px solid ${spec.color}30`,
              borderRadius: 20,
              padding: '4px 11px',
              color: spec.color,
              fontSize: 11.5,
              cursor: 'pointer',
              fontFamily: font,
              transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${spec.color}22`; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${spec.color}12`; }}
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}
