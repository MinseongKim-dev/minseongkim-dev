import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useRelationshipsStore } from '../../shared/stores/relationships.store';

const C = {
  bg1: '#090D1F', bg2: '#0D1228',
  b0: 'rgba(255,255,255,0.04)', b1: 'rgba(255,255,255,0.08)',
  t0: '#DDE5F5', t1: '#556070', t2: '#253040',
  blue: '#3B8EF0', violet: '#7C5CF0', teal: '#00CCA0', amber: '#EFA020', rose: '#F05472', sky: '#58AEFF',
};
const font = '"Space Grotesk", system-ui, sans-serif';
const mono = '"JetBrains Mono", "Fira Code", monospace';

const RELATIONSHIP_TYPES = ['가족', '친구', '직장동료', '멘토', '지인', '기타'];
const REL_COLOR: Record<string, string> = {
  가족: C.rose, 친구: C.teal, 직장동료: C.blue, 멘토: C.violet, 지인: C.amber, 기타: C.sky,
};

function avatarColor(name: string): string {
  const colors = [C.blue, C.violet, C.teal, C.amber, C.rose, C.sky];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const inputStyle = {
  background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8,
  padding: '9px 12px', color: C.t0, fontSize: 13.5, fontFamily: font,
  outline: 'none', width: '100%', boxSizing: 'border-box' as const,
};

export function RelationshipsView() {
  const { items, loading, fetch, add, remove } = useRelationshipsStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('친구');
  const [lastContact, setLastContact] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => { fetch(); }, [fetch]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await add({ name: name.trim(), relationship, lastContact: lastContact || undefined, notes: notes || undefined });
    setName(''); setLastContact(''); setNotes(''); setShowForm(false);
  };

  return (
    <div style={{ padding: '26px 28px', fontFamily: font }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ color: C.t0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>관계</h1>
        <p style={{ color: C.t1, fontSize: 12.5, marginTop: 4 }}>
          {loading ? '불러오는 중...' : `${items.length}명의 연락처`}
        </p>
      </div>

      {/* Contact grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 12, marginBottom: 14,
      }}>
        {items.map((c) => {
          const relColor = REL_COLOR[c.relationship] ?? C.sky;
          const avatarCol = avatarColor(c.name);
          const initials = c.name.slice(0, 2);
          return (
            <div key={c.id} style={{
              background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12,
              padding: '16px', position: 'relative',
            }}>
              <button
                onClick={() => remove(c.id)}
                style={{
                  position: 'absolute', top: 10, right: 10,
                  color: C.t2, cursor: 'pointer', display: 'flex',
                }}
              >
                <Trash2 size={12} />
              </button>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', marginBottom: 12,
                background: `linear-gradient(135deg, ${avatarCol}80, ${avatarCol}40)`,
                border: `2px solid ${avatarCol}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: avatarCol, fontSize: 14, fontWeight: 700,
              }}>
                {initials}
              </div>
              <p style={{ color: C.t0, fontSize: 14, fontWeight: 600 }}>{c.name}</p>
              <span style={{
                display: 'inline-block', marginTop: 6, fontSize: 10, fontWeight: 600,
                color: relColor, background: `${relColor}18`, borderRadius: 5, padding: '2px 8px',
              }}>
                {c.relationship}
              </span>
              {c.lastContact && (
                <p style={{ color: C.t2, fontSize: 11, marginTop: 8, fontFamily: mono }}>
                  최근: {c.lastContact}
                </p>
              )}
              {c.notes && (
                <p style={{ color: C.t1, fontSize: 11.5, marginTop: 6, lineHeight: 1.4 }}>
                  {c.notes}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {items.length === 0 && !loading && (
        <p style={{ color: C.t2, fontSize: 13, padding: '10px 0 20px' }}>연락처가 없습니다.</p>
      )}

      {/* Add form */}
      {showForm ? (
        <form
          onSubmit={handleAdd}
          style={{
            background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10,
            padding: '16px', display: 'flex', flexDirection: 'column', gap: 10,
          }}
        >
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" style={inputStyle} />
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={relationship} onChange={(e) => setRelationship(e.target.value)} style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>
              {RELATIONSHIP_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <input type="date" value={lastContact} onChange={(e) => setLastContact(e.target.value)} style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, colorScheme: 'dark' }} />
          </div>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="메모 (선택)" style={inputStyle} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={{ flex: 1, padding: '9px', background: C.violet, color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: font, cursor: 'pointer' }}>추가</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 16px', background: C.bg1, border: `1px solid ${C.b1}`, color: C.t1, borderRadius: 8, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>취소</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer', padding: '8px 0' }}>
          <Plus size={14} />연락처 추가
        </button>
      )}
    </div>
  );
}
