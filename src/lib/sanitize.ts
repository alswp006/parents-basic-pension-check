/** 금액 칸 입력에서 쉼표와 공백만 걷어낸다. 숫자 외 문자는 그대로 두어 검증이 잡게 한다. */
export function sanitizeAmount(raw: string): string {
  return raw.replace(/[,\s]/g, '');
}

/** 생년월일 칸 입력에서 숫자만 남기고 앞 8자리(YYYYMMDD)까지 자른다. */
export function sanitizeBirthDate(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 8);
}
