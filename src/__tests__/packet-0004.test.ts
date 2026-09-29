import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { AppInput, FormState } from '@/lib/types';

/**
 * Packet 0004: Input Sanitize & Safe Storage (TDD Red Phase)
 * Tests for sanitize.ts and storedInput.ts
 */

describe('Input Sanitize & Safe Storage', () => {
  // ═══════════════════════════════════════════════════════════════════
  // AC-1: sanitizeAmount removes commas and spaces, preserves decimals
  // ═══════════════════════════════════════════════════════════════════

  describe('sanitizeAmount', () => {
    it('AC-1a: removes commas from numbers', async () => {
      const { sanitizeAmount } = await import('@/lib/sanitize');
      expect(sanitizeAmount('1,500')).toBe('1500');
      expect(sanitizeAmount('1,000,000')).toBe('1000000');
    });

    it('AC-1b: removes leading/trailing spaces', async () => {
      const { sanitizeAmount } = await import('@/lib/sanitize');
      expect(sanitizeAmount(' 12 ')).toBe('12');
      expect(sanitizeAmount('  100  ')).toBe('100');
    });

    it('AC-1c: preserves decimal points unchanged', async () => {
      const { sanitizeAmount } = await import('@/lib/sanitize');
      expect(sanitizeAmount('12.5')).toBe('12.5');
      expect(sanitizeAmount('1,234.56')).toBe('1234.56');
    });

    it('AC-1d: returns non-numeric input as-is', async () => {
      const { sanitizeAmount } = await import('@/lib/sanitize');
      expect(sanitizeAmount('abc')).toBe('abc');
      expect(sanitizeAmount('test123')).toBe('test123');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // AC-2: sanitizeBirthDate extracts 8-digit date (YYYYMMDD)
  // ═══════════════════════════════════════════════════════════════════

  describe('sanitizeBirthDate', () => {
    it('AC-2a: converts YYYY-MM-DD format to YYYYMMDD', async () => {
      const { sanitizeBirthDate } = await import('@/lib/sanitize');
      expect(sanitizeBirthDate('1961-11-10')).toBe('19611110');
      expect(sanitizeBirthDate('2000-01-15')).toBe('20000115');
    });

    it('AC-2b: handles YYYY.MM.DD format', async () => {
      const { sanitizeBirthDate } = await import('@/lib/sanitize');
      expect(sanitizeBirthDate('1961.11.10')).toBe('19611110');
      expect(sanitizeBirthDate('1999.05.20')).toBe('19990520');
    });

    it('AC-2c: truncates to first 8 digits if longer', async () => {
      const { sanitizeBirthDate } = await import('@/lib/sanitize');
      expect(sanitizeBirthDate('196111101234')).toBe('19611110');
      expect(sanitizeBirthDate('20001015extra')).toBe('20001015');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // AC-3: saveLastInput returns false on quota error, no exception
  // ═══════════════════════════════════════════════════════════════════

  describe('saveLastInput exception handling', () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorage.clear();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
      vi.clearAllMocks();
    });

    it('AC-3: returns false when localStorage.setItem throws QuotaExceededError', async () => {
      vi.resetModules(); // Ensure fresh module import
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      try {
        const { saveLastInput } = await import('@/lib/storedInput');
        const input: AppInput = {
          birthDate: '1961-11-10',
          hasSpouse: false,
          spouseEligible: false,
          region: 'metro',
          monthlyEarnedIncome: 0,
          monthlyOtherIncome: 0,
          generalProperty: 0,
          financialProperty: 0,
          debt: 0,
          luxuryAssets: 0,
        };

        const result = saveLastInput(input);
        expect(result).toBe(false);
        expect(consoleErrorSpy).not.toHaveBeenCalled();
      } finally {
        setItemSpy.mockRestore();
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // AC-4: loadLastInput returns null and deletes key for corrupted data
  // ═══════════════════════════════════════════════════════════════════

  describe('loadLastInput corruption handling', () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorage.clear();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
      vi.clearAllMocks();
    });

    it('AC-4a: returns null and deletes key for malformed JSON', async () => {
      const { LAST_INPUT_KEY, loadLastInput } = await import('@/lib/storedInput');
      localStorage.setItem(LAST_INPUT_KEY, '{bad json');

      const result = loadLastInput();
      expect(result).toBeNull();
      expect(localStorage.getItem(LAST_INPUT_KEY)).toBeNull();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('AC-4b: returns null and deletes key for incomplete data', async () => {
      const { LAST_INPUT_KEY, loadLastInput } = await import('@/lib/storedInput');
      localStorage.setItem(LAST_INPUT_KEY, JSON.stringify({ region: 'seoul' }));

      const result = loadLastInput();
      expect(result).toBeNull();
      expect(localStorage.getItem(LAST_INPUT_KEY)).toBeNull();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('AC-4c: returns null and deletes key for invalid amount (negative)', async () => {
      const { LAST_INPUT_KEY, loadLastInput } = await import('@/lib/storedInput');
      const invalid: Partial<AppInput> = {
        birthDate: '1961-11-10',
        hasSpouse: false,
        spouseEligible: false,
        region: 'metro',
        monthlyEarnedIncome: -1,
        monthlyOtherIncome: 0,
        generalProperty: 0,
        financialProperty: 0,
        debt: 0,
        luxuryAssets: 0,
      };
      localStorage.setItem(LAST_INPUT_KEY, JSON.stringify(invalid));

      const result = loadLastInput();
      expect(result).toBeNull();
      expect(localStorage.getItem(LAST_INPUT_KEY)).toBeNull();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('AC-4d: handles exception on read/delete without throwing', async () => {
      const { LAST_INPUT_KEY, loadLastInput } = await import('@/lib/storedInput');
      const originalGetItem = localStorage.getItem;
      const originalRemoveItem = localStorage.removeItem;

      try {
        localStorage.getItem = vi.fn(() => {
          throw new Error('Storage read failed');
        });

        const result = loadLastInput();
        expect(result).toBeNull();
        expect(consoleErrorSpy).not.toHaveBeenCalled();
      } finally {
        localStorage.getItem = originalGetItem;
        localStorage.removeItem = originalRemoveItem;
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // AC-5: saveLastInput/loadLastInput roundtrip and toFormState conversion
  // ═══════════════════════════════════════════════════════════════════

  describe('saveLastInput/loadLastInput roundtrip', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('AC-5a: saves and loads input with equality', async () => {
      const { saveLastInput, loadLastInput } = await import('@/lib/storedInput');
      const input: AppInput = {
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

      const saved = saveLastInput(input);
      expect(saved).toBe(true);

      const loaded = loadLastInput();
      expect(loaded).toEqual(input);
      expect(loaded?.birthDate).toBe('1961-11-10');
      expect(loaded?.region).toBe('city');
      expect(loaded?.monthlyEarnedIncome).toBe(3000000);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // AC-5b: toFormState converts AppInput to FormState correctly
  // ═══════════════════════════════════════════════════════════════════

  describe('toFormState conversion', () => {
    it('AC-5b: converts AppInput to FormState with correct format', async () => {
      const { toFormState } = await import('@/lib/storedInput');
      const input: AppInput = {
        birthDate: '1961-11-10',
        hasSpouse: true,
        spouseEligible: true,
        region: 'metro',
        monthlyEarnedIncome: 3000000, // 원 → 만 원 300
        monthlyOtherIncome: 500000, // 원 → 만 원 50
        generalProperty: 200000000, // 원 → 만 원 20000
        financialProperty: 30000000, // 원 → 만 원 3000
        debt: 10000000, // 원 → 만 원 1000
        luxuryAssets: 50000000, // 원 → 만 원 5000
      };

      const form = toFormState(input);
      expect(form.birthDate).toBe('19611110'); // 8-digit format
      expect(form.hasSpouse).toBe(true);
      expect(form.spouseEligible).toBe(true);
      expect(form.region).toBe('metro');
      expect(form.earned).toBe('300');
      expect(form.other).toBe('50');
      expect(form.general).toBe('20000');
      expect(form.financial).toBe('3000');
      expect(form.debt).toBe('1000');
      expect(form.luxury).toBe('5000');
    });

    it('AC-5c: toFormState handles zero amounts as empty string', async () => {
      const { toFormState } = await import('@/lib/storedInput');
      const input: AppInput = {
        birthDate: '2000-01-15',
        hasSpouse: false,
        spouseEligible: false,
        region: 'rural',
        monthlyEarnedIncome: 0,
        monthlyOtherIncome: 0,
        generalProperty: 0,
        financialProperty: 0,
        debt: 0,
        luxuryAssets: 0,
      };

      const form = toFormState(input);
      expect(form.earned).toBe(''); // zero → empty
      expect(form.other).toBe('');
      expect(form.general).toBe('');
      expect(form.financial).toBe('');
      expect(form.debt).toBe('');
      expect(form.luxury).toBe('');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // AC-6: Source code uses validation exports, no hardcoded limits
  // ═══════════════════════════════════════════════════════════════════

  describe('source code validation', () => {
    it('AC-6: imports validation constants instead of hardcoding limits', async () => {
      // This test verifies that storedInput.ts imports from validation.ts
      // and doesn't duplicate limit constants or date checks.
      // The actual verification is done by code review (grep in CLAUDE.md)
      // but we can verify the exports exist:
      const validation = await import('@/lib/validation');
      const storedInput = await import('@/lib/storedInput');

      // Verify validation.ts exports required items
      expect(validation.AMOUNT_LIMIT_MANWON).toBeDefined();
      expect(validation.isValidBirthDate).toBeDefined();
      expect(validation.validateAmountText).toBeDefined();

      // Verify storedInput.ts is callable
      expect(storedInput.loadLastInput).toBeDefined();
      expect(storedInput.saveLastInput).toBeDefined();
      expect(storedInput.toFormState).toBeDefined();
      expect(storedInput.LAST_INPUT_KEY).toBeDefined();
      expect(storedInput.LAST_INPUT_KEY).toBe('bpc:lastInput');
    });
  });
});
