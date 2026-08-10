import { useEffect, useRef, useState } from 'react';
import { PROJECTS, STACK_GROUPS, type Project } from './portfolio.data';
import { ProjectModal } from './ProjectModal';
import s from './Portfolio.module.css';

const SPEC_TEXT = `{
  "name": "김민성",
  "school": "SKKU · 소프트웨어학과 2학년",
  "direction": "DevOps ─→ AIOps",
  "target": ["Samsung SDS", "SK Hynix"],
  "stack": ["AWS", "Docker", "Kubernetes", "Python"],
  "status": "actively_building"
}`;

function escH(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function colorSpec(text: string) {
  return text.split('\n').map(line => {
    const km = line.match(/^(\s*)"([^"]+)":/);
    const vm = line.match(/:\s*("[^"]*"|\[.*\]|[^,\s[\]{}]+)(,?)$/);
    if (!km) return escH(line);
    const key = km[2], indent = escH(km[1]);
    const vRaw = vm ? vm[1] : '', trail = vm ? vm[2] : '';
    let vc = '#F59E0B';
    if (key === 'status') vc = '#10B981';
    if (key === 'direction') vc = '#3B82F6';
    if (key === 'target' || key === 'stack') vc = '#C084FC';
    return `${indent}<span style="color:#475569">"${key}"</span><span style="color:#253040">: </span><span style="color:${vc}">${escH(vRaw)}</span>${escH(trail)}`;
  }).join('\n');
}

interface Props {
  onLoginClick: () => void;
}

export function PortfolioPage({ onLoginClick }: Props) {
  const [typed, setTyped] = useState('');
  const [activeProj, setActiveProj] = useState<Project | null>(null);

  // Let the portfolio page scroll (app's #root has overflow:hidden)
  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      root.style.overflow = 'auto';
      root.style.height = 'auto';
    }
    return () => {
      if (root) {
        root.style.overflow = '';
        root.style.height = '';
      }
    };
  }, []);

  // Typing animation
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    let i = 0;
    timerRef.current = setInterval(() => {
      i++;
      setTyped(SPEC_TEXT.slice(0, i));
      if (i >= SPEC_TEXT.length && timerRef.current) clearInterval(timerRef.current);
    }, 13);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Keyboard nav for modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveProj(null);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className={s.page}>
      {/* Nav */}
      <nav className={s.nav}>
        <div className={s.navInner}>
          <div className={s.brand}>
            김민성<span className={s.brandSub}>/ portfolio</span>
          </div>
          <div className={s.navLinks}>
            <a className={s.navLink} href="https://github.com/MinseongKim-dev" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a className={s.navLink} href="https://velog.io/@minseongkim" target="_blank" rel="noopener noreferrer">Blog</a>
            <button className={s.loginBtn} onClick={onLoginClick}>로그인 →</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={s.hero}>
        <div className={s.badge}>
          <span className={s.dotGreen} />
          actively building · SKKU SWE 2학년
        </div>
        <h1 className={s.heroH1}>
          인프라를 설계하고<br />
          <span className={s.heroGrad}>AI로 운영한다</span>
        </h1>
        <p className={s.heroP}>
          AWS Serverless와 Docker 기반으로 직접 설계하고 운영하는 시스템을 만든다. 코드를 먼저 짜지 않는다 — 아키텍처를 먼저 설계하고, 왜 이 기술이어야 하는지 결정한 뒤 구현한다.
        </p>
        <p className={s.heroP2}>
          단기 목표는 DevOps 엔지니어로서의 기반 — Lambda, 컨테이너, IaC. 중기 목표는 AIOps — 인프라와 AI를 연결해 시스템이 스스로를 관찰하고 최적화하는 구조를 만드는 것.
        </p>
        <div className={s.codeBlock}>
          <div className={s.codeBar}>
            <div className={s.codeDot} style={{ background: '#EF4444' }} />
            <div className={s.codeDot} style={{ background: '#F59E0B' }} />
            <div className={s.codeDot} style={{ background: '#10B981' }} />
            <span className={s.codeFilename}>spec.json</span>
          </div>
          <pre
            className={s.codePre}
            dangerouslySetInnerHTML={{
              __html: colorSpec(typed) + (typed.length < SPEC_TEXT.length ? `<span class="${s.cursor}"></span>` : ''),
            }}
          />
        </div>
      </section>

      {/* Projects */}
      <section className={s.section}>
        <div className={s.secHdr}>
          <span className={s.secLbl}>projects</span>
          <div className={s.secLine} />
          <span className={s.secCnt}>02</span>
        </div>
        <div className={s.projList}>
          {PROJECTS.map(proj => (
            <div
              key={proj.id}
              className={s.projCard}
              style={{ ['--acc' as string]: proj.accent }}
              onClick={() => setActiveProj(proj)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter') setActiveProj(proj); }}
            >
              <div className={s.projTopbar} style={{ background: proj.accent }} />
              <div className={s.projHead}>
                <div style={{ flex: 1 }}>
                  <div className={s.projTitleRow}>
                    <div className={s.projDot} style={{ background: proj.accent, boxShadow: `0 0 8px ${proj.accent}` }} />
                    <span className={s.projTitle}>{proj.title}</span>
                  </div>
                  <div className={s.projSub}>{proj.subtitle}</div>
                  <div className={s.projDesc}>{proj.desc}</div>
                  <div className={s.projTags}>
                    {proj.tags.map(t => <span key={t} className={s.tag}>{t}</span>)}
                  </div>
                </div>
                <div className={s.projArr} style={{ color: proj.accent }}>↗</div>
              </div>
              <div className={s.projHoverFooter} style={{ color: proj.accent }}>
                {proj.slides.length}개 슬라이드 — 문제 정의 · 기술 의사결정 · 구현 챌린지 포함 →
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className={s.section}>
        <div className={s.secHdr}>
          <span className={s.secLbl}>tech stack</span>
          <div className={s.secLine} />
        </div>
        <div className={s.stackGrid}>
          {STACK_GROUPS.map(g => (
            <div key={g.label} className={s.stackCell}>
              <div className={s.stackLbl}>
                <span className={s.stackLblMain}>{g.label}</span>
                {g.note && <span className={s.stackLblNote}>{g.note}</span>}
              </div>
              <div className={s.stackItems}>
                {g.items.map(item => <span key={item} className={s.stackItem}>{item}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className={s.section}>
        <div className={s.secHdr}>
          <span className={s.secLbl}>contact</span>
          <div className={s.secLine} />
        </div>
        <div className={s.contactGrid}>
          <div className={s.contactCard}>
            <div className={s.contactTitle}>커피챗 환영해요</div>
            <p className={s.contactP}>DevOps · AIOps 커리어, AWS 아키텍처 설계, 사이드 프로젝트 피드백 — 어떤 주제든 좋아요. 배우는 입장에서 듣고 싶은 게 많습니다.</p>
            <a href="mailto:alstjd8968@gmail.com" className={s.contactEmailBtn}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              alstjd8968@gmail.com
            </a>
          </div>
          <div className={s.contactLinks}>
            <a href="https://github.com/MinseongKim-dev" target="_blank" rel="noopener noreferrer" className={s.contactLink}>
              <div>
                <div className={s.contactLinkTitle}>GitHub</div>
                <div className={s.contactLinkSub}>프로젝트 코드와 커밋 기록</div>
              </div>
              <span style={{ color: '#475569', fontSize: 16 }}>↗</span>
            </a>
            <a href="https://velog.io/@minseongkim" target="_blank" rel="noopener noreferrer" className={s.contactLink}>
              <div>
                <div className={s.contactLinkTitle}>Blog</div>
                <div className={s.contactLinkSub}>기술 공부 기록과 회고</div>
              </div>
              <span style={{ color: '#475569', fontSize: 16 }}>↗</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={s.footer}>
        <span className={s.footerNote}>김민성 · SKKU SWE · 2026</span>
        <div className={s.footerLinks}>
          <a href="https://github.com/MinseongKim-dev" target="_blank" rel="noopener noreferrer" className={s.footerLink}>GitHub</a>
          <a href="https://velog.io/@minseongkim" target="_blank" rel="noopener noreferrer" className={s.footerLink}>Blog</a>
        </div>
      </footer>

      {/* Project modal */}
      {activeProj && <ProjectModal proj={activeProj} onClose={() => setActiveProj(null)} />}
    </div>
  );
}
