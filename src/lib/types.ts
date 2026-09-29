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
