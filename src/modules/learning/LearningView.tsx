import { BookOpen } from 'lucide-react';

const C = { t1: '#556070', t2: '#253040', sky: '#58AEFF' };
const font = '"Space Grotesk", system-ui, sans-serif';

export function LearningView() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, fontFamily: font, padding: 40 }}>
      <BookOpen size={40} color={`${C.sky}60`} />
      <p style={{ color: C.t1, fontSize: 14 }}>학습 모듈은 개발 중이에요.</p>
      <p style={{ color: C.t2, fontSize: 12.5 }}>대시보드 또는 커리어 탭을 확인해보세요.</p>
    </div>
  );
}
