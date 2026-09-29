import { AMOUNT_LIMIT_MANWON, isValidBirthDate } from '@/lib/validation';
import type { AppInput, FormState, Region } from '@/lib/types';

export const LAST_INPUT_KEY = 'bpc:lastInput';

/** 폼(만 원) ↔ AppInput(원) 단위 환산. 상한이 아니라 단위다. */
const WON_PER_MANWON = 10000;

const REGIONS: readonly Region[] = ['metro', 'city', 'rural'];

type AmountKey =
  | 'monthlyEarnedIncome'
  | 'monthlyOtherIncome'
  | 'generalProperty'
  | 'financialProperty'
  | 'debt'
  | 'luxuryAssets';

const AMOUNT_KINDS: Record<AmountKey, keyof typeof AMOUNT_LIMIT_MANWON> = {
  monthlyEarnedIncome: 'income',
  monthlyOtherIncome: 'income',
  generalProperty: 'asset',
  financialProperty: 'asset',
  debt: 'asset',
  luxuryAssets: 'asset',
};

function isValidAmount(value: unknown, kind: keyof typeof AMOUNT_LIMIT_MANWON): boolean {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= AMOUNT_LIMIT_MANWON[kind] * WON_PER_MANWON
  );
}

function isValidStoredInput(value: unknown, today: Date): value is AppInput {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  if (typeof v.region !== 'string' || !REGIONS.includes(v.region as Region)) return false;
  if (typeof v.hasSpouse !== 'boolean' || typeof v.spouseEligible !== 'boolean') return false;

  const birth = v.birthDate;
  if (typeof birth !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birth)) return false;
  if (!isValidBirthDate(birth.replace(/-/g, ''), today)) return false;

  return (Object.keys(AMOUNT_KINDS) as AmountKey[]).every((key) => isValidAmount(v[key], AMOUNT_KINDS[key]));
}

/** 마지막 입력을 저장한다. 용량 초과·저장소 차단 등 어떤 예외도 밖으로 내보내지 않고 false를 돌려준다. */
export function saveLastInput(input: AppInput): boolean {
  try {
    localStorage.setItem(LAST_INPUT_KEY, JSON.stringify(input));
    return true;
  } catch {
    return false;
  }
}

/**
 * 마지막 입력을 읽는다. 없거나 손상됐으면 null.
 * 손상(파싱 실패·형식 불일치)이면 키를 지운다. 템플릿 getItem은 파싱 오류를 삼켜
 * 손상 여부를 구분할 수 없어 localStorage를 직접 호출한다.
 */
export function loadLastInput(today: Date = new Date()): AppInput | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(LAST_INPUT_KEY);
  } catch {
    return null;
  }
  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = undefined;
  }
  if (isValidStoredInput(parsed, today)) return parsed;

  try {
    localStorage.removeItem(LAST_INPUT_KEY);
  } catch {
    // 삭제 실패는 조용히 넘긴다
  }
  return null;
}

function toManwonText(won: number): string {
  return won === 0 ? '' : String(won / WON_PER_MANWON);
}

/** AppInput → 홈 폼 미리 채우기용 상태. 금액은 만 원 문자열(0은 빈 칸), 생년월일은 8자리 숫자. */
export function toFormState(input: AppInput): FormState {
  return {
    birthDate: input.birthDate.replace(/\D/g, ''),
    hasSpouse: input.hasSpouse,
    spouseEligible: input.spouseEligible,
    region: input.region,
    earned: toManwonText(input.monthlyEarnedIncome),
    other: toManwonText(input.monthlyOtherIncome),
    general: toManwonText(input.generalProperty),
    financial: toManwonText(input.financialProperty),
    debt: toManwonText(input.debt),
    luxury: toManwonText(input.luxuryAssets),
  };
}
