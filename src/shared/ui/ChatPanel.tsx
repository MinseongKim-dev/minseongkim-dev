import { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { useAppStore, type ViewId } from '../stores/app.store';
import { useToastStore } from '../stores/toast.store';
import { api } from '../api/client';

// Inject typing-dot animation once
if (typeof document !== 'undefined' && !document.getElementById('node-chat-anim')) {
  const s = document.createElement('style');
  s.id = 'node-chat-anim';
  s.textContent = '@keyframes chatDot{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-5px);opacity:1}}';
  document.head.appendChild(s);
}

const C = {
  bg1: '#090D1F', bg2: '#0D1228', bg3: '#131B32',
  b0: 'rgba(255,255,255,0.04)', b1: 'rgba(255,255,255,0.08)',
  t0: '#DDE5F5', t1: '#556070',
  blue: '#3B8EF0', violet: '#7C5CF0', teal: '#00CCA0',
};
const font = '"Space Grotesk", system-ui, sans-serif';

interface AiResponse {
  message: string;
  followUp?: string;
  visualizations?: { type: string; data: unknown }[];
}

interface Msg {
  role: 'ai' | 'user';
  text: string;
  followUp?: string;
}

const VIEW_TO_DOMAIN: Record<ViewId, string> = {
  dashboard: 'cross',
  schedule: 'schedule',
  tasks: 'tasks',
  finance: 'finance',
  health: 'health',
  learning: 'learning',
  career: 'career',
  relations: 'relationships',
};

const INIT_MSG: Msg = { role: 'ai', text: '안녕하세요! 오늘 일정과 할 일을 확인하고, 궁금한 것을 물어보세요.' };
const QUICK = ['오늘 요약', '일정 잡아줘', '운동 추천', '커리어 체크', '지출 분석'];

function renderText(text: string) {
  return text.split('\n').map((line, i, arr) => (
    <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
  ));
}

export function ChatPanel() {
  const { setChatOpen, view } = useAppStore();
  const [msgs, setMsgs] = useState<Msg[]>([INIT_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, loading]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const userMsg: Msg = { role: 'user', text: msg };
    setMsgs((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build history from all messages except the static init greeting
      const history = [...msgs.slice(1), userMsg]
        .slice(-14)
        .map((m) => ({
          role: m.role === 'ai' ? 'assistant' as const : 'user' as const,
          content: m.text,
        }));

      const domain = VIEW_TO_DOMAIN[view];
      const res = await api.post<AiResponse>('/ai/chat', { message: msg, history, domain });
      setMsgs((m) => [...m, { role: 'ai', text: res.message, followUp: res.followUp }]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '오류가 발생했습니다';
      useToastStore.getState().add(errMsg);
      setMsgs((m) => [...m, { role: 'ai', text: '죄송해요, 잠시 후 다시 시도해 주세요.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: 340, minHeight: '100vh', background: C.bg1,
      borderLeft: `1px solid ${C.b0}`, display: 'flex', flexDirection: 'column',
      flexShrink: 0, fontFamily: font,
    }}>
      {/* Header */}
      <div style={{
        padding: '16px', borderBottom: `1px solid ${C.b0}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: `linear-gradient(135deg,${C.blue},${C.violet})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: '#fff',
        }}>N</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: C.t0, fontSize: 13.5, fontWeight: 600 }}>Node AI</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.teal, boxShadow: `0 0 5px ${C.teal}` }} />
            <span style={{ color: C.teal, fontSize: 10 }}>온라인</span>
          </div>
        </div>
        <button onClick={() => setChatOpen(false)} style={{ color: C.t1, cursor: 'pointer', display: 'flex' }}>
          <X size={14} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {msgs.map((m, i) => (
          <div key={i}>
            <div style={{
              display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
              gap: 7, alignItems: 'flex-end',
            }}>
              {m.role === 'ai' && (
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginBottom: 2,
                  background: `linear-gradient(135deg,${C.blue},${C.violet})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 700, color: '#fff',
                }}>N</div>
              )}
              <div style={{
                maxWidth: '82%', padding: '9px 12px',
                borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                background: m.role === 'user' ? `${C.blue}28` : C.bg3,
                border: `1px solid ${m.role === 'user' ? `${C.blue}45` : C.b1}`,
                color: C.t0, fontSize: 12.5, lineHeight: 1.65,
              }}>
                {renderText(m.text)}
              </div>
            </div>
            {m.role === 'ai' && m.followUp && (
              <div style={{ paddingLeft: 27, marginTop: 6 }}>
                <button
                  onClick={() => void send(m.followUp)}
                  style={{
                    background: `${C.blue}12`, border: `1px solid ${C.blue}30`,
                    borderRadius: 20, padding: '4px 11px',
                    color: C.blue, fontSize: 11.5, cursor: 'pointer', fontFamily: font,
                  }}
                >
                  {m.followUp}
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Animated typing indicator */}
        {loading && (
          <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: `linear-gradient(135deg,${C.blue},${C.violet})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 700, color: '#fff',
            }}>N</div>
            <div style={{
              background: C.bg3, border: `1px solid ${C.b1}`,
              borderRadius: '12px 12px 12px 4px', padding: '12px 15px',
              display: 'flex', gap: 5, alignItems: 'center',
            }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 5, height: 5, borderRadius: '50%', background: C.t1,
                  animation: `chatDot 1s ease-in-out ${i * 0.18}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick actions */}
      <div style={{ padding: '8px 12px', borderTop: `1px solid ${C.b0}`, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {QUICK.map((q) => (
          <button key={q} onClick={() => void send(q)} style={{
            background: C.bg3, border: `1px solid ${C.b1}`, borderRadius: 20,
            padding: '4px 10px', color: C.t1, fontSize: 11, cursor: 'pointer', fontFamily: font,
          }}>
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '10px 12px', borderTop: `1px solid ${C.b0}`, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && void send()}
          placeholder="메시지를 입력하세요..."
          disabled={loading}
          style={{
            flex: 1, background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 8,
            padding: '8px 12px', color: C.t0, fontSize: 12.5, fontFamily: font, outline: 'none',
            opacity: loading ? 0.6 : 1,
          }}
        />
        <button
          onClick={() => void send()}
          disabled={loading || !input.trim()}
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: loading || !input.trim() ? `${C.blue}40` : C.blue,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: loading || !input.trim() ? 'default' : 'pointer', flexShrink: 0,
            transition: 'background 0.15s',
          }}
        >
          <Send size={13} color="#fff" />
        </button>
      </div>
    </div>
  );
}
