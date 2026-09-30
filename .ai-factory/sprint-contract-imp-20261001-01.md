# Sprint Contract — 패킷 imp-20261001-01
<!-- 파이프라인이 이 패킷을 위해 생성(순수 생성 콜) — 다른 패킷의 계약서가 아니다 -->

# Sprint Contract: [개선] 행동 로그·리뷰·공유 1가지 추가

## 만들 항목
- **src/pages/Home.tsx**: 공유 진입점 추가 (TDS 버튼 또는 플로팅 요소로 사용자가 계산 결과를 공유할 수 있도록)
- **src/pages/Result.tsx**: 공유 진입점 추가 (TDS 버튼 또는 플로팅 요소로 최종 결과를 공유할 수 있도록)

## 사용 TypeScript 타입
import AppResult, AppInput, Verdict, ScheduleResult from src/lib/types.ts

## 검증 방법
1. npm run build 성공, npx tsc --noEmit 에러 없음
2. Home.tsx에서 공유 UI 요소 시각적 확인
3. Result.tsx에서 공유 UI 요소 시각적 확인
4. 라우팅 동작 확인 (기존 경로 /home, /result 정상 작동)

## 절대 금지
- src/main.tsx 수정 금지
- 라우트 경로 변경 금지 (기존 createBrowserRouter 유지)
- TDS 외 UI 라이브러리 추가 금지
- 기존 컴포넌트 레이아웃 구조 변경 금지
