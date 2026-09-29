// ⚠️ 2025년 고시값(임시). 출시 전 해당 연도 보건복지부 고시로 교체·검증 필수
// 정책 숫자는 이 파일에서만 import해서 쓴다. 금액은 원 단위.

export const POLICY_YEAR = 2025 as const;

/** 선정기준액 (월) */
export const THRESHOLD_SINGLE = 2280000 as const;
export const THRESHOLD_COUPLE = 3648000 as const;

/** 기준연금액 (월) */
export const BASE_PENSION = 342510 as const;

/** 근로소득 공제(월)와 반영률 */
export const EARNED_INCOME_DEDUCTION = 1120000 as const;
export const EARNED_INCOME_RATE = 0.7 as const;

/** 금융재산 공제 */
export const FINANCIAL_DEDUCTION = 20000000 as const;

/** 지역별 기본재산액 */
export const BASIC_PROPERTY = {
  metro: 135000000,
  city: 85000000,
  rural: 72500000,
} as const;

/** 재산의 월 소득환산율 (연 4%) */
export const PROPERTY_CONVERSION_RATE = 0.04 as const;

/** 부부 동시 수급 시 감액률 */
export const COUPLE_REDUCTION = 0.2 as const;

/** 최저 연금액 비율 (기준연금액 대비) */
export const MIN_PENSION_RATE = 0.1 as const;
