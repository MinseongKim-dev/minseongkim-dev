export type SlideType = 'problem' | 'decisions' | 'arch' | 'challenges';

export interface SlideItem { icon: string; label: string; desc: string; }
export interface SlideDecision { question: string; options: string[]; choice: string; reason: string; }
export interface SlideArch { layer: string; tech: string; where: string; }
export interface SlideChallenge { title: string; problem: string; solution: string; }

export interface Slide {
  eyebrow: string;
  title: string;
  body: string;
  type: SlideType;
  items?: SlideItem[];
  decisions?: SlideDecision[];
  arch?: SlideArch[];
  challenges?: SlideChallenge[];
}

export interface Project {
  id: string;
  title: string;
  subtitle: string;
  desc: string;
  accent: string;
  tags: string[];
  hasApp: boolean;
  appUrl?: string;
  deployUrl?: string;
  slides: Slide[];
}

export interface StackGroup {
  label: string;
  items: string[];
  note: string;
}

export const PROJECTS: Project[] = [
  {
    id: 'node',
    title: 'Node — AI 개인 관리 시스템',
    subtitle: '7개 도메인 전담 AI 스페셜리스트 플랫폼',
    desc: '일정·할 일·재정·건강·학습·커리어·관계. 7명의 AI 전문가가 각 영역을 전담하고 자연어 하나로 삶 전체를 통합 관리한다. 도메인 간 데이터가 연결되어 크로스 도메인 인텔리전스가 작동한다.',
    accent: '#3B82F6',
    tags: ['Supabase', 'Deno Edge Functions', 'Groq AI', 'React', 'TypeScript', 'PostgreSQL', 'RLS'],
    hasApp: true,
    appUrl: 'https://minseongkim.me',
    slides: [
      {
        eyebrow: '문제 정의', title: '삶의 모든 영역이 서로 모른다',
        body: '7개의 앱이 각자 따로 작동한다. AI는 내 맥락을 전혀 모른 채 도움을 준다. 관리를 위해 관리를 해야 하는 상황 — 관리 자체가 일이 된다.',
        type: 'problem',
        items: [
          { icon: '⚡', label: '데이터 고립', desc: 'Notion의 할 일이 Google Calendar를 모르고, 가계부 앱이 소비 패턴과 일정의 상관관계를 분석하지 않는다.' },
          { icon: '🧠', label: '맥락 없는 AI', desc: 'ChatGPT에게 오늘 뭐 해야 해?라고 물어도 내 달력, 마감, 건강 상태를 모른다. 진짜 도움이 되려면 컨텍스트가 필요하다.' },
          { icon: '⏱', label: '관리 피로', desc: '여러 앱을 오가며 데이터를 입력하고 동기화하는 것 자체가 인지 부하다. 관리하는 게 일이 되면 그건 실패한 시스템이다.' },
          { icon: '🔗', label: '크로스 도메인 인사이트 부재', desc: '수면이 부족한 날 카페 지출이 증가한다는 패턴을 아는 앱은 없다. 각자의 데이터만 보기 때문이다.' },
        ],
      },
      {
        eyebrow: '설계 컨셉', title: '7명의 전문가가 나를 케어하는 경험',
        body: '단일 AI가 전부를 처리하는 것이 아니라, 각 도메인에 해당 분야 best-in-class 앱 인사이트를 내면화한 전문가 AI가 배치된다.',
        type: 'problem',
        items: [
          { icon: '📅', label: '시간 설계자', desc: 'Motion의 AI 스케줄링 × Cal Newport의 딥워크. 에너지 곡선으로 하루를 설계하고 오늘의 핵심 태스크를 캘린더에 자동 배치한다.' },
          { icon: '✅', label: '실행 코치', desc: 'GTD × Timo의 타임박스 철학. 목록에만 있는 태스크를 실제 시간으로 변환한다. 3일 이상 미루면 자동으로 개입해 태스크를 분해한다.' },
          { icon: '💰', label: '재정 어드바이저', desc: 'YNAB의 제로 기반 예산 철학. 남은 돈이 아니라 계획된 돈. 카드 앱 알림 자동 파싱으로 수동 입력을 없앤다.' },
          { icon: '💼', label: '커리어 전략가', desc: 'Huntr × Teal. 6차원 스킬 갭 분석, 목표 포지션까지의 로드맵 자동 설계, 면접 D-7 파이프라인으로 면접 준비를 자동화한다.' },
        ],
      },
      {
        eyebrow: '기술 의사결정', title: '왜 이 구조인가 — 4가지 트레이드오프',
        body: '각 결정은 개인 프로젝트의 운영 비용 최소화와 실제 서비스 수준의 설계라는 두 제약 안에서 이루어졌다.',
        type: 'decisions',
        decisions: [
          { question: '인증/DB: Supabase vs AWS 네이티브', options: ['AWS Native', 'Supabase'], choice: 'Supabase', reason: 'Auth·DB·Edge Function이 하나의 프로젝트로 통합된다. JWT 검증 포인트가 단일화되고 RLS로 DB 레이어에서 유저 격리가 보장된다.' },
          { question: 'AI 엔진: Anthropic API vs Groq', options: ['Anthropic API', 'Groq'], choice: 'Groq', reason: 'Llama-3.3-70b로 무료 티어에서 운영 가능. Edge Function에서 API 키만으로 호출되어 인프라 복잡도가 없다.' },
          { question: 'Edge Function 런타임: Node.js vs Deno', options: ['Node.js', 'Deno'], choice: 'Deno', reason: 'Supabase Edge Functions가 Deno 기반이다. TypeScript를 네이티브로 실행하고 npm 패키지도 호환된다.' },
          { question: '프론트엔드: Next.js vs React SPA', options: ['Next.js', 'React SPA'], choice: 'React SPA', reason: 'SSR이 필요 없는 인증 기반 앱이다. Vercel 정적 호스팅으로 서버 없이 CDN에서 서빙되어 Edge Function 비용만 남는다.' },
        ],
      },
      {
        eyebrow: '아키텍처', title: '사용하지 않으면 비용이 0에 가깝다',
        body: '모든 컴포넌트가 서버리스다. Supabase 하나로 Auth·DB·AI API·Realtime이 커버된다.',
        type: 'arch',
        arch: [
          { layer: 'Frontend', tech: 'React 18 · TypeScript · Zustand', where: 'Vercel · CDN Static' },
          { layer: 'Auth', tech: 'Supabase Auth (JWT)', where: 'Free · 50,000 MAU' },
          { layer: 'Database', tech: 'PostgreSQL + RLS', where: 'Supabase · 500MB Free' },
          { layer: 'AI Engine', tech: 'Groq · Llama-3.3-70b', where: 'Free Tier · <1s latency' },
          { layer: 'Functions', tech: 'Supabase Edge Functions (Deno)', where: '500K req/month Free' },
        ],
      },
      {
        eyebrow: '구현 챌린지', title: '설계하면서 막혔던 것들',
        body: '두 가지 챌린지가 설계를 가장 많이 바꿨다.',
        type: 'challenges',
        challenges: [
          { title: 'RLS + Single Table 쿼리 패턴', problem: '7개 도메인의 조회 조건이 각자 달랐다. 이번 달 카테고리별 지출은 날짜+카테고리, 만료 임박 자격증은 상태+날짜 기준이다.', solution: 'entity_type + sort_key 복합 인덱스와 custom_sort_key로 2개 인덱스가 전체 쿼리 패턴을 커버하도록 설계했다. RLS가 DB 레이어에서 유저 격리를 보장한다.' },
          { title: 'AI 크로스 도메인 컨텍스트 주입', problem: '건강 코치가 이번 주 업무가 52시간이라 운동 강도를 낮추세요라고 말하려면 일정 데이터를 알아야 한다. Edge Function이 독립적이라 컨텍스트가 단절됐다.', solution: 'AI 호출 시 context builder가 각 도메인 데이터를 요약해 Groq 프롬프트의 CONTEXT 블록에 구조화해서 넣는다.' },
        ],
      },
    ],
  },
  {
    id: 'macro',
    title: '거시경제 투자분석 시스템',
    subtitle: 'Multi-Engine 거시경제 분석 플랫폼',
    desc: 'GDP, 금리, 환율, 원자재 가격 등 거시경제 지표를 여러 API에서 자동 수집한다. Prometheus가 시계열 메트릭을 저장하고 Grafana가 실시간으로 시각화한다. Docker Compose 하나로 전체 스택이 올라간다.',
    accent: '#10B981',
    tags: ['Docker', 'Docker Compose', 'Grafana', 'Prometheus', 'PostgreSQL', 'Python', 'APScheduler'],
    hasApp: false,
    deployUrl: 'https://macro-invest-agent-system.vercel.app/',
    slides: [
      {
        eyebrow: '문제 정의', title: '거시경제 지표를 매일 손으로 모을 수 없다',
        body: '투자 의사결정에 필요한 지표들은 FRED, Yahoo Finance, 한국은행 API 등 여러 소스에 흩어져 있다.',
        type: 'problem',
        items: [
          { icon: '📡', label: '데이터 수집 자동화', desc: 'GDP·금리·환율·원자재 등 지표별로 다른 API 포맷을 가진 소스에서 스케줄링으로 자동 수집한다.' },
          { icon: '📈', label: '시계열 시각화', desc: '숫자 나열이 아닌 트렌드, 사이클, 지표 간 선행/후행 관계를 Grafana 차트로 파악한다.' },
          { icon: '🔔', label: '임계값 기반 알림', desc: '금리가 특정 구간을 넘거나 환율이 급변할 때 Grafana Alerting이 자동으로 탐지한다.' },
          { icon: '🔄', label: '재현 가능한 환경', desc: '내 컴퓨터에서만 됨을 없앤다. Docker Compose 하나로 어디서든 동일한 환경이 올라와야 한다.' },
        ],
      },
      {
        eyebrow: '기술 의사결정', title: '왜 이 구조인가 — 3가지 선택',
        body: 'DevOps 실전 스택을 배우는 것과 실제로 동작하는 시스템을 만드는 것, 두 목표를 동시에 달성하기 위한 선택들이다.',
        type: 'decisions',
        decisions: [
          { question: '환경: 로컬 직접 설치 vs Docker', options: ['직접 설치', 'Docker'], choice: 'Docker', reason: 'Prometheus, Grafana, PostgreSQL을 로컬에 직접 설치하면 버전 충돌이 생기고 팀원 환경과 달라진다.' },
          { question: '메트릭 저장: PostgreSQL만 vs Prometheus 병용', options: ['PostgreSQL만', 'Prometheus + PG'], choice: 'Prometheus + PG', reason: 'PostgreSQL은 원본 데이터 저장과 복잡한 분석 쿼리용이고 Prometheus는 시계열 메트릭 특화 저장소다.' },
          { question: '대시보드: 자체 UI 개발 vs Grafana', options: ['자체 UI', 'Grafana'], choice: 'Grafana', reason: '대시보드를 JSON으로 버전 관리하고 provisioning으로 자동 로드할 수 있다. AIOps 실무에서 Grafana를 직접 다뤄보는 것 자체가 목표의 일부였다.' },
        ],
      },
      {
        eyebrow: '아키텍처', title: '컨테이너로 격리된 4개 서비스',
        body: '각 컴포넌트가 독립 컨테이너로 분리되어 하나가 죽어도 나머지는 살아있다.',
        type: 'arch',
        arch: [
          { layer: 'Data Collectors', tech: 'Python + APScheduler', where: 'Docker · 지표별 분리' },
          { layer: 'Raw Storage', tech: 'PostgreSQL 15', where: 'Docker · 원본 데이터' },
          { layer: 'Metrics Store', tech: 'Prometheus', where: 'Docker · 시계열 특화' },
          { layer: 'Dashboard', tech: 'Grafana + Alerting', where: 'Docker · JSON 버전 관리' },
          { layer: 'Orchestration', tech: 'Docker Compose', where: '단일 명령으로 전체 기동' },
        ],
      },
      {
        eyebrow: '구현 챌린지', title: '만들면서 마주친 운영 관점의 문제들',
        body: '단순히 컨테이너를 올리는 것에서 끝나지 않았다.',
        type: 'challenges',
        challenges: [
          { title: 'API Rate Limit — 동시 수집 시 차단', problem: '여러 지표를 동시에 폴링하면 무료 API들의 Rate Limit에 걸렸다. 시장 개장 시간에 여러 수집기가 동시에 실행되면 403이 반환됐다.', solution: '각 수집기에 지수 백오프(exponential backoff) + jitter를 적용해 재시도 간격을 랜덤하게 분산시켰다.' },
          { title: 'Grafana 대시보드 재현성', problem: 'UI에서 수동으로 만든 대시보드는 환경이 바뀌면 사라진다. 새 서버에 올릴 때마다 처음부터 다시 설정해야 했다.', solution: 'Grafana provisioning 기능으로 대시보드 JSON을 git에서 자동 로드하게 설정했다. docker-compose up 시점에 모든 대시보드가 자동 복원된다.' },
        ],
      },
    ],
  },
];

export const STACK_GROUPS: StackGroup[] = [
  { label: 'Cloud / Infra', items: ['Supabase', 'Vercel', 'PostgreSQL + RLS', 'Supabase Edge Functions'], note: '서버리스 아키텍처 중심' },
  { label: 'Containers', items: ['Docker', 'Docker Compose', 'Prometheus', 'Grafana'], note: 'DevOps 실전 스택' },
  { label: 'Backend / DB', items: ['Deno (TypeScript)', 'Python (boto3)', 'PostgreSQL', 'APScheduler'], note: '' },
  { label: 'Frontend', items: ['React 18', 'TypeScript', 'Zustand', 'Vite'], note: '' },
  { label: 'AI / IaC / CI', items: ['Groq · Llama-3.3-70b', 'GitHub Actions', 'AWS SAM', 'Amazon Bedrock'], note: 'AI + 인프라 자동화' },
  { label: 'Learning Now', items: ['Kubernetes · CKA', 'AWS SAA-C03', 'Python PS'], note: '' },
];
