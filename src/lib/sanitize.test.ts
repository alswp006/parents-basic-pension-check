import { describe, it, expect } from 'vitest';
import { sanitizeAmount, sanitizeBirthDate } from '@/lib/sanitize';

describe('sanitizeAmount', () => {
  it('쉼표와 공백을 지운다', () => {
    expect(sanitizeAmount('1,500')).toBe('1500');
    expect(sanitizeAmount(' 1 500 ')).toBe('1500');
  });
  it('소수점과 숫자 외 문자는 그대로 둔다', () => {
    expect(sanitizeAmount('12.5')).toBe('12.5');
    expect(sanitizeAmount('abc')).toBe('abc');
  });
  it('null·undefined는 빈 문자열', () => {
    expect(sanitizeAmount(null)).toBe('');
    expect(sanitizeAmount(undefined)).toBe('');
  });
});

describe('sanitizeBirthDate', () => {
  it('구분자를 제거한다', () => {
    expect(sanitizeBirthDate('1961-11-10')).toBe('19611110');
    expect(sanitizeBirthDate('1961.11.10')).toBe('19611110');
  });
  it('8자리를 넘으면 자른다', () => {
    expect(sanitizeBirthDate('196111101234')).toBe('19611110');
  });
  it('null·undefined는 빈 문자열', () => {
    expect(sanitizeBirthDate(null)).toBe('');
    expect(sanitizeBirthDate(undefined)).toBe('');
  });
});
