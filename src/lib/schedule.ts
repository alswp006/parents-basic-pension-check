import type { ScheduleResult } from '@/lib/types';

const MS_PER_DAY = 86_400_000;
const ELIGIBLE_AGE = 65;

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

/** 로컬 달력 날짜 → 'YYYY-MM-DD' */
function toDateString(y: number, m: number, d: number): string {
  return `${pad(y, 4)}-${pad(m)}-${pad(d)}`;
}

/** n번째 생일. 2/29생은 평년에 3/1로 본다. 월은 1~12. */
function birthdayIn(year: number, month: number, day: number): { y: number; m: number; d: number } {
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  if (month === 2 && day === 29 && !leap) return { y: year, m: 3, d: 1 };
  return { y: year, m: month, d: day };
}

/** 두 달력 날짜 사이 일수 (타임존·DST와 무관하게 UTC 기준으로 센다) */
function daysBetween(from: { y: number; m: number; d: number }, to: { y: number; m: number; d: number }): number {
  return Math.round((Date.UTC(to.y, to.m - 1, to.d) - Date.UTC(from.y, from.m - 1, from.d)) / MS_PER_DAY);
}

/**
 * 만 65세 생일·신청 시작일(생일 전달 1일)·D-day·만 나이.
 * today는 로컬 날짜 부분만 쓴다. canApplyNow면 dDay=0.
 */
export function calcSchedule(birthDate: string, today: Date): ScheduleResult {
  const [by, bm, bd] = birthDate.split('-').map(Number);
  const t = { y: today.getFullYear(), m: today.getMonth() + 1, d: today.getDate() };

  const turns = birthdayIn(by + ELIGIBLE_AGE, bm, bd);
  const applyMonth = turns.m === 1 ? { y: turns.y - 1, m: 12 } : { y: turns.y, m: turns.m - 1 };
  const applyFrom = { y: applyMonth.y, m: applyMonth.m, d: 1 };

  const thisYearBirthday = birthdayIn(t.y, bm, bd);
  const hadBirthday = daysBetween(thisYearBirthday, t) >= 0;
  const age = t.y - by - (hadBirthday ? 0 : 1);

  const untilApply = daysBetween(t, applyFrom);
  const canApplyNow = untilApply <= 0;

  return {
    age,
    turns65On: toDateString(turns.y, turns.m, turns.d),
    applyFrom: toDateString(applyFrom.y, applyFrom.m, applyFrom.d),
    canApplyNow,
    dDay: canApplyNow ? 0 : untilApply,
  };
}
