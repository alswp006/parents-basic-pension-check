import { describe, it, expect, vi } from 'vitest';
import { sanitizeAmount, sanitizeBirthDate } from '@/lib/sanitize';
import { LAST_INPUT_KEY, loadLastInput, saveLastInput, toFormState } from '@/lib/storedInput';
import type { AppInput } from '@/lib/types';

const A: AppInput = {
  birthDate: '1961-11-10',
  hasSpouse: true,
  spouseEligible: true,
  region: 'city',
  monthlyEarnedIncome: 3000000,
  monthlyOtherIncome: 500000,
  generalProperty: 200000000,
  financialProperty: 30000000,
  debt: 10000000,
  luxuryAssets: 50000000,
};

describe('sanitize', () => {
  it('sanitizeAmount: 쉼표·공백만 제거하고 나머지는 그대로 둔다', () => {
    expect(sanitizeAmount('1,500')).toBe('1500');
    expect(sanitizeAmount(' 12 ')).toBe('12');
    expect(sanitizeAmount('12.5')).toBe('12.5');
    expect(sanitizeAmount('abc')).toBe('abc');
  });

  it('sanitizeBirthDate: 숫자만 남기고 앞 8자리', () => {
    expect(sanitizeBirthDate('1961-11-10')).toBe('19611110');
    expect(sanitizeBirthDate('1961.11.10')).toBe('19611110');
    expect(sanitizeBirthDate('196111101234')).toBe('19611110');
  });
});

describe('storedInput', () => {
  it('입력 A를 저장하고 읽으면 deepEqual이다', () => {
    expect(saveLastInput(A)).toBe(true);
    expect(loadLastInput()).toEqual(A);
  });

  it('set이 QuotaExceededError를 던지면 false, console.error 0회', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const setSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    try {
      expect(saveLastInput(A)).toBe(false);
      expect(errorSpy).not.toHaveBeenCalled();
    } finally {
      setSpy.mockRestore();
      errorSpy.mockRestore();
    }
  });

  it.each([
    ['깨진 JSON', '{bad json'],
    ['region이 seoul인 불완전 객체', JSON.stringify({ region: 'seoul' })],
    ['금액 -1', JSON.stringify({ ...A, monthlyEarnedIncome: -1 })],
    ['미래 생년월일', JSON.stringify({ ...A, birthDate: '2999-01-01' })],
  ])('손상된 값(%s)이면 null을 반환하고 키를 지운다', (_name, raw) => {
    localStorage.setItem(LAST_INPUT_KEY, raw);
    expect(loadLastInput()).toBeNull();
    expect(localStorage.getItem(LAST_INPUT_KEY)).toBeNull();
  });

  it('읽기와 삭제가 던져도 null을 반환한다', () => {
    const getSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('read failed');
    });
    try {
      expect(loadLastInput()).toBeNull();
    } finally {
      getSpy.mockRestore();
    }

    localStorage.setItem(LAST_INPUT_KEY, '{bad json');
    const removeSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('remove failed');
    });
    try {
      expect(loadLastInput()).toBeNull();
    } finally {
      removeSpy.mockRestore();
    }
  });

  it('저장된 값이 없으면 null', () => {
    expect(loadLastInput()).toBeNull();
  });

  it('toFormState: 원 → 만 원 문자열, 0은 빈 칸, 생년월일은 8자리', () => {
    const form = toFormState({ ...A, region: 'metro' });
    expect(form.birthDate).toBe('19611110');
    expect(form.earned).toBe('300');
    expect(form.other).toBe('50');
    expect(form.general).toBe('20000');
    expect(form.financial).toBe('3000');
    expect(form.debt).toBe('1000');
    expect(form.luxury).toBe('5000');
    expect(form.region).toBe('metro');

    const empty = toFormState({ ...A, monthlyEarnedIncome: 0 });
    expect(empty.earned).toBe('');
  });
});
