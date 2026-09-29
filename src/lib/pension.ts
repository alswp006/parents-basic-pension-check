import { BASE_PENSION, COUPLE_REDUCTION, MIN_PENSION_RATE } from '@/lib/policy';
import type { AppInput, PensionResult, Reduction } from '@/lib/types';

/** 예상 월 수령액. 부부 감액 → 소득역전 감액(하한 적용) 순서. */
export function calcPension(
  input: AppInput,
  recognizedIncome: number,
  threshold: number,
): PensionResult {
  const recipients: 1 | 2 = input.hasSpouse && input.spouseEligible ? 2 : 1;

  if (recognizedIncome > threshold) {
    return { eligible: false, recipients, perPerson: 0, household: 0, reductions: [] };
  }

  const reductions: Reduction[] = [];
  let perPerson: number = BASE_PENSION;
  if (recipients === 2) {
    perPerson = Math.floor(BASE_PENSION * (1 - COUPLE_REDUCTION) + 1e-6);
    reductions.push('couple');
  }

  let household = perPerson * recipients;
  if (recognizedIncome + household > threshold) {
    const floor = Math.floor(BASE_PENSION * MIN_PENSION_RATE) * recipients;
    household = Math.max(threshold - recognizedIncome, floor);
    perPerson = Math.floor(household / recipients);
    reductions.push('incomeReversal');
  }

  return { eligible: true, recipients, perPerson, household, reductions };
}
