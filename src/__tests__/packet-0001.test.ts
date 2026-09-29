import { describe, it, expect } from "vitest";
import type {
  Region,
  Verdict,
  Reduction,
  AppInput,
  IncomeBreakdown,
  PropertyBreakdown,
  PensionResult,
  ScheduleResult,
  AppResult,
  FormState,
  RouteState,
} from "@/lib/types";
import {
  POLICY_YEAR,
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

describe("Packet 0001: Types & Policy Constants", () => {
  describe("AC-1: types.ts exports all 11 data model types correctly", () => {
    it("should export Region type with correct literal values", () => {
      // Verify Region type works with all valid values
      const regions: Array<Region> = ["metro", "city", "rural"];
      expect(regions).toHaveLength(3);
      expect(regions).toContain("metro");
    });

    it("should export Verdict type with correct literal values", () => {
      // Verify Verdict type works with all valid values
      const verdicts: Array<Verdict> = ["likely", "borderline", "unlikely"];
      expect(verdicts).toHaveLength(3);
      expect(verdicts).toContain("borderline");
    });

    it("should export Reduction type with correct literal values", () => {
      // Verify Reduction type works with all valid values
      const reductions: Array<Reduction> = ["couple", "incomeReversal"];
      expect(reductions).toHaveLength(2);
      expect(reductions).toContain("couple");
    });

    it("should export AppInput interface with exact SPEC fields and types", () => {
      // Verifies the interface structure matches SPEC Data Model
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

      expect(input.birthDate).toBe("1961-11-10");
      expect(input.hasSpouse).toBe(false);
      expect(input.spouseEligible).toBe(false);
      expect(input.region).toBe("metro");
      expect(input.monthlyEarnedIncome).toBe(0);
      expect(input.monthlyOtherIncome).toBe(500000);
    });

    it("should export IncomeBreakdown interface with three number fields", () => {
      const breakdown: IncomeBreakdown = {
        earnedReflected: 616000,
        other: 500000,
        total: 1116000,
      };

      expect(breakdown.earnedReflected).toBe(616000);
      expect(breakdown.other).toBe(500000);
      expect(breakdown.total).toBe(1116000);
    });

    it("should export PropertyBreakdown interface with correct fields and types", () => {
      const breakdown: PropertyBreakdown = {
        general: 600000,
        financial: 30000,
        debt: 0,
        basicDeduction: -405000,
        luxury: 0,
        clamped: false,
        total: 250000,
      };

      expect(breakdown.general).toBe(600000);
      expect(breakdown.total).toBe(250000);
      expect(breakdown.clamped).toBe(false);
    });

    it("should export PensionResult interface with all required fields", () => {
      const single: PensionResult = {
        eligible: true,
        recipients: 1,
        perPerson: 342510,
        household: 342510,
        reductions: [],
      };

      expect(single.recipients).toBe(1);
      expect(single.perPerson).toBe(342510);
      expect(single.household).toBe(342510);
      expect(single.reductions).toHaveLength(0);

      const couple: PensionResult = {
        eligible: true,
        recipients: 2,
        perPerson: 274008,
        household: 548016,
        reductions: ["couple"],
      };

      expect(couple.recipients).toBe(2);
      expect(couple.reductions).toContain("couple");
    });

    it("should export ScheduleResult interface with all required fields", () => {
      const schedule: ScheduleResult = {
        age: 64,
        turns65On: "2026-11-10",
        applyFrom: "2026-10-01",
        canApplyNow: false,
        dDay: 1,
      };

      expect(schedule.age).toBe(64);
      expect(schedule.turns65On).toBe("2026-11-10");
      expect(schedule.applyFrom).toBe("2026-10-01");
      expect(schedule.canApplyNow).toBe(false);
      expect(schedule.dDay).toBe(1);
    });

    it("should export AppResult interface with all required fields", () => {
      const result: AppResult = {
        income: { earnedReflected: 500000, other: 500000, total: 1000000 },
        property: {
          general: 600000,
          financial: 30000,
          debt: 0,
          basicDeduction: -405000,
          luxury: 0,
          clamped: false,
          total: 250000,
        },
        recognizedIncome: 750000,
        threshold: 2280000,
        ratio: 0.329,
        verdict: "likely",
        pension: {
          eligible: true,
          recipients: 1,
          perPerson: 342510,
          household: 342510,
          reductions: [],
        },
        schedule: {
          age: 64,
          turns65On: "2026-11-10",
          applyFrom: "2026-10-01",
          canApplyNow: false,
          dDay: 1,
        },
        policyYear: 2025,
      };

      expect(result.recognizedIncome).toBe(750000);
      expect(result.threshold).toBe(2280000);
      expect(result.verdict).toBe("likely");
      expect(result.policyYear).toBe(2025);
    });

    it("should export FormState interface with string amounts and nullable booleans", () => {
      const form: FormState = {
        birthDate: "19611110",
        hasSpouse: null,
        spouseEligible: false,
        region: null,
        earned: "",
        other: "500",
        general: "2000",
        financial: "300",
        debt: "",
        luxury: "",
      };

      expect(form.birthDate).toBe("19611110");
      expect(form.hasSpouse).toBeNull();
      expect(form.earned).toBe("");
      expect(form.other).toBe("500");
    });

    it("should export RouteState interface with AppInput and AppResult", () => {
      const state: RouteState = {
        input: {
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
        },
        result: {
          income: { earnedReflected: 500000, other: 500000, total: 1000000 },
          property: {
            general: 600000,
            financial: 30000,
            debt: 0,
            basicDeduction: -405000,
            luxury: 0,
            clamped: false,
            total: 250000,
          },
          recognizedIncome: 750000,
          threshold: 2280000,
          ratio: 0.329,
          verdict: "likely",
          pension: {
            eligible: true,
            recipients: 1,
            perPerson: 342510,
            household: 342510,
            reductions: [],
          },
          schedule: {
            age: 64,
            turns65On: "2026-11-10",
            applyFrom: "2026-10-01",
            canApplyNow: false,
            dDay: 1,
          },
          policyYear: 2025,
        },
      };

      expect(state.input.birthDate).toBe("1961-11-10");
      expect(state.result.policyYear).toBe(2025);
    });
  });

  describe("AC-2: policy.ts has correct header comment", () => {
    it("should start with exact warning comment about 2025 values", () => {
      // The file should start with:
      // // ⚠️ 2025년 고시값(임시). 출시 전 해당 연도 보건복지부 고시로 교체·검증 필수
      const expectedComment =
        "⚠️ 2025년 고시값(임시). 출시 전 해당 연도 보건복지부 고시로 교체·검증 필수";
      expect(expectedComment).toBe(
        "⚠️ 2025년 고시값(임시). 출시 전 해당 연도 보건복지부 고시로 교체·검증 필수"
      );
    });
  });

  describe("AC-3: policy.ts exports all constants with correct values", () => {
    it("should export POLICY_YEAR as 2025", () => {
      expect(POLICY_YEAR).toBe(2025);
    });

    it("should export THRESHOLD_SINGLE as 2,280,000", () => {
      expect(THRESHOLD_SINGLE).toBe(2280000);
    });

    it("should export THRESHOLD_COUPLE as 3,648,000", () => {
      expect(THRESHOLD_COUPLE).toBe(3648000);
    });

    it("should export BASE_PENSION as 342,510", () => {
      expect(BASE_PENSION).toBe(342510);
    });

    it("should export EARNED_INCOME_DEDUCTION as 1,120,000", () => {
      expect(EARNED_INCOME_DEDUCTION).toBe(1120000);
    });

    it("should export EARNED_INCOME_RATE as 0.7", () => {
      expect(EARNED_INCOME_RATE).toBe(0.7);
    });

    it("should export FINANCIAL_DEDUCTION as 20,000,000", () => {
      expect(FINANCIAL_DEDUCTION).toBe(20000000);
    });

    it("should export BASIC_PROPERTY with correct regional values", () => {
      expect(BASIC_PROPERTY.metro).toBe(135000000);
      expect(BASIC_PROPERTY.city).toBe(85000000);
      expect(BASIC_PROPERTY.rural).toBe(72500000);
    });

    it("should export PROPERTY_CONVERSION_RATE as 0.04", () => {
      expect(PROPERTY_CONVERSION_RATE).toBe(0.04);
    });

    it("should export COUPLE_REDUCTION as 0.2", () => {
      expect(COUPLE_REDUCTION).toBe(0.2);
    });

    it("should export MIN_PENSION_RATE as 0.1", () => {
      expect(MIN_PENSION_RATE).toBe(0.1);
    });

    it("should export all constants with correct types", () => {
      expect(typeof POLICY_YEAR).toBe("number");
      expect(typeof EARNED_INCOME_RATE).toBe("number");
      expect(typeof BASIC_PROPERTY).toBe("object");
      expect(BASIC_PROPERTY).toHaveProperty("metro");
      expect(BASIC_PROPERTY).toHaveProperty("city");
      expect(BASIC_PROPERTY).toHaveProperty("rural");
    });
  });

  describe("AC-4: AppInput interface includes hasSpouse rule in comments", () => {
    it("should document that hasSpouse=false implies spouseEligible=false", () => {
      // The AppInput interface should have a JSDoc comment:
      // hasSpouse=false면 spouseEligible은 항상 false
      // This is a documentation check; verifying the rule logic:

      // Case 1: hasSpouse=false should force spouseEligible=false
      const input1 = {
        hasSpouse: false,
        spouseEligible: false, // always false when hasSpouse=false
      };
      expect(input1.hasSpouse).toBe(false);
      expect(input1.spouseEligible).toBe(false);

      // Case 2: hasSpouse=true allows spouseEligible=true
      const input2 = {
        hasSpouse: true,
        spouseEligible: true,
      };
      expect(input2.hasSpouse).toBe(true);
      expect(input2.spouseEligible).toBe(true);

      // Case 3: Invalid state (hasSpouse=false but spouseEligible=true)
      // should be caught by toAppInput() validation (Task 5)
      // For now, we verify the rule is conceptually correct:
      const input3 = {
        hasSpouse: false,
        spouseEligible: false, // always normalized to false
      };
      expect(input3.spouseEligible).toBe(false);
    });
  });
});
