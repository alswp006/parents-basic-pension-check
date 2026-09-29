/** 문자열이 아닌 값(null·undefined·숫자)이 들어와도 안전하게 문자열로 바꾼다. */
function toText(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw);
  return '';
}

/** 금액 칸 입력에서 쉼표와 공백만 걷어낸다. 숫자 외 문자는 그대로 두어 검증이 잡게 한다. */
export function sanitizeAmount(raw: string | null | undefined): string {
  return toText(raw).replace(/[,\s]/g, '');
}

/** 생년월일 칸 입력에서 숫자만 남기고 앞 8자리(YYYYMMDD)까지 자른다. */
export function sanitizeBirthDate(raw: string | null | undefined): string {
  return toText(raw).replace(/\D/g, '').slice(0, 8);
}
