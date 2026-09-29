# Shared Context (auto-generated — do NOT modify)


## 패킷 간 계약 (src/lib/contract.ts — 자동 생성, 수정 금지)
여기 선언된 이름·인자·반환 타입은 확정이다. 기반 패킷은 이대로 구현하고,
화면 패킷은 이대로 호출하라. 다르게 만들지 마라.

```typescript
/**
 * 패킷 간 인터페이스 계약 — 자동 생성. **수정하지 마라.**
 *
 * 기반 패킷은 여기 선언된 모양 그대로 구현하고, 화면 패킷은 여기 적힌 이름·인자·반환
 * 타입을 그대로 가정해도 된다. 추측이 어긋나 병합에서 무너지는 것을 막기 위한 파일이다.
 */

/** 지역 구분 (구현: 패킷 0001) */
export type Region = '서울'|'경기'|'인천'|'강원'|'충청'|'전라'|'경상'|'제주';

/** 기초연금 판정 결과 (구현: 패킷 0001) */
export type Verdict = '받을 가능성이 높아요'|'받을 수 있어요'|'어려울 수 있어요';

/** 감액 정보 (배우자, 소득역전) (구현: 패킷 0001) */
export type Reduction = { spouse: number; reversal: number };

/** 앱 진단 입력값 (YYYYMMDD 생년월일, 월 단위 금액) (구현: 패킷 0001) */
export type AppInput = { birthDate: string; hasSpouse: boolean; region: Region; monthlyEarnedIncome: number; monthlyOtherIncome: number; businessIncome: number; rentalIncome: number; generalAsset: number; financialAsset: number; debt: number };

/** 소득 환산 내역 (소득평가액) (구현: 패킷 0001) */
export type IncomeBreakdown = { earnedIncome: number; earnedReduction: number; otherIncome: number; total: number };

/** 재산 환산 내역 (월 단위, clamped=기본재산 적용됨) (구현: 패킷 0001) */
export type PropertyBreakdown = { generalAsset: number; financialAsset: number; assetDeduction: number; debt: number; basicAsset: number; environmentalIncome: number; clamped: boolean };

/** 판정 결과 (원 단위, ratio=백분율) (구현: 패킷 0001) */
export type PensionResult = { verdict: Verdict; recognizedIncome: number; baseAmount: number; ratio: number; monthlyAmount: number; reductionAmount: number; appliedReduction: Reduction };

/** 신청 일정 (YYYY-MM-DD 형식) (구현: 패킷 0001) */
export type ScheduleResult = { turns65On: string; applyFrom: string; daysUntilApply: number; age: number };

/** 진단 최종 결과 (구현: 패킷 0001) */
export type AppResult = { schedule: ScheduleResult; income: IncomeBreakdown; property: PropertyBreakdown; pension: PensionResult };

/** 폼 입력 상태 (금액=문자열, errors 맵) (구현: 패킷 0001) */
export type FormState = { birthDate: string; hasSpouse: boolean; region: Region; monthlyEarnedIncome: string; monthlyOtherIncome: string; businessIncome: string; rentalIncome: string; generalAsset: string; financialAsset: string; debt: string; errors: {[key: string]: string} };

/** Result 페이지 라우트 상태 (구현: 패킷 0001) */
export type RouteState = { result: AppResult };

/** 소득평가액 계산 (근로소득, 기타소득 포함) (구현: 패킷 0002) */
export type calcIncomeFn = (input: AppInput) => IncomeBreakdown;

/** 재산환산액 계산 (월 단위) (구현: 패킷 0002) */
export type calcPropertyFn = (input: AppInput) => PropertyBreakdown;

/** 선정기준액 계산 (소득인정액) (구현: 패킷 0002) */
export type getThresholdFn = (income: IncomeBreakdown, property: PropertyBreakdown) => number;

/** 판정 및 수령액 계산 (비율, 감액 적용) (구현: 패킷 0002) */
export type judgeFn = (input: AppInput, threshold: number, schedule: ScheduleResult) => PensionResult;

/** 통합 연금 계산 함수 (calcIncome+calcProperty+getThreshold+judge) (구현: 패킷 0002) */
export type calcPensionFn = (input: AppInput, schedule: ScheduleResult) => PensionResult;

/** 신청 일정 계산 (YYYYMMDD 형식, 만 65세 생일 기준) (구현: 패킷 0003) */
export type calcScheduleFn = (birthDate: string, today: string) => ScheduleResult;

/** 폼 검증 (에러 메시지 배열, null=유효) (구현: 패킷 0003) */
export type validateFormFn = (form:
```

## Shared Types Contract (IMPORT these, do NOT redefine)
```typescript
// Domain types — SPEC Data Model
export type Region = 'metro' | 'city' | 'rural';
export type Verdict = 'likely' | 'borderline' | 'unlikely';
export type Reduction = 'couple' | 'incomeReversal';

/** 계산 입력. 금액은 원 단위, birthDate는 'YYYY-MM-DD'. localStorage 'bpc:lastInput'에 저장된다. */
export interface AppInput {
  birthDate: string; // 'YYYY-MM-DD'
  hasSpouse: boolean;
  /** 배우자도 만 65세 이상. 규칙: hasSpouse=false면 spouseEligible은 항상 false */
  spouseEligible: boolean;
  region: Region;
  monthlyEarnedIncome: number; // 원, 부부 합산
  monthlyOtherIncome: number; // 원
  generalProperty: number; // 원
  financialProperty: number; // 원
  debt: number; // 원
  luxuryAssets: number; // 원 (고급자동차·회원권 가액, 월 소득으로 100% 반영)
}

export interface IncomeBreakdown {
  earnedReflected: number;
  other: number;
  total: number;
}

export interface PropertyBreakdown {
  // 모두 월 환산액(부호 포함)
  general: number;
  financial: number;
  debt: number;
  basicDeduction: number;
  luxury: number;
  clamped: boolean;
  total: number;
}

export interface PensionResult {
  eligible: boolean;
  recipients: 1 | 2;
  perPerson: number;
  household: number;
  reductions: Reduction[];
}

export interface ScheduleResult {
  age: number;
  turns65On: string;
  applyFrom: string;
  canApplyNow: boolean;
  dDay: number; // canApplyNow면 dDay=0
}

export interface AppResult {
  income: IncomeBreakdown;
  property: PropertyBreakdown;
  recognizedIncome: number;
  threshold: number;
  ratio: number;
  verdict: Verdict;
  pension: PensionResult;
  schedule: ScheduleResult;
  policyYear: number;
}

// Home 폼 상태 (문자열 입력, 금액은 만 원 단위)
export interface FormState {
  birthDate: string;
  hasSpouse: boolean | null;
  spouseEligible: boolean;
  region: Region | null;
  earned: string;
  other: string;
  general: string;
  financial: string;
  debt: string;
  luxury: string;
}

// Route state (react-router useNavigate)
export interface RouteState {
  input: AppInput;
  result: AppResult;
}

```

## Existing Codebase (import and use these — do NOT recreate)
### File Tree (src/)
  App.tsx
  components/
    AdSlot.tsx
    Amount.tsx
    BottomCTA.tsx
    BreakdownSection.tsx
    Card.tsx
    CountUp.tsx
    FloatingTabBar.tsx
    MiniBar.tsx
    PageShell.tsx
    ScreenScaffold.tsx
    Sparkline.tsx
    StateView.tsx
    SummaryHero.tsx
    TossPurchase.tsx
    TossRewardAd.tsx
  hooks/
  lib/
    analytics.ts
    calculator.test.ts
    calculator.ts
    contract.ts
    pension.ts
    policy.ts
    review.ts
    sanitize.test.ts
    sanitize.ts
    schedule.ts
    share.ts
    storage.ts
    storedInput.test.ts
    storedInput.ts
    types.ts
    utils.ts
    validation.test.ts
    validation.ts
  main.tsx
  pages/
    Home.tsx
    Result.tsx
    __TdsGallery.tsx
  styles/
    globals.css
    reward-ad.css
  types/
  vite-env.d.ts

### Exports (src/lib/)
- analytics.ts: export type LogFields = Record<string, string | number | boolean | null>; export const DWELL_MS = 3000; export function fireAndForget(call: () => unknown): void; export function logScreen(page: string, extra?: LogFields): void; export function logClick(name: string, extra?: LogFields): void; export function logImpression(name: string, extra?: LogFields): void; export function useScreenLog(page: string): void
- calculator.ts: export function calcIncome(input: AppInput): IncomeBreakdown; export function calcProperty(input: AppInput): PropertyBreakdown; export function getThreshold(hasSpouse: boolean): number; export function judge( recognizedIncome: number, threshold: number, ):
- contract.ts: export type Region = '서울'|'경기'|'인천'|'강원'|'충청'|'전라'|'경상'|'제주'; export type Verdict = '받을 가능성이 높아요'|'받을 수 있어요'|'어려울 수 있어요'; export type Reduction =; export type AppInput =; export type IncomeBreakdown =; export type PropertyBreakdown =; export type PensionResult =; export type ScheduleResult =
- pension.ts: export function calcPension( input: AppInput, recognizedIncome: number, threshold: number, ): PensionResult
- policy.ts: export const POLICY_YEAR = 2025 as const; export const THRESHOLD_SINGLE = 2280000 as const; export const THRESHOLD_COUPLE = 3648000 as const; export const BASE_PENSION = 342510 as const; export const EARNED_INCOME_DEDUCTION = 1120000 as const; export const EARNED_INCOME_RATE = 0.7 as const; export const FINANCIAL_DEDUCTION = 20000000 as const; export const BASIC_PROPERTY =
- review.ts: export function requestReviewOnce(key: string = REVIEW_REQUESTED_KEY): void
- sanitize.ts: export function sanitizeAmount(raw: string | null | undefined): string; export function sanitizeBirthDate(raw: string | null | undefined): string
- schedule.ts: export function calcSchedule(birthDate: string, today: Date): ScheduleResult
- share.ts: export interface ShareAppOptions; export async function shareApp(opts: ShareAppOptions): Promise<void>
- storage.ts: export function getItem<T>(key: string): T | null; export function setItem<T>(key: string, value: T): void; export function removeItem(key: string): void
- storedInput.ts: export const LAST_INPUT_KEY = 'bpc:lastInput'; export function saveLastInput(input: AppInput): boolean; export function loadLastInput(today: Date = new Date()): AppInput | null; export function toFormState(input: AppInput): FormState
- types.ts: export type Region = 'metro' | 'city' | 'rural'; export type Verdict = 'likely' | 'borderline' | 'unlikely'; export type Reduction = 'couple' | 'incomeReversal'; export interface AppInput; export interface IncomeBreakdown; export interface PropertyBreakdown; export interface PensionResult; export interface ScheduleResult
- utils.ts: export function cn(...classes: (string | boolean | undefined | null)[]): string; export function formatNumber(n: number): string; export function formatCurrency(n: number, currency = 'KRW'): string
- validation.ts: export const AMOUNT_LIMIT_MANWON =; export function isValidBirthDate(yyyymmdd: string, today: Date): boolean; export function validateAmountText(text: string, kind: AmountKind): string | undefined; export function validateForm( form: FormState, today: Date, ):; export function toAppInput(form: FormState): AppInput; export function runDiagnosis(input: AppInput, today: Date): AppResult

### Components (src/components/)
- AdSlot.tsx: AdSlot
- Amount.tsx: Amount
- BottomCTA.tsx: SubmitFooter, ButtonStack
- BreakdownSection.tsx: BreakdownSection
- Card.tsx: Card
- CountUp.tsx: CountUp
- FloatingTabBar.tsx: FloatingTabBar
- MiniBar.tsx: MiniBar
- PageShell.tsx: PageShell
- ScreenScaffold.tsx: ScreenScaffold
- Sparkline.tsx: Sparkline
- StateView.tsx: EmptyState, LoadingState
- SummaryHero.tsx: SummaryHero
- TossPurchase.tsx: TossPurchase
- TossRewardAd.tsx: TossRewardAd

### Module Dependencies (import graph)
  lib/calculator.ts → imports: lib/policy, lib/types, lib/pension
  lib/pension.ts → imports: lib/policy, lib/types
  lib/schedule.ts → imports: lib/types
  lib/storedInput.ts → imports: lib/validation, lib/types
  lib/validation.ts → imports: lib...
CRITICAL: Before creating any new function, type, or component, check the list above. If something similar exists, import and use it.

## Already Implemented (do NOT duplicate or overwrite)
- 0001: Types & Policy Constants (files: src/lib/types.ts, src/lib/policy.ts)
- 0002: Core Logic: 소득인정액·판정·수령액 (files: src/lib/calculator.ts, src/lib/pension.ts, src/lib/calculator.test.ts)
- 0003: Schedule, Validation & runDiagnosis (files: src/lib/schedule.ts, src/lib/validation.ts, src/lib/validation.test.ts)
- 0004: Input Sanitize & Safe Storage (files: src/lib/sanitize.ts, src/lib/storedInput.ts, src/lib/storedInput.test.ts)
- 0005: Home Page: 입력 폼·검증·제출 (files: src/pages/Home.tsx)

## Available exports from existing files
// src/components/AdSlot.tsx
export function AdSlot({ adGroupId, className, variant, theme }: AdSlotProps) {

// src/components/Amount.tsx
export function Amount({

// src/components/BottomCTA.tsx
export function SubmitFooter({
export function ButtonStack({

// src/components/BreakdownSection.tsx
export default function BreakdownSection({ income, property }: BreakdownSectionProps) {

// src/components/Card.tsx
export function Card({

// src/components/CountUp.tsx
export function CountUp({

// src/components/FloatingTabBar.tsx
export type TabItem = {
export function FloatingTabBar({ items }: { items: TabItem[] }) {

// src/components/MiniBar.tsx
export function MiniBar({

// src/components/PageShell.tsx
export function PageShell({

// src/components/ScreenScaffold.tsx
export function ScreenScaffold({

// src/components/Sparkline.tsx
export function Sparkline({

// src/components/StateView.tsx
export function EmptyState({
export function LoadingState({

// src/components/SummaryHero.tsx
export function SummaryHero({

// src/components/TossPurchase.tsx
export interface TossPurchaseResult {
export function TossPurchase({

// src/components/TossRewardAd.tsx
export function TossRewardAd({

// src/lib/analytics.ts
export type LogFields = Record<string, string | number | boolean | null>;
export const DWELL_MS = 3000;
export function fireAndForget(call: () => unknown): void {
export function logScreen(page: string, extra?: LogFields): void {
export function logClick(name: string, extra?: LogFields): void {
export function logImpression(name: string, extra?: LogFields): void {
export function useScreenLog(page: string): void {

// src/lib/calculator.ts
export { calcPension } from '@/lib/pension';
export function calcIncome(input: AppInput): IncomeBreakdown {
export function calcProperty(input: AppInput): PropertyBreakdown {
export function getThreshold(hasSpouse: boolean): number {
export function judge(

// src/lib/contract.ts
export type Region = '서울'|'경기'|'인천'|'강원'|'충청'|'전

## Memory Index (자동 학습 — 힌트로만 사용, 실제 코드 확인 필수)

Available topics: deploy(4), general(14), testing(2), ui(3)

Key lessons (verify against actual code before applying):
- [general] 진입점 라우터 배선은 맨 끝에 두지 말고 기반 패킷 직후 플레이스홀더 페이지와 함께 먼저 병합하라. 화면 패킷은 그 플레이스홀더를 교체하게 해서, 언제 중단돼도 병합된 화면에 도달할 수 있게 하라. (60% · 타 앱 1회 — 맹신 금지)
- [general] 파일 생성 전 디렉토리 구조 확인 — mkdir -p로 경로 보장 (60% · 타 앱 1회 — 맹신 금지)
- [general] 화면·라우팅 등 소비자 모듈은 그것이 import하는 생산자 모듈이 병합된 뒤에만 병합하고, 순서를 지킬 수 없으면 소비자 병합과 동시에 최소 플레이스홀더를 만들어 매 병합 직후 타입체크와 빌드가 항상 통과하도록 유지하라. (60% · 타 앱 1회 — 맹신 금지)
- [general] 전역 라우팅·탭바·Provider 배선은 개별 화면보다 먼저(초반 20% 안에) 완료하고 미구현 화면은 스텁 라우트로 연결해, 시간 예산이 소진돼도 앱이 항상 실행 가능한 상태를 유지하라. (60% · 타 앱 1회 — 맹신 금지)
- [general] 저장·데이터 접근 등 기반 계층 패킷은 이를 import 하는 화면 패킷보다 반드시 먼저 완료·병합하고, 미완료면 상위 화면 패킷 병합을 차단하라 — 빈 기반 모듈 하나가 전 라우트 스모크를 무너뜨린다. (60% · 타 앱 1회 — 맹신 금지)