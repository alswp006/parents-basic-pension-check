import { calcSchedule } from '@/lib/schedule';
import { calcIncome, calcProperty, getThreshold, judge } from '@/lib/calculator';
import { calcPension } from '@/lib/pension';
import { POLICY_YEAR } from '@/lib/policy';
import { formatNumber } from '@/lib/utils';
import type { AppInput, AppResult, FormState } from '@/lib/types';

export { calcSchedule };

/** 금액 칸 상한 (만 원) */
export const AMOUNT_LIMIT_MANWON = { income: 10000, asset: 1000000 } as const;

const MANWON = 10000;
const MIN_BIRTH_YEAR = 1900;

const MSG_BIRTH = '올바른 생년월일을 입력해 주세요';
const MSG_INTEGER = '만 원 단위 정수로 입력해 주세요';

type AmountKind = keyof typeof AMOUNT_LIMIT_MANWON;
type AmountField = 'earned' | 'other' | 'general' | 'financial' | 'debt' | 'luxury';

const AMOUNT_FIELDS: Record<AmountField, AmountKind> = {
  earned: 'income',
  other: 'income',
  general: 'asset',
  financial: 'asset',
  debt: 'asset',
  luxury: 'asset',
};

/** 'YYYYMMDD'가 실존하는 날짜이고 1900-01-01 이후·오늘 이전(오늘 포함)인가 */
export function isValidBirthDate(yyyymmdd: string, today: Date): boolean {
  if (!/^\d{8}$/.test(yyyymmdd)) return false;
  const y = Number(yyyymmdd.slice(0, 4));
  const m = Number(yyyymmdd.slice(4, 6));
  const d = Number(yyyymmdd.slice(6, 8));
  if (y < MIN_BIRTH_YEAR) return false;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return false;
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return date.getTime() <= todayMidnight.getTime();
}

/**
 * 금액 칸(만 원) 검증. 우선순위: 정수 형식 → 음수 → 상한 초과.
 * 빈 문자열은 0원으로 보고 통과한다.
 */
export function validateAmountText(text: string, kind: AmountKind): string | undefined {
  const t = text.trim();
  if (t === '') return undefined;
  const limit = AMOUNT_LIMIT_MANWON[kind];
  const rangeMsg = `0 ~ ${formatNumber(limit)}만 원 사이로 입력해 주세요`;
  if (!/^-?\d+$/.test(t)) return MSG_INTEGER;
  if (t.startsWith('-')) return rangeMsg;
  return Number(t) > limit ? rangeMsg : undefined;
}

export function validateForm(
  form: FormState,
  today: Date,
): { errors: Partial<Record<keyof FormState, string>>; missingRequired: boolean; valid: boolean } {
  const errors: Partial<Record<keyof FormState, string>> = {};

  const birth = form.birthDate.trim();
  if (birth !== '' && !isValidBirthDate(birth, today)) errors.birthDate = MSG_BIRTH;

  (Object.keys(AMOUNT_FIELDS) as AmountField[]).forEach((field) => {
    const msg = validateAmountText(form[field], AMOUNT_FIELDS[field]);
    if (msg) errors[field] = msg;
  });

  const missingRequired = birth === '' || form.hasSpouse === null || form.region === null;
  const valid = !missingRequired && Object.keys(errors).length === 0;
  return { errors, missingRequired, valid };
}

function manwonToWon(text: string): number {
  const t = text.trim();
  return t === '' ? 0 : Number(t) * MANWON;
}

/** 검증을 통과한 폼 → 계산 입력 (금액은 만 원 × 10,000 = 원). */
export function toAppInput(form: FormState): AppInput {
  const b = form.birthDate.trim();
  const hasSpouse = form.hasSpouse === true;
  return {
    birthDate: `${b.slice(0, 4)}-${b.slice(4, 6)}-${b.slice(6, 8)}`,
    hasSpouse,
    spouseEligible: hasSpouse && form.spouseEligible,
    region: form.region ?? 'metro',
    monthlyEarnedIncome: manwonToWon(form.earned),
    monthlyOtherIncome: manwonToWon(form.other),
    generalProperty: manwonToWon(form.general),
    financialProperty: manwonToWon(form.financial),
    debt: manwonToWon(form.debt),
    luxuryAssets: manwonToWon(form.luxury),
  };
}

function collectNumbers(value: unknown, out: number[]): void {
  if (typeof value === 'number') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectNumbers(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collectNumbers(v, out));
}

/** 소득·재산·판정·수령액·일정을 한 번에 계산한다. 결과에 NaN/Infinity가 있으면 throw. */
export function runDiagnosis(input: AppInput, today: Date): AppResult {
  const income = calcIncome(input);
  const property = calcProperty(input);
  const recognizedIncome = income.total + property.total;
  const threshold = getThreshold(input.hasSpouse);
  const { ratio, verdict } = judge(recognizedIncome, threshold);
  const pension = calcPension(input, recognizedIncome, threshold);
  const schedule = calcSchedule(input.birthDate, today);

  const result: AppResult = {
    income,
    property,
    recognizedIncome,
    threshold,
    ratio,
    verdict,
    pension,
    schedule,
    policyYear: POLICY_YEAR,
  };

  const numbers: number[] = [];
  collectNumbers(result, numbers);
  if (numbers.some((n) => !Number.isFinite(n))) {
    throw new Error('진단 결과에 유효하지 않은 숫자가 있어요');
  }
  return result;
}
