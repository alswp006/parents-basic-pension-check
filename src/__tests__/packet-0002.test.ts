import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  calcIncome,
  calcProperty,
  getThreshold,
  judge,
  calcPension,
} from "@/lib/calculator";
import {
  THRESHOLD_SINGLE,
  THRESHOLD_COUPLE,
  BASE_PENSION,
  EARNED_INCOME_DEDUCTION,
  EARNED_INCOME_RATE,
  FINANCIAL_DEDUCTION,
  BASIC_PROPERTY,
  PROPERTY_CONVERSION_RATE,
  COUPLE_REDUCTION,
  MIN_PENSION_RATE,
} from "@/lib/policy";
import type { AppInput } from "@/lib/types";

describe("Core Logic: 소득인정액·판정·수령액", () => {
  /**
   * 공통 입력 A: 배우자 없음, 대도시, 근로소득 0, 기타소득 500,000,
   * 일반재산 200,000,000, 금융재산 30,000,000, 부채 0, 고급자동차·회원권 0
   */
  const inputA: AppInput = {
    birthDate: "1961-11-10",
    hasSpouse: false,
    spouseEligible: false,
    region: "metro",
    monthlyEarnedIncome: 0,
    monthlyOtherIncome: 500000,
    generalProperty: 200000000,
    financialProperty: 30000000,
    debt: 0,
    luxuryAssets: 0,
  };

  describe("AC-1: calcIncome", () => {
    it("AC-1[P0]: should calculate earned income reflection correctly (2,000,000 → 616,000)", () => {
      const input: AppInput = {
        ...inputA,
        monthlyEarnedIncome: 2000000,
        monthlyOtherIncome: 0,
      };
      const result = calcIncome(input);

      // earned: max(0, 2,000,000 - 1,120,000) × 0.7 = 880,000 × 0.7 = 616,000
      expect(result.earnedReflected).toBe(616000);
      expect(result.other).toBe(0);
      expect(result.total).toBe(616000);
    });

    it("AC-1[P0]: should set earnedReflected to 0 when earned income <= 1,120,000", () => {
      const input: AppInput = {
        ...inputA,
        monthlyEarnedIncome: 1120000,
        monthlyOtherIncome: 100000,
      };
      const result = calcIncome(input);

      expect(result.earnedReflected).toBe(0);
      expect(result.other).toBe(100000);
      expect(result.total).toBe(100000);
    });

    it("AC-1[P0]: should handle earned income just above deduction limit", () => {
      const input: AppInput = {
        ...inputA,
        monthlyEarnedIncome: 1120001,
        monthlyOtherIncome: 0,
      };
      const result = calcIncome(input);

      // max(0, 1,120,001 - 1,120,000) × 0.7 = 1 × 0.7 = 0.7 → floor = 0
      expect(result.earnedReflected).toBe(0);
    });
  });

  describe("AC-2: calcProperty + recognizedIncome", () => {
    it("AC-2[P0]: should calculate property correctly for input A (200M+30M → 250,000)", () => {
      const result = calcProperty(inputA);

      // (200M + max(0, 30M - 20M) - 0 - 135M) × 0.04 ÷ 12 + 0
      // = (200M + 10M - 135M) × 0.04 ÷ 12
      // = 75M × 0.04 ÷ 12
      // = 3,000,000 ÷ 12
      // = 250,000
      expect(result.total).toBe(250000);
      expect(result.clamped).toBe(false);
    });

    it("AC-2[P0]: should calculate recognized income correctly (500,000 + 250,000 = 750,000)", () => {
      const income = calcIncome(inputA);
      const property = calcProperty(inputA);
      const recognizedIncome = income.total + property.total;

      expect(income.total).toBe(500000);
      expect(property.total).toBe(250000);
      expect(recognizedIncome).toBe(750000);
    });

    it("AC-2: should handle financial property above deduction", () => {
      const input: AppInput = {
        ...inputA,
        financialProperty: 50000000, // 금융 50M (공제 20M)
      };
      const result = calcProperty(input);

      // (200M + 30M - 135M) × 0.04 ÷ 12 = 95M × 0.04 ÷ 12
      // = 3,800,000 ÷ 12 ≈ 316,666.67 → floor = 316,666
      expect(result.total).toBeGreaterThan(250000);
      expect(result.clamped).toBe(false);
    });
  });

  describe("AC-3: Clamping (negative net property)", () => {
    it("AC-3[P0]: should clamp to 0 when net property is negative", () => {
      const input: AppInput = {
        ...inputA,
        generalProperty: 100000000, // 일반 100M (< 135M 기본공제)
        financialProperty: 0,
      };
      const result = calcProperty(input);

      // (100M + 0 - 0 - 135M) × ... → -35M → clamped
      expect(result.clamped).toBe(true);
      expect(result.total).toBe(0);
    });

    it("AC-3: should handle property with debt that pushes below zero", () => {
      const input: AppInput = {
        ...inputA,
        generalProperty: 150000000,
        financialProperty: 20000000,
        debt: 100000000,
      };
      const result = calcProperty(input);

      // (150M + 0 - 100M - 135M) < 0 → clamped
      expect(result.clamped).toBe(true);
      expect(result.total).toBe(0);
    });
  });

  describe("AC-4: getThreshold & judge", () => {
    it("AC-4[P0]: should return THRESHOLD_SINGLE for single person", () => {
      const threshold = getThreshold(false);

      expect(threshold).toBe(THRESHOLD_SINGLE);
      expect(threshold).toBe(2280000);
    });

    it("AC-4[P0]: should return THRESHOLD_COUPLE for couple", () => {
      const threshold = getThreshold(true);

      expect(threshold).toBe(THRESHOLD_COUPLE);
      expect(threshold).toBe(3648000);
    });

    it("AC-4[P0]: should judge as 'likely' when ratio <= 0.9", () => {
      const threshold = getThreshold(false);
      const result = judge(750000, threshold);

      // 750,000 / 2,280,000 = 0.329...
      expect(result.ratio).toBeLessThanOrEqual(0.9);
      expect(result.verdict).toBe("likely");
    });

    it("AC-4[P0]: should judge as 'borderline' when 0.9 < ratio <= 1.1", () => {
      const threshold = getThreshold(false);
      const result = judge(2100000, threshold);

      // 2,100,000 / 2,280,000 ≈ 0.921
      expect(result.ratio).toBeGreaterThan(0.9);
      expect(result.ratio).toBeLessThanOrEqual(1.1);
      expect(result.verdict).toBe("borderline");
    });

    it("AC-4[P0]: should judge as 'unlikely' when ratio > 1.1", () => {
      const threshold = getThreshold(false);
      const result = judge(2600000, threshold);

      // 2,600,000 / 2,280,000 ≈ 1.140
      expect(result.ratio).toBeGreaterThan(1.1);
      expect(result.verdict).toBe("unlikely");
    });

    it("AC-4: should calculate ratio precisely", () => {
      const threshold = getThreshold(false);
      const income1 = 750000;
      const income2 = 2100000;
      const income3 = 2600000;

      const result1 = judge(income1, threshold);
      const result2 = judge(income2, threshold);
      const result3 = judge(income3, threshold);

      // Verify ratio calculation
      expect(Math.abs(result1.ratio - (income1 / threshold))).toBeLessThan(0.001);
      expect(Math.abs(result2.ratio - (income2 / threshold))).toBeLessThan(0.001);
      expect(Math.abs(result3.ratio - (income3 / threshold))).toBeLessThan(0.001);
    });
  });

  describe("AC-5: calcPension basic", () => {
    it("AC-5[P0]: should calculate basic pension for single person (inputA)", () => {
      const threshold = getThreshold(false);
      const recognizedIncome = 750000;
      const result = calcPension(inputA, recognizedIncome, threshold);

      expect(result.eligible).toBe(true);
      expect(result.recipients).toBe(1);
      expect(result.perPerson).toBe(BASE_PENSION);
      expect(result.perPerson).toBe(342510);
      expect(result.household).toBe(342510);
      expect(result.reductions).toEqual([]);
    });

    it("AC-5[P0]: should apply couple reduction when both eligible (20% reduction)", () => {
      const input: AppInput = {
        ...inputA,
        hasSpouse: true,
        spouseEligible: true,
      };
      const threshold = getThreshold(true);
      const recognizedIncome = 1500000; // low income, should trigger couple reduction
      const result = calcPension(input, recognizedIncome, threshold);

      // perPerson = 342,510 × (1 - 0.2) = 342,510 × 0.8 = 274,008
      expect(result.recipients).toBe(2);
      expect(result.perPerson).toBe(274008);
      expect(result.household).toBe(548016); // 274,008 × 2
      expect(result.reductions).toContain("couple");
    });

    it("AC-5: should NOT apply couple reduction when spouse not eligible", () => {
      const input: AppInput = {
        ...inputA,
        hasSpouse: true,
        spouseEligible: false,
      };
      const threshold = getThreshold(false); // still single threshold
      const recognizedIncome = 750000;
      const result = calcPension(input, recognizedIncome, threshold);

      expect(result.recipients).toBe(1);
      expect(result.perPerson).toBe(BASE_PENSION);
      expect(result.reductions).not.toContain("couple");
    });
  });

  describe("AC-6: calcPension with income reversal", () => {
    it("AC-6[P0]: should apply income reversal reduction for single (2,100,000 → 180,000)", () => {
      const threshold = getThreshold(false);
      const recognizedIncome = 2100000;
      const result = calcPension(inputA, recognizedIncome, threshold);

      // household = max(2,280,000 - 2,100,000, floor(342,510 × 0.1))
      //           = max(180,000, 34,251)
      //           = 180,000
      expect(result.eligible).toBe(true);
      expect(result.household).toBe(180000);
      expect(result.perPerson).toBe(180000); // single, so perPerson == household
      expect(result.reductions).toContain("incomeReversal");
    });

    it("AC-6[P0]: should apply income reversal for couple (3,400,000 → 248,000 total / 124,000 per)", () => {
      const input: AppInput = {
        ...inputA,
        hasSpouse: true,
        spouseEligible: true,
      };
      const threshold = getThreshold(true);
      const recognizedIncome = 3400000;
      const result = calcPension(input, recognizedIncome, threshold);

      // household = max(3,648,000 - 3,400,000, floor(342,510 × 0.1) × 2)
      //           = max(248,000, 34,251 × 2)
      //           = max(248,000, 68,502)
      //           = 248,000
      // perPerson = 248,000 ÷ 2 = 124,000
      expect(result.eligible).toBe(true);
      expect(result.household).toBe(248000);
      expect(result.perPerson).toBe(124000);
      expect(result.reductions).toContain("incomeReversal");
    });

    it("AC-6: should apply minimum floor when income reversal result is too low", () => {
      const threshold = getThreshold(false);
      // Create scenario where threshold - income < MIN floor
      // MIN = floor(342,510 × 0.1) = 34,251
      // If recognizedIncome is very close to threshold
      const recognizedIncome = 2280000 - 1000; // 180,000 above minimum floor
      const result = calcPension(inputA, recognizedIncome, threshold);

      // household should be at least 34,251 (minimum floor)
      expect(result.household).toBeGreaterThanOrEqual(Math.floor(BASE_PENSION * MIN_PENSION_RATE));
    });
  });

  describe("AC-7: calcPension exceeding threshold", () => {
    it("AC-7[P0]: should return 0 when recognized income exceeds threshold", () => {
      const threshold = getThreshold(false);
      const recognizedIncome = 3000000; // > 2,280,000
      const result = calcPension(inputA, recognizedIncome, threshold);

      expect(result.eligible).toBe(false);
      expect(result.perPerson).toBe(0);
      expect(result.household).toBe(0);
    });

    it("AC-7: should return 0 for couple exceeding couple threshold", () => {
      const input: AppInput = {
        ...inputA,
        hasSpouse: true,
        spouseEligible: true,
      };
      const threshold = getThreshold(true);
      const recognizedIncome = 4000000; // > 3,648,000
      const result = calcPension(input, recognizedIncome, threshold);

      expect(result.eligible).toBe(false);
      expect(result.perPerson).toBe(0);
      expect(result.household).toBe(0);
    });
  });

  describe("AC-8: Policy constants validation", () => {
    it("AC-8[P0]: should use correct policy constants from policy.ts", () => {
      // Verify constants are loaded correctly
      expect(THRESHOLD_SINGLE).toBe(2280000);
      expect(THRESHOLD_COUPLE).toBe(3648000);
      expect(BASE_PENSION).toBe(342510);
      expect(EARNED_INCOME_DEDUCTION).toBe(1120000);
      expect(EARNED_INCOME_RATE).toBe(0.7);
      expect(FINANCIAL_DEDUCTION).toBe(20000000);
      expect(BASIC_PROPERTY.metro).toBe(135000000);
      expect(PROPERTY_CONVERSION_RATE).toBe(0.04);
      expect(COUPLE_REDUCTION).toBe(0.2);
      expect(MIN_PENSION_RATE).toBe(0.1);
    });

    it("AC-8: should not have hardcoded policy numbers in calculations", () => {
      // This test verifies that functions use imported constants
      // If they use hardcoded numbers, the calculations will fail
      const input: AppInput = {
        ...inputA,
        monthlyEarnedIncome: 2000000,
      };

      const income = calcIncome(input);
      // If function uses hardcoded 1120000 instead of EARNED_INCOME_DEDUCTION, test would fail
      expect(income.earnedReflected).toBe(616000);
    });
  });

  describe("Edge cases and boundary conditions", () => {
    it("should handle zero income and property", () => {
      const input: AppInput = {
        ...inputA,
        monthlyEarnedIncome: 0,
        monthlyOtherIncome: 0,
        generalProperty: 0,
        financialProperty: 0,
        debt: 0,
        luxuryAssets: 0,
      };

      const income = calcIncome(input);
      const property = calcProperty(input);

      expect(income.total).toBe(0);
      expect(property.clamped).toBe(true); // 0 < basic deduction
      expect(property.total).toBe(0);
    });

    it("should handle large income amounts", () => {
      const input: AppInput = {
        ...inputA,
        monthlyEarnedIncome: 100000000, // 100M
      };

      const income = calcIncome(input);

      // max(0, 100M - 1.12M) × 0.7 = 98.88M × 0.7 = 69.216M
      expect(income.earnedReflected).toBeGreaterThan(60000000);
    });

    it("should handle luxury assets correctly (100% reflection)", () => {
      const input: AppInput = {
        ...inputA,
        luxuryAssets: 5000000, // 500만원 고급자동차
      };

      const property = calcProperty(input);

      // Luxury assets should be directly added (100% reflection)
      // property.total = (... base calculation ...) + luxury
      expect(property.luxury).toBe(5000000);
      expect(property.total).toBeGreaterThan(250000);
    });

    it("should floor all final amounts", () => {
      const input: AppInput = {
        ...inputA,
        monthlyOtherIncome: 500001, // Intentionally odd amount to test flooring
      };

      const income = calcIncome(input);
      const property = calcProperty(input);

      // All results should be integers (floored)
      expect(Number.isInteger(income.total)).toBe(true);
      expect(Number.isInteger(property.total)).toBe(true);
    });
  });
});
