import { useState } from 'react';
import type { Project } from './portfolio.data';
import s from './Portfolio.module.css';

interface Props {
  proj: Project;
  onClose: () => void;
}

export function ProjectModal({ proj, onClose }: Props) {
  const [slide, setSlide] = useState(0);
  const { slides, accent } = proj;
  const current = slides[slide];
  const isLast = slide === slides.length - 1;
  const label = proj.id === 'node' ? 'project_01' : 'project_02';

  return (
    <div className={`${s.modalOverlay} ${s.open}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={s.modalBox} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={s.modalHdr}>
          <div>
            <div className={s.modalEye} style={{ color: accent }}>
              {label} · {slide + 1}/{slides.length}
            </div>
            <div className={s.modalHdrTitle}>{proj.title}</div>
          </div>
          <button className={s.modalCloseBtn} onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className={s.modalBody}>
          <div className={s.slideEye}>{current.eyebrow}</div>
          <h2 className={s.slideH2}>{current.title}</h2>
          <p className={s.slideP}>{current.body}</p>

          {current.type === 'problem' && current.items && (
            <div className={s.itemList}>
              {current.items.map((it, i) => (
                <div key={i} className={s.itemCard}>
                  <span className={s.itemIcon}>{it.icon}</span>
                  <div>
                    <div className={s.itemLabel}>{it.label}</div>
                    <div className={s.itemDesc}>{it.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {current.type === 'decisions' && current.decisions && (
            <div className={s.decList}>
              {current.decisions.map((d, i) => (
                <div key={i} className={s.decCard}>
                  <div className={s.decQ}>{d.question}</div>
                  <div className={s.decOpts}>
                    {d.options.map(o => (
                      <span key={o} className={s.decOpt} style={
                        o === d.choice
                          ? { background: `${accent}20`, color: accent, border: `1px solid ${accent}50`, fontWeight: 600 }
                          : { background: '#0D1117', color: '#475569', border: '1px solid #1C2333' }
                      }>
                        {o === d.choice ? '✓ ' : ''}{o}
                      </span>
                    ))}
                  </div>
                  <div className={s.decReason}>{d.reason}</div>
                </div>
              ))}
            </div>
          )}

          {current.type === 'arch' && current.arch && (
            <div className={s.archTbl}>
              {current.arch.map((row, i) => (
                <div key={i} className={s.archRow} style={{ background: i % 2 === 0 ? '#07090F' : '#0D1117' }}>
                  <div className={`${s.archCell} ${s.archCellLabel}`}>{row.layer}</div>
                  <div className={`${s.archCell} ${s.archCellTech}`}>{row.tech}</div>
                  <div className={`${s.archCell} ${s.archCellNote}`} style={{ color: accent }}>{row.where}</div>
                </div>
              ))}
            </div>
          )}

          {current.type === 'challenges' && current.challenges && (
            <div className={s.chalList}>
              {current.challenges.map((c, i) => (
                <div key={i} className={s.chalCard}>
                  <div className={s.chalTitle}>{c.title}</div>
                  <div className={s.chalGrid}>
                    <div className={s.chalSide}>
                      <div className={s.chalBadge} style={{ color: '#EF4444' }}>Problem</div>
                      {c.problem}
                    </div>
                    <div className={`${s.chalSide} ${s.chalSideRight}`}>
                      <div className={s.chalBadge} style={{ color: '#10B981' }}>Solution</div>
                      {c.solution}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={s.modalFtr}>
          <button
            className={s.modalBtnPrev}
            onClick={() => setSlide(n => n - 1)}
            disabled={slide === 0}
          >
            ← 이전
          </button>

          <div className={s.pagDots}>
            {slides.map((_, i) => (
              <button
                key={i}
                className={s.pagDot}
                onClick={() => setSlide(i)}
                style={i === slide ? { background: accent, width: 20 } : undefined}
              />
            ))}
          </div>

          {isLast ? (
            proj.hasApp ? (
              <a href={proj.appUrl} target="_blank" rel="noopener noreferrer" className={s.modalBtnCta} style={{ background: accent }}>
                앱 열기 ↗
              </a>
            ) : (
              <a href={proj.deployUrl} target="_blank" rel="noopener noreferrer" className={s.modalBtnCta} style={{ background: accent }}>
                배포 사이트 ↗
              </a>
            )
          ) : (
            <button className={s.modalBtnNext} style={{ background: accent }} onClick={() => setSlide(n => n + 1)}>
              다음 →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
