# Rosterush

게임 캐릭터 이름을 전부 맞히는 타이핑 퀴즈.

## 요구 사항

- Node.js 24 (`.nvmrc`)
- pnpm 12
- Docker (로컬 DynamoDB)

## 구조

| 패키지   | 설명                                                   |
| -------- | ------------------------------------------------------ |
| `web/`   | Next.js 정적 export (Tailwind v4 + shadcn/ui)          |
| `api/`   | AWS Lambda (Serverless Framework v4)                   |
| `core/`  | 공유 로직: 정규화, 정답 판정, 백분위, 집계, API 스키마 |
| `games/` | 게임 정의 JSON + 검증                                  |

## 명령어

```bash
pnpm install          # 의존성 설치
pnpm dev              # web 개발 서버 → http://localhost:3000/ko/
pnpm build            # web 정적 빌드 → web/out
pnpm test             # Vitest (core, games, api)
pnpm typecheck        # 전체 타입 체크
pnpm lint             # Biome 검사
pnpm format           # Biome 자동 수정
pnpm validate:games   # 게임 데이터 검증
```

### 로컬 API

```bash
pnpm --filter @rosterush/api db:up     # DynamoDB Local 실행 (Docker)
pnpm --filter @rosterush/api db:init   # 테이블 생성
pnpm --filter @rosterush/api dev       # serverless offline → http://localhost:4000
```

`serverless` 명령은 Serverless Framework v4 로그인이 필요합니다 (`npx serverless login`).

## 게임 추가

1. `games/{id}.json` 작성 (형식은 `core/src/types.ts`의 `GameDef`)
2. `games/index.json`에 등록
3. `games/src/index.ts`의 `DEFS`에 추가
4. `pnpm validate:games`
