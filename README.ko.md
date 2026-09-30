🇰🇷 [English](./README.md)

# 부모님 기초연금 자격 확인 — 자격 계산기

토스 미니앱으로, 사용자가 부모님의 기초연금 수혜 자격을 확인할 수 있도록 돕습니다. 생년월일, 배우자 유무, 거주 지역, 월 소득, 재산 정보를 입력하면 즉시 자격 여부, 예상 월 급여액, 신청 시기 안내를 받습니다.

## 기능

- 📋 부모님 개인정보 입력 양식 (생년월일, 배우자 유무, 거주 지역)
- 💰 월 소득 입력 (근로소득 및 기타 소득)
- 🏠 재산 평가 (부동산, 금융자산, 부채, 사치품)
- ✅ 3단계 판정 결과의 즉시 자격 진단
- 💵 월 급여 추정액 계산 (개인별 및 가구별)
- 📅 신청 시기 안내 및 D-day 카운트다운
- 🏷️ 감액 상세정보 (부부 감액, 소득역전 방지)
- 📊 소득/재산 상세 내역 표시
- 💾 장치 저장소에 양식 자동 저장
- 📤 맞춤형 메시지로 인앱 공유
- ⭐ 성공적인 진단 후 앱 리뷰 요청
- 📢 배너 광고 슬롯 통합

## 기술 스택

- **Framework**: React 18 + Vite
- **Routing**: React Router 7
- **UI**: Toss Design System (TDS) — `@toss/tds-mobile`
- **SDK**: App-in-Toss (`@apps-in-toss/web-framework`)
- **Language**: TypeScript
- **Testing**: Vitest (unit), Playwright (visual)
- **Styling**: Emotion + TDS adaptive CSS variables

## 시작하기

### 의존성 설치
```bash
npm install
```

### 프로덕션 빌드
```bash
npx vite build
```

### 토스에 배포
```bash
npx ait build
```

그 다음 토스 개발자 콘솔을 통해 번들을 검수용으로 제출합니다.

### 테스트 실행
```bash
npx vitest run              # 단위 테스트
npm run test:visual         # 비주얼 회귀 테스트 (Playwright)
```

## 환경 변수

| 변수 | 설명 | 필수 |
|------|------|------|
| `VITE_TOSS_AD_GROUP_ID` | 토스 콘솔의 배너 광고 그룹 ID | 아니오 |
| `VITE_TOSS_AD_SLOT_ID` | 전면 광고 슬롯 ID | 아니오 |
| `VITE_TOSS_IAP_SKU` | 인앱 구매 SKU | 아니오 |
| `VITE_TOSS_PROMOTION_CODE` | 프로모션 보상 코드 | 아니오 |
| `VITE_SHARE_OG_URL` | 공유 미리보기용 OG 이미지 URL | 아니오 |

`.env.example`을 `.env`로 복사한 후 토스 개발자 콘솔의 값을 입력하세요. 값이 없으면 해당 기능이 생략되며, 앱이 깨지지 않습니다.

## 프로젝트 구조

```
src/
  pages/              — 화면 컴포넌트 (Home, Result)
  components/         — 재사용 가능한 TDS 기반 UI 위젯
  lib/                — 비즈니스 로직 (연금 계산, 검증, 저장소)
  __tests__/          — 단위 및 통합 테스트
  styles/             — 전역 스타일
```

## 배포

1. **빌드**: `npx vite build`로 `dist/` 디렉토리에 정적 번들 생성
2. **토스 콘솔**: `npx ait build`로 토스 호환 번들 준비
3. **검수**: [토스 개발자 콘솔](https://console.tossmini.com)을 통해 제출
4. **CDN 호스팅**: 토스 CDN이 자동으로 앱을 호스팅하므로 외부 배포가 필요하지 않습니다.

앱은 두 가지 origin에서 실행됩니다:
- 운영: `https://{appName}.web.tossmini.com`
- QR 테스트: `https://{appName}.private-web.tossmini.com`

외부 API는 CORS 헤더에서 두 origin을 모두 허용해야 합니다.

## 라이선스

MIT
