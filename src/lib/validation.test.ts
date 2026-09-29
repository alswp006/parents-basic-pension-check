import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  calcSchedule,
  validateForm,
  toAppInput,
  runDiagnosis,
  isValidBirthDate,
  validateAmountText,
  AMOUNT_LIMIT_MANWON,
} from "@/lib/validation";
import type { FormState, AppInput } from "@/lib/types";

describe("Schedule, Validation & runDiagnosis", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-30T09:00:00+09:00"));
  });

  describe("AC-1: calcSchedule results by birth date", () => {
    it("AC-1a: should calculate turns65On, applyFrom, canApplyNow, dDay, age for 1961-11-10 (not yet 65)", () => {
      const result = calcSchedule("1961-11-10", new Date("2026-09-30"));
      expect(result.turns65On).toBe("2026-11-10");
      expect(result.applyFrom).toBe("2026-10-01");
      expect(result.canApplyNow).toBe(false);
      expect(result.dDay).toBe(1);
      expect(result.age).toBe(64);
    });

    it("AC-1b: should calculate for 1961-04-15 (already 65)", () => {
      const result = calcSchedule("1961-04-15", new Date("2026-09-30"));
      expect(result.applyFrom).toBe("2026-03-01");
      expect(result.canApplyNow).toBe(true);
      expect(result.dDay).toBe(0);
      expect(result.age).toBe(65);
    });

    it("AC-1c: should handle leap year birthday 1960-02-29", () => {
      const result = calcSchedule("1960-02-29", new Date("2026-09-30"));
      expect(result.turns65On).toBe("2025-03-01");
      expect(result.age).toBe(66);
    });
  });

  describe("DoD-1: 로컬 자정 기준 날짜 계산", () => {
    it("자정 직후와 23:59 모두 같은 날로 계산한다", () => {
      const early = calcSchedule("1961-11-10", new Date(2026, 8, 30, 0, 0, 0));
      const late = calcSchedule("1961-11-10", new Date(2026, 8, 30, 23, 59, 59));
      expect(early).toEqual(late);
      expect(early.dDay).toBe(1);
    });

    it("신청 시작일 당일에는 canApplyNow=true, dDay=0", () => {
      const r = calcSchedule("1961-11-10", new Date(2026, 9, 1));
      expect(r.canApplyNow).toBe(true);
      expect(r.dDay).toBe(0);
    });

    it("1월생은 신청 시작일이 전년 12월 1일이다", () => {
      expect(calcSchedule("1962-01-05", new Date(2026, 8, 30)).applyFrom).toBe("2026-12-01");
      expect(calcSchedule("1962-01-05", new Date(2026, 8, 30)).turns65On).toBe("2027-01-05");
    });
  });

  describe("AC-2: validateForm amount validation", () => {
    const baseForm: FormState = {
      birthDate: "19610110",
      hasSpouse: false,
      spouseEligible: false,
      region: "metro",
      earned: "",
      other: "",
      general: "",
      financial: "",
      debt: "",
      luxury: "",
    };

    it("AC-2a: should reject decimal amount with error message", () => {
      const errors = validateForm({ ...baseForm, earned: "12.5" }, new Date("2026-09-30")).errors;
      expect(errors.earned).toBe("만 원 단위 정수로 입력해 주세요");
    });

    it("AC-2b: should reject non-numeric amount with error message", () => {
      const errors = validateForm({ ...baseForm, earned: "abc" }, new Date("2026-09-30")).errors;
      expect(errors.earned).toBe("만 원 단위 정수로 입력해 주세요");
    });

    it("AC-2c: should reject negative income amount", () => {
      const errors = validateForm({ ...baseForm, earned: "-5" }, new Date("2026-09-30")).errors;
      expect(errors.earned).toBe("0 ~ 10,000만 원 사이로 입력해 주세요");
    });

    it("AC-2d: should reject negative asset amount", () => {
      const errors = validateForm({ ...baseForm, general: "-5" }, new Date("2026-09-30")).errors;
      expect(errors.general).toBe("0 ~ 1,000,000만 원 사이로 입력해 주세요");
    });

    it("AC-2e: should accept leading zeros (0050 = no error)", () => {
      const result = validateForm({ ...baseForm, earned: "0050" }, new Date("2026-09-30"));
      expect(result.errors.earned).toBeUndefined();
      const appInput = toAppInput({ ...baseForm, earned: "0050" });
      expect(appInput.monthlyEarnedIncome).toBe(500000); // 50 * 10000
    });

    it("AC-2f: should accept empty string as 0 won", () => {
      const result = validateForm({ ...baseForm, earned: "" }, new Date("2026-09-30"));
      expect(result.errors.earned).toBeUndefined();
      const appInput = toAppInput({ ...baseForm, earned: "" });
      expect(appInput.monthlyEarnedIncome).toBe(0);
    });

    it("AC-2g: should reject income over 10,000 manwon", () => {
      const errors = validateForm({ ...baseForm, earned: "10001" }, new Date("2026-09-30")).errors;
      expect(errors.earned).toBe("0 ~ 10,000만 원 사이로 입력해 주세요");
    });
  });

  describe("AC-3: validateForm birth date validation", () => {
    const baseForm: FormState = {
      birthDate: "19610110",
      hasSpouse: false,
      spouseEligible: false,
      region: "metro",
      earned: "",
      other: "",
      general: "",
      financial: "",
      debt: "",
      luxury: "",
    };

    it("AC-3a: should reject 7-digit date (1961111)", () => {
      const errors = validateForm({ ...baseForm, birthDate: "1961111" }, new Date("2026-09-30")).errors;
      expect(errors.birthDate).toBe("올바른 생년월일을 입력해 주세요");
    });

    it("AC-3b: should reject non-existent date (19610231)", () => {
      const errors = validateForm({ ...baseForm, birthDate: "19610231" }, new Date("2026-09-30")).errors;
      expect(errors.birthDate).toBe("올바른 생년월일을 입력해 주세요");
    });

    it("AC-3c: should reject date before 1900 (18991231)", () => {
      const errors = validateForm({ ...baseForm, birthDate: "18991231" }, new Date("2026-09-30")).errors;
      expect(errors.birthDate).toBe("올바른 생년월일을 입력해 주세요");
    });

    it("AC-3d: should reject future date", () => {
      const errors = validateForm({ ...baseForm, birthDate: "20270101" }, new Date("2026-09-30")).errors;
      expect(errors.birthDate).toBe("올바른 생년월일을 입력해 주세요");
    });

    it("AC-3e: should mark missingRequired=true when birthDate is empty", () => {
      const result = validateForm({ ...baseForm, birthDate: "" }, new Date("2026-09-30"));
      expect(result.missingRequired).toBe(true);
    });

    it("AC-3f: should mark missingRequired=true when hasSpouse is null", () => {
      const result = validateForm({ ...baseForm, hasSpouse: null }, new Date("2026-09-30"));
      expect(result.missingRequired).toBe(true);
    });

    it("AC-3g: should mark missingRequired=true when region is null", () => {
      const result = validateForm({ ...baseForm, region: null }, new Date("2026-09-30"));
      expect(result.missingRequired).toBe(true);
    });
  });

  describe("AC-4: toAppInput conversion", () => {
    const baseForm: FormState = {
      birthDate: "19611110",
      hasSpouse: false,
      spouseEligible: true,
      region: "metro",
      earned: "100",
      other: "50",
      general: "2000",
      financial: "500",
      debt: "100",
      luxury: "10",
    };

    it("AC-4a: should set spouseEligible to false when hasSpouse is false", () => {
      const appInput = toAppInput({ ...baseForm, hasSpouse: false, spouseEligible: true });
      expect(appInput.spouseEligible).toBe(false);
    });

    it("AC-4b: should convert birthDate from YYYYMMDD to YYYY-MM-DD", () => {
      const appInput = toAppInput(baseForm);
      expect(appInput.birthDate).toBe("1961-11-10");
    });

    it("AC-4c: should convert amounts from manwon to won (manwon * 10000)", () => {
      const appInput = toAppInput(baseForm);
      expect(appInput.monthlyEarnedIncome).toBe(1000000); // 100 * 10000
      expect(appInput.monthlyOtherIncome).toBe(500000); // 50 * 10000
      expect(appInput.generalProperty).toBe(20000000); // 2000 * 10000
      expect(appInput.financialProperty).toBe(5000000); // 500 * 10000
      expect(appInput.debt).toBe(1000000); // 100 * 10000
      expect(appInput.luxuryAssets).toBe(100000); // 10 * 10000
    });
  });

  describe("AC-5: runDiagnosis results", () => {
    it("AC-5a: should return AppResult with expected structure and values", () => {
      const input: AppInput = {
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

      const result = runDiagnosis(input, new Date("2026-09-30"));

      expect(result.recognizedIncome).toBe(750000);
      expect(result.threshold).toBe(2280000);
      expect(result.verdict).toBe("likely");
      expect(result.pension.perPerson).toBe(342510);
      expect(result.policyYear).toBe(2025);
    });

    it("AC-5b: should throw Error when result contains NaN", () => {
      const input: AppInput = {
        birthDate: "1961-11-10",
        hasSpouse: false,
        spouseEligible: false,
        region: "metro",
        monthlyEarnedIncome: NaN,
        monthlyOtherIncome: 0,
        generalProperty: 0,
        financialProperty: 0,
        debt: 0,
        luxuryAssets: 0,
      };

      expect(() => runDiagnosis(input, new Date("2026-09-30"))).toThrow();
    });

    it("AC-5c: should throw Error when result contains Infinity", () => {
      const input: AppInput = {
        birthDate: "1961-11-10",
        hasSpouse: false,
        spouseEligible: false,
        region: "metro",
        monthlyEarnedIncome: Infinity,
        monthlyOtherIncome: 0,
        generalProperty: 0,
        financialProperty: 0,
        debt: 0,
        luxuryAssets: 0,
      };

      expect(() => runDiagnosis(input, new Date("2026-09-30"))).toThrow();
    });
  });

  describe("Helper functions", () => {
    it("should have AMOUNT_LIMIT_MANWON constant defined", () => {
      expect(AMOUNT_LIMIT_MANWON).toBeDefined();
      expect(AMOUNT_LIMIT_MANWON.income).toBe(10000);
      expect(AMOUNT_LIMIT_MANWON.asset).toBe(1000000);
    });

    it("isValidBirthDate should accept valid date", () => {
      const valid = isValidBirthDate("19611110", new Date("2026-09-30"));
      expect(valid).toBe(true);
    });

    it("isValidBirthDate should reject invalid date", () => {
      const invalid = isValidBirthDate("19610231", new Date("2026-09-30"));
      expect(invalid).toBe(false);
    });

    it("validateAmountText should return error for decimal", () => {
      const error = validateAmountText("12.5", "income");
      expect(error).toBe("만 원 단위 정수로 입력해 주세요");
    });

    it("validateAmountText should return error for income over limit", () => {
      const error = validateAmountText("10001", "income");
      expect(error).toBe("0 ~ 10,000만 원 사이로 입력해 주세요");
    });

    it("validateAmountText should return error for asset over limit", () => {
      const error = validateAmountText("1000001", "asset");
      expect(error).toBe("0 ~ 1,000,000만 원 사이로 입력해 주세요");
    });

    it("validateAmountText should return undefined for valid amount", () => {
      const error1 = validateAmountText("5000", "income");
      const error2 = validateAmountText("500000", "asset");
      expect(error1).toBeUndefined();
      expect(error2).toBeUndefined();
    });
  });
});
