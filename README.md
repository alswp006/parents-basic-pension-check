# Parents Basic Pension Check

앱 이름: 부모님 기초연금 / Parents Basic Pension Check > ⚠️ **확인이 필요한 수치**: 이 설계는 선정기준액, 기준연금액, 공제액, 기본재산액, 환산율 같은 정책 수치를 쓰지만 IDEA_BRIEF에는 이 값들이 없습니다. 그래서 설계 에이전트가 알고 있던 **2025년 보건복지부 고시값**을 임시로 넣었습니다. 이 값들은 `src/lib/policy.ts` 한 파일에만 모아 두었습니다. **출시 전에 올해(2026) 고시값으로 바꾸고 확인해야 합니다.** 아래 AC 예시는 모두 이 임시값으로 계산했습니다. 값을 바꾸면 예시 숫자도 다시 계산하세요. > 🆕 **시뮬레이션 반영 요약**: 새로 추가한 AC는 5개입니다. 추가한 곳에는 🆕 표시를 붙였습니다.

## Tech Stack

- React 18.0.0
- TypeScript
- Vitest

## Routes

| Path | Description |
|------|-------------|
| `/Home` | Home |
| `/Result` | Result |

## Getting Started

```bash
pnpm install
pnpm dev
```

## Development

```bash
pnpm typecheck    # Type checking
pnpm test         # Run tests
pnpm build        # Production build
```

## Design Documents

See `.ai-factory/` directory for full design artifacts:
- `prd.md` — Product Requirements Document
- `spec.md` — Technical Specification
- `task.md` — Epic/Task Breakdown

---
Built with [AI Factory](https://github.com/alswp006/ai-factory) · Last synced: 2026-09-29
