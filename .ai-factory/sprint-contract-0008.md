# Sprint Contract — 패킷 0008
<!-- 파이프라인이 이 패킷을 위해 생성(순수 생성 콜) — 다른 패킷의 계약서가 아니다 -->

# Sprint Contract: Routing & Integration

## 만들 항목
- **src/App.tsx**: BrowserRouter (main.tsx가 미감싸면) 또는 Routes만 추가; Home('/')과 Result('/result') 라우트 등록; 미지정 경로는 Navigate로 '/' 리다이렉트

## 사용할 TypeScript 타입
- src/lib/types.ts에서 import: `AppInput`, `AppResult`

## 검증 방법
1. 라우팅: '/' → Home, '/result' → Result, '/unknown' → '/' 리다이렉트 확인
2. 보안: `grep -rE 'href="http|window\.open|gtag|amplitude|location\.href *=' src` 결과 0건
3. 콘솔: 입력 → 결과 → 재계산 흐름 중 console.error 0건
4. Ad 오류: VITE_TOSS_AD_GROUP_ID 비워서 빌드 후 전체 흐름 동작 확인; 앱 렌더 광고 오류 0건
5. 테스트: npm run build, npx vitest run 모두 성공

## 절대 금지
- src/main.tsx 수정 불가
- src/components/AdSlot* 파일 수정 불가 (diff 0줄)
