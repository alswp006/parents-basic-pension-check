import {
  THRESHOLD_SINGLE,
  THRESHOLD_COUPLE,
  EARNED_INCOME_DEDUCTION,
  EARNED_INCOME_RATE,
  FINANCIAL_DEDUCTION,
  BASIC_PROPERTY,
  PROPERTY_CONVERSION_RATE,
} from '@/lib/policy';
import type {
  AppInput,
  IncomeBreakdown,
  PropertyBreakdown,
  Verdict,
} from '@/lib/types';

export { calcPension } from '@/lib/pension';

/** 판정 경계: 비율 ≤ 0.9 → likely, ≤ 1.1 → borderline (정책 고시값이 아니라 안내 문구용 구간) */
const LIKELY_MAX_RATIO = 0.9;
const BORDERLINE_MAX_RATIO = 1.1;
const MONTHS_PER_YEAR = 12;

/** 연 환산 재산액 → 월 소득환산액 (원 미만 내림, 부동소수 오차 방지) */
function toMonthly(amount: number): number {
  return Math.floor((amount * PROPERTY_CONVERSION_RATE) / MONTHS_PER_YEAR + 1e-6);
}

/** 소득평가액 = 근로소득 반영분 + 기타소득 */
export function calcIncome(input: AppInput): IncomeBreakdown {
  const earnedReflected = Math.floor(
    Math.max(0, input.monthlyEarnedIncome - EARNED_INCOME_DEDUCTION) * EARNED_INCOME_RATE + 1e-6,
  );
  const other = Math.floor(input.monthlyOtherIncome);
  return { earnedReflected, other, total: earnedReflected + other };
}

/** 재산의 소득환산액(월). 고급자동차·회원권은 원 그대로 더한다. */
export function calcProperty(input: AppInput): PropertyBreakdown {
  const financialNet = Math.max(0, input.financialProperty - FINANCIAL_DEDUCTION);
  const basic = BASIC_PROPERTY[input.region];
  const net = input.generalProperty + financialNet - input.debt - basic;
  const luxury = input.luxuryAssets;

  return {
    general: toMonthly(input.generalProperty),
    financial: toMonthly(financialNet),
    debt: -toMonthly(input.debt),
    basicDeduction: -toMonthly(basic),
    luxury,
    clamped: net < 0,
    total: toMonthly(Math.max(0, net)) + luxury,
  };
}

/** 선정기준액 (월) */
export function getThreshold(hasSpouse: boolean): number {
  return hasSpouse ? THRESHOLD_COUPLE : THRESHOLD_SINGLE;
}

export function judge(
  recognizedIncome: number,
  threshold: number,
): { ratio: number; verdict: Verdict } {
  const ratio = recognizedIncome / threshold;
  const verdict: Verdict =
    ratio <= LIKELY_MAX_RATIO ? 'likely' : ratio <= BORDERLINE_MAX_RATIO ? 'borderline' : 'unlikely';
  return { ratio, verdict };
}
