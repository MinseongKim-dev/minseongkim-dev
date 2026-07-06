# PLANNING.md — minseongkim-dev 개발 계획

> Claude Code용 참고 문서. 구현 중 PRD/TRD와 함께 사용.

---

## 프로젝트 개요

개인 생산성 대시보드 SPA.

- **Frontend**: React 19 + TypeScript + Vite, Zustand ^5.0
- **Backend**: AWS SAM — Lambda(Python 3.12) + DynamoDB single-table + API Gateway HTTP
- **AI**: Bedrock Claude (IAM 인증, 키 없음), BedrockCostGuard $10/월 예산
- **배포**: CloudFront + S3
- **Branch**: `claude/project-structure-tech-stack-manwwu` → main으로 PR

---

## 디자인 시스템 (변경 금지)

```
bg0: #06091A   bg1: #090D1F   bg2: #0D1228   bg3: #131B32
blue: #3B8EF0  violet: #7C5CF0  teal: #00CCA0
amber: #EFA020  rose: #F05472  sky: #58AEFF
Font: Space Grotesk (body) + JetBrains Mono (code/numbers)
```

레이아웃:
- 데스크톱: `display:flex, gap:20` → 좌측 `flex:1, minWidth:0` + 우측 `width:272px, flexShrink:0`
- 모바일: `useWindowSize` → `isMobile: width < 768`, 우측 패널 숨김
- `verbatimModuleSyntax` 활성화 → type-only import는 반드시 `import type { X }`

---

## 스프린트 완료 현황

### Sprint 1 — 기반 구조 ✅
- 프로젝트 스캐폴딩, DynamoDB single-table, API Gateway, 기본 CRUD Lambda
- Zustand 스토어 (tasks, habits, goals, finance, health, relationships, career)
- 공통 컴포넌트: Sidebar, TopBar, ProgressRing, StatCard

### Sprint 2 — 핵심 모듈 ✅
- TasksView: 목록 + 필터 + 마감일
- HabitsView: 체크인 + 진행 바
- GoalsView: 목표 + 마일스톤 + ProgressRing
- FinanceView: 수입/지출 + 카테고리 + 월별 차트
- HealthView: 운동 로그 + 수면 로그 + 대시보드
- RelationshipsView: 연락처 + 미팅 + 우측 통계

### Sprint 3 — 심화 기능 ✅
- **TSK-05**: Kanban 보드 (`todo / in_progress / done` 3컬럼, 드래그 미구현)
- **HLT-06**: 습관 스트릭 추적 (`calcStreak` — 오늘/어제 기준 연속 일수)
- **CAR-05**: 취업 파이프라인 (`JobApplication`, 8단계 Kanban-style)
- **CAR-10**: 성장 저널 (마크다운 입력 + 태그)
- **CAR-11**: 자격증 관리 (`Certification`, 상태: studying/passed/expired)
- **REL-03**: 기념일 관리 (생일 ≤30일 카드, 오늘/7일/나머지 색 구분)

---

## Sprint 4 — 인증 & AI & 확장 (다음 구현)

우선순위 순서:

### AUTH-01: Cognito 인증 UI (P0 — 가장 중요)
**현황**: 현재 `userId = 'user-001'` 하드코딩. 실제 인증 없음.
**구현 위치**: `src/shared/auth/` 신규 디렉토리

```
- LoginPage.tsx: 이메일/비밀번호 폼
- AuthContext.tsx: Cognito user pool 연동
- ProtectedRoute.tsx: 인증 확인 후 리디렉션
- useAuth() hook: 토큰 자동 갱신
```

백엔드: `backend/template.yaml`에 Cognito UserPool 리소스 추가, JWT Authorizer 적용.

**주의**: 기존 `api.ts`의 `userId` → JWT sub claim으로 교체.

---

### AI-01: AI 채팅 패널 실제 연동 (P1)
**현황**: `CareerView`의 AI Coach 탭이 목 데이터로 작동.
**구현**: `backend/handlers/ai_handler.py` 이미 존재 — 프론트 연동만 필요.

```typescript
// src/shared/api/ai.ts
export async function sendAIMessage(prompt: string, context: string): Promise<string>

// 채팅 스트리밍: EventSource or chunked response
```

BedrockCostGuard 연동 확인 (`$10/월`). 토큰 예산 초과 시 에러 메시지 표시.

---

### CAR-07: 워라밸 탭 (P1)
**백엔드**: `DOMAIN_MAP`에 `work-logs` 이미 등록됨.
**구현**: `CareerView`에 `'worklife'` 탭 추가.

```
- 주간 근무시간 로그 (시작/종료 시간)
- 번아웃 게이지 (주 52h 초과 시 경고)
- 주별 트렌드 바 차트 (스택: 정규/초과)
- 월별 평균 표시
```

---

### CAR-06: 급여 트래커 (P1)
**백엔드**: `DOMAIN_MAP`에 `salary` 이미 등록됨.

```
- 연봉 이력 (연도, 기본급, 인센티브, 회사명)
- 연봉 성장률 차트 (YoY %)
- 시장 비교 메모 필드
- 총 연간 패키지 계산 (4대보험 공제 옵션)
```

---

### HLT-04: 건강 지표 확장 (P2)
**현황**: 운동/수면만 있음.

```
- 체중 로그 (kg, BMI 자동 계산)
- 수분 섭취 (ml, 일일 목표 대비 %)
- 걸음 수 (수동 입력 or 추후 API 연동)
- HealthView 대시보드 2×3 그리드로 확장
```

---

### NEW-01: Quick Capture (P1 — 실용성 높음)
**PRD에 없는 신규 기능. 가장 실용적.**

`Cmd+K` (Mac) / `Ctrl+K` (Win) → 플로팅 입력창

```typescript
// src/shared/components/QuickCapture.tsx
// 전역 keydown 리스너
// 입력 파싱 규칙:
//   "!" 접두사 → 할일로 저장 (tasks store)
//   "@" 접두사 → 습관 체크인 (habits store)
//   "#" 접두사 → 메모 저장 (notes — 신규)
//   기본 → 할일로 저장
// App.tsx에서 항상 렌더링
```

---

### NEW-02: 대시보드 위젯 개선 (P2)
**현황**: 각 모듈에 대시보드 탭 있으나 상호 연동 없음.

메인 홈 화면 (DashboardView 신규):
```
- 오늘의 할일 요약 (미완료 개수 + 마감 임박)
- 습관 오늘 체크 현황 (N/M 완료)
- 이번 주 운동 스트릭
- 다음 미팅 D-day
- 이번 달 지출 vs 예산
- 생일 임박 알림
```

---

## Sprint 5 — AI 심화 & 인프라

### CAR-08: AI STAR 자소서 생성 (P2)
**백엔드**: `ai_handler.py`에 `/ai/star-story` 엔드포인트 추가 예정.

```
- 경험 입력 → Bedrock Claude → STAR 형식 변환
- 직무/회사 맞춤 키워드 제안
- 성장저널 항목 연동 (소스로 활용)
```

### CAR-09: 인터뷰 코칭 (P2)
```
- 모의 면접 Q&A (직무별 질문 DB)
- 답변 피드백 (Bedrock)
- 약점 분석 리포트
```

### FIN-06: AI 지출 분석 (P2)
```
- 월별 지출 패턴 분석 텍스트 생성
- 절약 제안 (카테고리별 이상치 감지)
- 예산 자동 추천
```

### SCH-02: 반복 일정 (P2)
```
- 주간/월간 반복 설정
- iCal 형식 내보내기
- 구글 캘린더 연동 (webhook)
```

### INFRA-01: CI/CD 파이프라인 (P1)
```
- GitHub Actions: PR → 빌드 + tsc --noEmit + 린트
- main merge → S3 배포 자동화
- SAM deploy workflow
```

### NEW-03: 전역 검색 (P2)
```
// src/shared/components/GlobalSearch.tsx
- 모든 스토어 대상 fuzzy search
- 결과 클릭 → 해당 모듈로 이동
- Cmd+K와 통합 (입력창에서 "/" 입력 시 검색 모드)
```

### NEW-04: 크로스 모듈 연결 (P3)
```
- 할일 → 목표 연결 (task.goalId)
- 미팅 → 연락처 자동 태그
- 자격증 → 커리어 타임라인 표시
```

### NEW-05: Kanban 드래그 앤 드롭 (P2)
```
- @dnd-kit/core 도입
- TasksView Kanban 탭 드래그 지원
- CareerView 파이프라인 탭 드래그 지원
```

---

## Sprint 6 — 완성도

### LRN-04: 스페이스드 리피티션 (P3)
SM-2 알고리즘 기반 플래시카드.

### HLT-05: 기분 트래커 (P2)
```
- 일일 기분 기록 (1-5 이모지)
- 습관/수면과 상관관계 차트
- 월별 히트맵
```

### AUTH-02: Google OAuth (P3)
Cognito + Google IdP 연동.

### INFRA-02: 오프라인 지원 (P3)
Service Worker + IndexedDB 큐 → 온라인 복귀 시 sync.

### NEW-06: 주간 리뷰 (P2)
```
- 매주 일요일 모달 (자동 표시)
- 지난 주 완료/미완료 요약
- 다음 주 목표 설정
- PDF 내보내기
```

### NEW-07: 알림 (P3)
```
- 브라우저 Push Notification
- 마감 24시간 전 할일 알림
- 생일 D-1 알림
- 습관 리마인더 (설정 시간)
```

### NEW-08: 데이터 내보내기 (P2)
```
- JSON 전체 백업/복원
- CSV 내보내기 (재무, 운동 등)
- 월별 리포트 PDF
```

### NEW-09: 배치 작업 & 키보드 단축키 (P3)
```
- 할일 다중 선택 → 일괄 상태 변경
- 전체 키보드 단축키 맵 (? 키로 표시)
- Vim 스타일 탐색 (선택적)
```

---

## 백엔드 현황

### 이미 구현된 DOMAIN_MAP 엔드포인트
```python
# backend/handlers/crud_handler.py
DOMAIN_MAP = {
    'tasks', 'habits', 'goals', 'finance', 'health',
    'sleep', 'relationships', 'meetings', 'contacts',
    'job-apps', 'journals', 'certs',          # Sprint 3 추가
    'salary', 'work-logs',                     # Sprint 4 대기
    'career-targets', 'career-paths', 'coaching'
}
```

### 추가 필요한 핸들러
- `auth_handler.py`: Cognito 트리거 (pre-signup, post-confirmation)
- `ai_handler.py`: 이미 존재, 프론트 연동 필요
- `scheduler_handler.py`: EventBridge → 반복 일정 처리

---

## 기술 부채

| 항목 | 우선순위 | 내용 |
|------|---------|------|
| 하드코딩 userId | P0 | `'user-001'` → JWT sub claim |
| API 에러 처리 | P1 | 스토어마다 `error` 상태 있으나 UI 미표시 |
| 로딩 스켈레톤 | P2 | 현재 빈 화면; SkeletonCard 컴포넌트 필요 |
| 타입 중복 | P2 | `Task`, `Habit` 등 일부 타입 스토어/뷰 양쪽 정의 |
| 테스트 없음 | P3 | Vitest 단위 테스트 최소한 스토어에 추가 |
| bundle size | P3 | lucide-react 트리쉐이킹 확인, 코드 스플리팅 |

---

## 구현 규칙 (Claude 참고용)

1. **탭 추가 시**: `TabId` union에 추가 → 탭 버튼 배열에 `{ id, label, icon, color }` 추가 → 렌더 분기 추가
2. **스토어 추가 시**: Zustand slice 패턴, `fetch()` 내에서 병렬 로드, `api.ts`의 `apiFetch` 사용
3. **우측 패널**: 데스크톱 전용, `isMobile` 체크 후 `width: 272px` 컨테이너로 감싸기
4. **색상**: 모듈별 주 색상 — Tasks:blue, Habits:teal, Goals:violet, Finance:amber, Health:teal, Relationships:rose, Career:amber
5. **아이콘**: lucide-react만 사용, 기존 import에 추가
6. **type import**: `import type { X }` 반드시 사용 (verbatimModuleSyntax)
7. **커밋**: 기능 단위로 커밋, push 후 PR 생성 (draft)
