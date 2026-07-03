# Node — AI 라이프 매니저

일정·할 일·재정·건강·학습·커리어·인간관계를 하나의 AI로 통합 관리하는 개인 생산성 플랫폼입니다.

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프론트엔드 | React 19 + TypeScript + Vite |
| 상태 관리 | Zustand |
| 라우팅 | React Router v7 |
| 스타일링 | CSS Modules |
| 차트 | Recharts + D3.js |
| 인증 | Amazon Cognito (aws-amplify) |
| API | AWS API Gateway HTTP API |
| 백엔드 | Python 3.12 Lambda (AWS SAM) |
| 데이터베이스 | Amazon DynamoDB (Single Table) |
| AI | Amazon Bedrock — Claude Sonnet |
| 호스팅 | CloudFront + S3 |
| IaC | AWS SAM |

---

## 프로젝트 구조

```
.
├── src/                          # 프론트엔드 소스
│   ├── app/                      # 라우터, 루트 컴포넌트, 프로바이더
│   ├── modules/                  # 도메인 모듈 (schedule, tasks, finance, health, learning, career, relationships)
│   ├── ai/                       # AI 서비스 레이어 (prompts, proactive triggers)
│   ├── shared/                   # 공유 컴포넌트 / 훅 / 유틸
│   └── styles/                   # 글로벌 CSS, 디자인 토큰
│
├── backend/                      # Lambda 함수 소스
│   ├── handlers/                 # 4개 Lambda 핸들러
│   │   ├── ai_handler.py         # AI 채팅 (POST /ai/chat)
│   │   ├── crud_handler.py       # 범용 CRUD (GET/POST/PUT/DELETE /{domain})
│   │   ├── proactive_handler.py  # 일일 브리핑 (EventBridge 07:00 KST)
│   │   └── career_coach_handler.py # AI 커리어 코치 5단계 파이프라인
│   ├── repositories/             # DynamoDB Single Table 접근 계층
│   │   ├── base_repo.py          # BaseRepository (put/get/query/delete)
│   │   └── __init__.py           # get_repository() 팩토리
│   ├── prompts/                  # Bedrock 시스템 프롬프트
│   │   ├── system.py             # 범용 AI 어시스턴트 프롬프트
│   │   └── career_coach.py       # 커리어 코치 전용 프롬프트
│   ├── utils/
│   │   ├── cost_guard.py         # Bedrock 월 예산 추적 ($10/월)
│   │   └── response.py           # Lambda 응답 헬퍼
│   ├── tests/                    # pytest 단위 테스트
│   └── requirements.txt
│
├── infrastructure/
│   ├── template.yaml             # AWS SAM 템플릿
│   └── samconfig.toml            # SAM 배포 설정
│
└── .github/workflows/deploy.yml  # CI/CD 파이프라인
```

---

## 로컬 개발 환경 설정

### 사전 요구사항

- Node.js 20+
- Python 3.12+
- AWS CLI + AWS SAM CLI
- AWS 계정 (Cognito, DynamoDB, Bedrock, Lambda, S3, CloudFront)

### 프론트엔드

```bash
npm install
cp .env.example .env.local
# .env.local에 배포 후 받은 값 입력
npm run dev
```

### 백엔드 로컬 실행

```bash
cd infrastructure
sam build
sam local start-api --env-vars env.json
```

`env.json` 예시:
```json
{
  "AiChatFunction": {
    "TABLE_NAME": "node-main-dev",
    "BEDROCK_MODEL_ID": "anthropic.claude-sonnet-4-20250514",
    "BEDROCK_REGION": "us-east-1",
    "MONTHLY_AI_BUDGET": "10.0"
  }
}
```

---

## AWS 배포

### 최초 배포

```bash
cd infrastructure
sam build
sam deploy --guided
```

배포 완료 후 Outputs에서 다음 값을 `.env.local`에 입력하세요:

| Output Key | .env.local 변수 |
|------------|----------------|
| `ApiUrl` | `VITE_API_URL` |
| `UserPoolId` | `VITE_COGNITO_USER_POOL_ID` |
| `UserPoolClientId` | `VITE_COGNITO_CLIENT_ID` |

### 프론트엔드 빌드 & S3 업로드

```bash
npm run build
aws s3 sync dist/ s3://<FrontendBucketName> --delete
aws cloudfront create-invalidation --distribution-id <CF_DIST_ID> --paths "/*"
```

### CloudFront → API Gateway 프록시 활성화 (선택)

최초 배포 후 `ApiDomainName` 출력값을 `ApiDomainName` 파라미터로 설정하여 재배포:

```bash
sam deploy --parameter-overrides ApiDomainName=<ApiDomainName 출력값>
```

---

## GitHub Actions CI/CD

`main` 브랜치에 푸시하면 변경된 부분(프론트엔드/백엔드)만 자동 배포됩니다.

필요한 GitHub Secrets:

| Secret | 설명 |
|--------|------|
| `AWS_ACCESS_KEY_ID` | AWS IAM 액세스 키 |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM 시크릿 키 |

---

## DynamoDB 테이블 설계 (Single Table)

테이블명: `node-main-{env}`

| 키 | 예시 | 용도 |
|----|------|------|
| PK | `USER#abc123` | 사용자 파티션 |
| SK | `TASK#uuid` | 엔티티 유형 + ID |
| GSI1PK | `TASK` | 타입별 전체 조회 |
| GSI1SK | `todo#2026-07-10` | 상태+날짜 정렬 |
| GSI2PK | `USER#abc123#TASK` | 사용자+타입 복합 조회 |
| GSI2SK | `urgent#2026-07-10` | 커스텀 정렬 |

지원 도메인: `events`, `tasks`, `projects`, `transactions`, `budgets`, `workouts`, `sleep`, `health`, `learning`, `study`, `books`, `contacts`, `meetings`, `career-goals`, `skills`, `achievements`, `job-apps`, `journals`, `certs`, `salary`, `work-logs`, `career-targets`, `career-paths`, `coaching`

---

## AI 비용 관리

Bedrock은 프리 티어가 없습니다. `BedrockCostGuard`가 월 $10 예산을 추적하며 초과 시 AI 요청을 차단합니다.

사용량은 DynamoDB의 `USAGE#{userId}` / `MONTH#{YYYY-MM}` 항목에 저장됩니다.

---

## 환경 변수 참조

### 프론트엔드 (`.env.local`)

```env
VITE_API_URL=https://xxxxxxxxxx.execute-api.ap-northeast-2.amazonaws.com/dev
VITE_COGNITO_USER_POOL_ID=ap-northeast-2_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_AWS_REGION=ap-northeast-2
```

### 백엔드 (SAM에서 자동 주입)

```env
TABLE_NAME=node-main-dev
BEDROCK_MODEL_ID=anthropic.claude-sonnet-4-20250514
BEDROCK_REGION=us-east-1
MONTHLY_AI_BUDGET=10.0
```
