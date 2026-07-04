import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useToastStore, type ToastLevel } from '../stores/toast.store';

// Inject animation keyframe once
if (typeof document !== 'undefined' && !document.getElementById('node-toast-anim')) {
  const s = document.createElement('style');
  s.id = 'node-toast-anim';
  s.textContent = '@keyframes toastIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}';
  document.head.appendChild(s);
}

const C = {
  bg2: '#0D1228', t0: '#DDE5F5', t1: '#556070',
  blue: '#3B8EF0', teal: '#00CCA0', rose: '#F05472',
};
const font = '"Space Grotesk", system-ui, sans-serif';

const LEVEL_CONFIG: Record<ToastLevel, { color: string; icon: React.ReactNode }> = {
  error:   { color: C.rose,  icon: <AlertCircle size={15} /> },
  success: { color: C.teal,  icon: <CheckCircle2 size={15} /> },
  info:    { color: C.blue,  icon: <Info size={15} /> },
};

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore();
  if (!toasts.length) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none',
    }}>
      {toasts.map(({ id, level, message }) => {
        const { color, icon } = LEVEL_CONFIG[level];
        return (
          <div key={id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: C.bg2,
            border: `1px solid ${color}35`,
            borderLeft: `3px solid ${color}`,
            borderRadius: 10, padding: '12px 14px',
            boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${color}18`,
            fontFamily: font, minWidth: 260, maxWidth: 360,
            pointerEvents: 'all',
            animation: 'toastIn 0.2s ease forwards',
          }}>
            <span style={{ color, flexShrink: 0, marginTop: 1, display: 'flex' }}>{icon}</span>
            <p style={{ flex: 1, color: C.t0, fontSize: 13, lineHeight: 1.5, margin: 0 }}>
              {message}
            </p>
            <button
              onClick={() => dismiss(id)}
              style={{ color: C.t1, cursor: 'pointer', display: 'flex', flexShrink: 0, marginTop: 1 }}
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
