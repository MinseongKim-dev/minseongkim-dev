import { useEffect, useState } from 'react';
import { Plus, Trash2, Phone, Mail, Calendar, Tag, MessageSquare, Users } from 'lucide-react';
import { useRelationshipsStore, type MeetingType, type MeetingMood } from '../../shared/stores/relationships.store';

const C = {
  bg1: '#090D1F', bg2: '#0D1228', bg3: '#131B32',
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

const MEETING_TYPE_LABEL: Record<MeetingType, string> = {
  call: '통화', message: '문자/카톡', meeting: '만남', email: '이메일', other: '기타',
};
const MEETING_TYPE_COLOR: Record<MeetingType, string> = {
  call: C.teal, message: C.sky, meeting: C.blue, email: C.violet, other: C.t1,
};
const MOOD_COLOR: Record<MeetingMood, string> = {
  positive: C.teal, neutral: C.amber, negative: C.rose,
};
const MOOD_LABEL: Record<MeetingMood, string> = {
  positive: '좋았음', neutral: '보통', negative: '아쉬움',
};

function avatarColor(name: string): string {
  const colors = [C.blue, C.violet, C.teal, C.amber, C.rose, C.sky];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function daysSince(dateStr?: string): number | null {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / 86400000);
}

const inputStyle = {
  background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8,
  padding: '9px 12px', color: C.t0, fontSize: 13.5, fontFamily: font,
  outline: 'none', width: '100%', boxSizing: 'border-box' as const,
};

type TabId = 'contacts' | 'meetings';

export function RelationshipsView() {
  const { items, meetings, loading, fetch, add, remove, addMeeting, removeMeeting } = useRelationshipsStore();
  const [tab, setTab] = useState<TabId>('contacts');

  // Contact form
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('친구');
  const [lastContact, setLastContact] = useState('');
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Meeting form
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [meetingContactId, setMeetingContactId] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [meetingType, setMeetingType] = useState<MeetingType>('meeting');
  const [meetingMood, setMeetingMood] = useState<MeetingMood>('positive');
  const [meetingNotes, setMeetingNotes] = useState('');

  // Meeting filter
  const [filterContactId, setFilterContactId] = useState('');

  useEffect(() => { fetch(); }, [fetch]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    await add({
      name: name.trim(), relationship,
      lastContact: lastContact || undefined,
      notes: notes || undefined,
      phone: phone || undefined,
      email: email || undefined,
      birthday: birthday || undefined,
      tags: tags.length ? tags : undefined,
    });
    setName(''); setRelationship('친구'); setLastContact(''); setNotes('');
    setPhone(''); setEmail(''); setBirthday(''); setTagsInput('');
    setShowForm(false);
  };

  const handleAddMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingContactId) return;
    await addMeeting({
      contactId: meetingContactId,
      date: meetingDate,
      type: meetingType,
      mood: meetingMood,
      notes: meetingNotes || undefined,
    });
    setMeetingNotes(''); setShowMeetingForm(false);
  };

  const needsContact = items.filter((c) => {
    const d = daysSince(c.lastContact);
    return d !== null && d >= 30;
  });

  const filteredMeetings = filterContactId
    ? meetings.filter((m) => m.contactId === filterContactId)
    : meetings;
  const sortedMeetings = [...filteredMeetings].sort((a, b) => b.date.localeCompare(a.date));

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

  return (
    <div style={{ padding: '26px 28px', fontFamily: font }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ color: C.t0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>관계</h1>
        <p style={{ color: C.t1, fontSize: 12.5, marginTop: 4 }}>
          {loading ? '불러오는 중...' : `${items.length}명 · 만남 ${meetings.length}건`}
        </p>
      </div>

      {/* Reminder banner */}
      {needsContact.length > 0 && (
        <div style={{
          background: `${C.amber}12`, border: `1px solid ${C.amber}30`,
          borderRadius: 10, padding: '12px 16px', marginBottom: 18,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 14 }}>⏰</span>
          <p style={{ color: C.amber, fontSize: 12.5 }}>
            연락이 필요한 분들: {needsContact.map((c) => c.name).join(', ')}
          </p>
        </div>
      )}

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 20,
        background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10, padding: 4, width: 'fit-content',
      }}>
        {tabBtn('contacts', `연락처 (${items.length})`)}
        {tabBtn('meetings', `만남 기록 (${meetings.length})`)}
      </div>

      {/* Contacts tab */}
      {tab === 'contacts' && (
        <>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: 12, marginBottom: 14,
          }}>
            {items.map((c) => {
              const relColor = REL_COLOR[c.relationship] ?? C.sky;
              const avatarCol = avatarColor(c.name);
              const initials = c.name.slice(0, 2);
              const days = daysSince(c.lastContact);
              const stale = days !== null && days >= 30;
              const contactMeetings = meetings.filter((m) => m.contactId === c.id).length;
              return (
                <div key={c.id} style={{
                  background: C.bg2, border: `1px solid ${stale ? C.amber + '40' : C.b1}`,
                  borderRadius: 12, padding: '16px', position: 'relative',
                }}>
                  <button
                    onClick={() => remove(c.id)}
                    style={{ position: 'absolute', top: 10, right: 10, color: C.t2, cursor: 'pointer', display: 'flex' }}
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

                  {/* Contact details */}
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {c.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Phone size={10} color={C.t2} />
                        <span style={{ color: C.t1, fontSize: 11, fontFamily: mono }}>{c.phone}</span>
                      </div>
                    )}
                    {c.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Mail size={10} color={C.t2} />
                        <span style={{ color: C.t1, fontSize: 11 }}>{c.email}</span>
                      </div>
                    )}
                    {c.birthday && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={10} color={C.rose} />
                        <span style={{ color: C.t1, fontSize: 11, fontFamily: mono }}>{c.birthday}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {(c.tags ?? []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                      {(c.tags ?? []).map((tag) => (
                        <span key={tag} style={{
                          fontSize: 10, color: C.violet, background: `${C.violet}18`,
                          borderRadius: 5, padding: '2px 7px', display: 'flex', alignItems: 'center', gap: 3,
                        }}>
                          <Tag size={7} />{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Last contact & meeting count */}
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {c.lastContact ? (
                      <p style={{ color: stale ? C.amber : C.t2, fontSize: 10.5, fontFamily: mono }}>
                        {stale ? `${days}일 전` : `최근 ${days}일 전`}
                      </p>
                    ) : (
                      <p style={{ color: C.t2, fontSize: 10.5 }}>기록 없음</p>
                    )}
                    {contactMeetings > 0 && (
                      <span style={{ fontSize: 10, color: C.t2, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <MessageSquare size={9} />{contactMeetings}
                      </span>
                    )}
                  </div>

                  {c.notes && (
                    <p style={{ color: C.t1, fontSize: 11.5, marginTop: 8, lineHeight: 1.4, borderTop: `1px solid ${C.b0}`, paddingTop: 8 }}>
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

          {showForm ? (
            <form onSubmit={handleAddContact} style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" style={inputStyle} />
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={relationship} onChange={(e) => setRelationship(e.target.value)} style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>
                  {RELATIONSHIP_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <input type="date" value={lastContact} onChange={(e) => setLastContact(e.target.value)} style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: lastContact ? C.t0 : C.t2, fontSize: 13, fontFamily: font, colorScheme: 'dark' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="전화번호 (선택)" style={{ ...inputStyle, flex: 1 }} />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일 (선택)" style={{ ...inputStyle, flex: 1 }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: C.t2, fontSize: 11, marginBottom: 4 }}>생일 (선택)</p>
                  <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} style={{ background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: birthday ? C.t0 : C.t2, fontSize: 13, fontFamily: font, colorScheme: 'dark', width: '100%', boxSizing: 'border-box' }} />
                </div>
                <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="태그 (쉼표 구분)" style={{ ...inputStyle, flex: 1 }} />
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
        </>
      )}

      {/* Meetings tab */}
      {tab === 'meetings' && (
        <>
          {/* Filter by contact */}
          {items.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <select
                value={filterContactId}
                onChange={(e) => setFilterContactId(e.target.value)}
                style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 14px', color: filterContactId ? C.t0 : C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer' }}
              >
                <option value="">전체 ({meetings.length}건)</option>
                {items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({meetings.filter((m) => m.contactId === c.id).length}건)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Meeting list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {sortedMeetings.map((m) => {
              const contact = items.find((c) => c.id === m.contactId);
              const typeColor = MEETING_TYPE_COLOR[m.type] ?? C.t1;
              const moodColor = m.mood ? MOOD_COLOR[m.mood] : undefined;
              return (
                <div key={m.id} style={{
                  background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10, padding: '14px 16px',
                  display: 'flex', gap: 12,
                }}>
                  <div style={{ width: 3, minHeight: 36, borderRadius: 2, background: typeColor, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, color: typeColor,
                        background: `${typeColor}18`, borderRadius: 5, padding: '2px 8px',
                      }}>{MEETING_TYPE_LABEL[m.type]}</span>
                      {m.mood && (
                        <span style={{
                          fontSize: 10, color: moodColor,
                          background: `${moodColor}18`, borderRadius: 5, padding: '2px 8px',
                        }}>{MOOD_LABEL[m.mood]}</span>
                      )}
                      <span style={{ fontSize: 10, fontFamily: mono, color: C.t2, marginLeft: 'auto' }}>{m.date}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Users size={11} color={C.t2} />
                      <span style={{ color: C.t0, fontSize: 13, fontWeight: 500 }}>{contact?.name ?? '알 수 없음'}</span>
                    </div>
                    {m.notes && (
                      <p style={{ color: C.t1, fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>{m.notes}</p>
                    )}
                  </div>
                  <button onClick={() => removeMeeting(m.id)} style={{ color: C.t2, cursor: 'pointer', display: 'flex', alignSelf: 'flex-start' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
            {sortedMeetings.length === 0 && (
              <p style={{ color: C.t2, fontSize: 13, padding: '20px 0' }}>만남 기록이 없습니다.</p>
            )}
          </div>

          {/* Add meeting form */}
          {showMeetingForm ? (
            <form onSubmit={handleAddMeeting} style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <select
                value={meetingContactId}
                onChange={(e) => setMeetingContactId(e.target.value)}
                style={{ background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '9px 12px', color: meetingContactId ? C.t0 : C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer' }}
              >
                <option value="">연락처 선택</option>
                {items.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, colorScheme: 'dark' }} />
                <select value={meetingType} onChange={(e) => setMeetingType(e.target.value as MeetingType)} style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>
                  {(Object.keys(MEETING_TYPE_LABEL) as MeetingType[]).map((t) => (
                    <option key={t} value={t}>{MEETING_TYPE_LABEL[t]}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['positive', 'neutral', 'negative'] as MeetingMood[]).map((mood) => (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => setMeetingMood(mood)}
                    style={{
                      flex: 1, padding: '7px', borderRadius: 8, fontSize: 12, fontFamily: font, cursor: 'pointer',
                      background: meetingMood === mood ? `${MOOD_COLOR[mood]}20` : C.bg1,
                      border: `1px solid ${meetingMood === mood ? MOOD_COLOR[mood] : C.b1}`,
                      color: meetingMood === mood ? MOOD_COLOR[mood] : C.t1,
                    }}
                  >{MOOD_LABEL[mood]}</button>
                ))}
              </div>
              <input value={meetingNotes} onChange={(e) => setMeetingNotes(e.target.value)} placeholder="메모 (선택)" style={inputStyle} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={{ flex: 1, padding: '9px', background: C.violet, color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: font, cursor: 'pointer' }}>기록 추가</button>
                <button type="button" onClick={() => setShowMeetingForm(false)} style={{ padding: '9px 16px', background: C.bg1, border: `1px solid ${C.b1}`, color: C.t1, borderRadius: 8, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>취소</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowMeetingForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer', padding: '8px 0' }}>
              <Plus size={14} />만남 기록 추가
            </button>
          )}
        </>
      )}
    </div>
  );
}
