🇰🇷 [English](./README.md)

# 부모님 기초연금 — 기초연금 수급 자격을 몇 초 만에 진단하세요

성인 자녀들이 부모님이 한국의 기초노령연금을 받을 자격이 있는지 판단하도록 돕는 앱인토스 미니앱입니다. 부모님의 나이, 거주지, 소득/재산 정보를 입력하면 수급 가능성(높음 / 예상 기준선 / 낮음) 판정, 예상 월 수령액, 신청 시점을 즉시 확인할 수 있습니다.

## 기능

- 💰 **자격 진단** — 근로소득·기타소득·재산소득 환산을 종합하여 소득인정액을 계산하고, 선정 기준액과 비교해 수급 가능성을 예측합니다
- 📊 **연금액 예측** — 배우자 감액(20%)과 역진적 소득보전 조정을 포함한 예상 월 수령액을 계산합니다
- 📅 **신청 시점 계산** — 65세 도달 시 수급 자격 판정 및 D-day 카운트다운을 표시합니다
- 📈 **재산 명세** — 부동산·금융자산·부채·기본공제·자동차·골프회원권별 환산 내역을 확인할 수 있습니다
- 💾 **자동 저장** — 마지막 입력값을 로컬에 저장해 다시 검사할 때 재입력을 생략할 수 있습니다

## 기술 스택

- **Framework**: Vite + React 18
- **Routing**: React Router DOM 7
- **UI Components**: Toss Design System (TDS Mobile)
- **State**: React Context + localStorage (SDK `Storage`로 네이티브 영속성 지원)
- **Testing**: Vitest (유닛) + Playwright (비주얼)
- **Styling**: Emotion

## 시작하기

### 의존성 설치
```bash
npm install
```

### 운영 빌드
```bash
npx vite build
```

`dist/` 디렉토리에 CDN 호스팅용 정적 번들을 생성합니다. 서버 사이드 렌더링이나 동적 라우트는 지원하지 않습니다.

### 앱인토스에 배포
```bash
npx ait build
npx ait deploy --api-key YOUR_API_KEY
```

정적 번들을 토스 CDN에 배포합니다. 처음 설정할 때는 토스 개발자 콘솔에서 앱을 등록하세요.

### 테스트 실행
```bash
npx tsc --noEmit        # 타입 검사
npx vitest run          # 유닛 테스트
npm run test:visual     # 비주얼 회귀 테스트 (Playwright)
```

## 환경 변수

| 변수 | 설명 | 필수 |
|---|---|---|
| `VITE_SHARE_OG_URL` | 공유 미리보기(카카오톡, SMS)용 Open Graph 이미지 URL | 아니오 |
| `VITE_TOSS_AD_SLOT_ID` | 토스 개발자 콘솔에서 발급한 배너 광고 슬롯 ID | 아니오 |
| `VITE_TOSS_IAP_SKU` | 인앱 결제 SKU (이 앱에서는 미사용) | 아니오 |
| `VITE_TOSS_PROMOTION_CODE` | 사용자 보상용 프로모션 코드 | 아니오 |

`.env.example`을 템플릿으로 참고하세요. Vite가 빌드 시점에 이 변수들을 주입합니다. 비워두면 우아하게 품질 저하됩니다(해당 기능 미지원, 흰 화면 없음).

## 프로젝트 구조

```
src/
├── pages/                 # 화면 컴포넌트
│   ├── Home.tsx          # 입력 폼: 인구통계, 소득, 재산
│   └── Result.tsx        # 결과: 자격 판정, 연금액 예측, 신청 시기
├── components/           # 재사용 가능한 UI (TDS 래퍼 + 사전 구축)
│   ├── ScreenScaffold.tsx
│   ├── SummaryHero.tsx
│   ├── Card.tsx
│   ├── BreakdownSection.tsx
│   └── ... (10개 이상의 보조 컴포넌트)
├── lib/                  # 핵심 로직
│   ├── calculator.ts     # 기초연금 자격 및 금액 계산
│   ├── pension.ts        # 자격 판정 로직
│   ├── policy.ts         # 2025년 기준 (2026 출시 전 업데이트 필요)
│   ├── validation.ts     # 입력 필드 검증
│   ├── sanitize.ts       # 입력 정제 (쉼표 제거, 숫자 파싱)
│   ├── storedInput.ts    # localStorage + 상태 동기화
│   ├── types.ts          # 공유 TypeScript 타입
│   └── ... (계측, 공유, 리뷰, 스케줄링)
├── __tests__/            # Vitest 유닛 테스트
├── App.tsx               # 라우트 정의
└── main.tsx              # React 루트 (수정 금지)
```

## 정책 기준 (2025년 — 2026 출시 전 업데이트 필수)

`src/lib/policy.ts`의 다음 상수들을 매년 업데이트해야 합니다:

- 선정 기준액: 2,280,000원(단독) / 3,648,000원(부부)
- 기초연금: 342,510원/월
- 근로소득 공제: 1,120,000원
- 기본 재산공제: 135M(대도시) / 85M(중소도시) / 72.5M(농어촌)
- 재산 환산율: 연 4%

2026년 운영 출시 전에 보건복지부 공시를 통해 현재 기준값을 확인하세요.

## 배포

앱은 앱인토스 플랫폼(기존 CDN이 아님)을 통해 토스에 배포됩니다. 빌드 프로세스:

1. **정적 번들 빌드**: `npx vite build` → `dist/` (CSR만, SSR 없음)
2. **인증**: `npx ait build`로 토스 WebView용으로 컴파일
3. **토스 CDN 제출**: `npx ait deploy`로 https://{appName}.web.tossmini.com에 배포

토스 검수 체크리스트:
- ✅ 콘솔 에러 0개
- ✅ CORS 에러 0개 (외부 서버 API 호출 시 CORS 헤더 필요)
- ✅ 외부 도메인 이동 금지 (3rd party 사이트로 window.location.href 사용 금지)
- ✅ 19세 이상 사용자만
- ✅ 뒤로가기·닫기 버튼 정상 동작 (React Router 사용, 커스텀 히스토리 금지)
- ✅ 코드에 테스트 광고/프로모션 키 미포함 (환경 변수 사용)

## 라이선스

MIT
