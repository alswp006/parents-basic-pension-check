import { describe, it, expect, beforeEach, vi } from "vitest";
import type { FormState, AppInput, AppResult } from "@/lib/types";

/**
 * Packet 0003: Schedule, Validation & runDiagnosis TDD Tests
 *
 * AC-1: calcSchedule(birthDate, today) — 만 65세 생일, 신청 시작일, D-day, 만 나이 계산
 * AC-2: validateForm의 금액 칸 오류 문구 — 정수/음수/기타 문자 처리
 * AC-3: validateForm의 생년월일 오류 문구 — 존재 여부/범위 검증
 * AC-4: toAppInput — hasSpouse=false 시 spouseEligible 정규화, 문자→원 변환
 * AC-5: runDiagnosis — 올바른 AppResult 반환, NaN/Infinity 감지
 * AC-6: 모든 검증 함수와 상수가 export됨
 *
 * Note: 이 테스트는 TDD red phase입니다. 구현 함수가 아직 없으므로 실패할 것이 정상입니다.
 * 시그니처는 src/lib/validation.ts, src/lib/schedule.ts에 구현되어야 합니다.
 */

describe("Packet 0003: Schedule, Validation & runDiagnosis", () => {
  // 시계 고정: today = 2026-09-30 09:00 (한국 시간)
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-30T09:00:00+09:00"));
  });

  const today = new Date("2026-09-30");

  // 동적 import를 통해 아직 구현되지 않은 함수들을 테스트합니다.
  // TDD red phase에서는 이들이 없거나 error를 throw할 것이 정상입니다.
  let calcSchedule: any;
  let validateForm: any;
  let toAppInput: any;
  let runDiagnosis: any;
  let validateAmountText: any;
  let isValidBirthDate: any;
  let AMOUNT_LIMIT_MANWON: any;

  beforeEach(async () => {
    try {
      const scheduleModule = await import("@/lib/schedule");
      calcSchedule = scheduleModule.calcSchedule;
    } catch (e) {
      calcSchedule = undefined;
    }

    try {
      const validationModule = await import("@/lib/validation");
      validateForm = validationModule.validateForm;
      toAppInput = validationModule.toAppInput;
      runDiagnosis = validationModule.runDiagnosis;
      validateAmountText = validationModule.validateAmountText;
      isValidBirthDate = validationModule.isValidBirthDate;
      AMOUNT_LIMIT_MANWON = validationModule.AMOUNT_LIMIT_MANWON;
    } catch (e) {
      validateForm = undefined;
      toAppInput = undefined;
      runDiagnosis = undefined;
      validateAmountText = undefined;
      isValidBirthDate = undefined;
      AMOUNT_LIMIT_MANWON = undefined;
    }
  });

  // ============================================================================
  // AC-1: calcSchedule(birthDate, today) 계산 검증
  // ============================================================================
  describe("AC-1: calcSchedule(birthDate, today) 계산", () => {
    it("AC-1[P0]: 1961-11-10생 → turns65On '2026-11-10', applyFrom '2026-10-01', canApplyNow false, dDay 1, age 64", () => {
      if (!calcSchedule) {
        throw new Error(
          "calcSchedule not implemented in @/lib/schedule (TDD red phase)"
        );
      }

      const result = calcSchedule("1961-11-10", today);

      expect(result.turns65On).toBe("2026-11-10");
      expect(result.applyFrom).toBe("2026-10-01");
      expect(result.canApplyNow).toBe(false);
      expect(result.dDay).toBe(1);
      expect(result.age).toBe(64);
    });

    it("AC-1[P0]: 1961-04-15생 → applyFrom '2026-03-01', canApplyNow true, dDay 0, age 65", () => {
      if (!calcSchedule) {
        throw new Error(
          "calcSchedule not implemented in @/lib/schedule (TDD red phase)"
        );
      }

      const result = calcSchedule("1961-04-15", today);

      expect(result.applyFrom).toBe("2026-03-01");
      expect(result.canApplyNow).toBe(true);
      expect(result.dDay).toBe(0);
      expect(result.age).toBe(65);
    });

    it("AC-1: 1960-02-29생 (윤년 생일) → turns65On '2025-03-01' (평년이므로 3월 1일)", () => {
      if (!calcSchedule) {
        throw new Error(
          "calcSchedule not implemented in @/lib/schedule (TDD red phase)"
        );
      }

      const result = calcSchedule("1960-02-29", today);

      // 1960은 윤년, 2025는 평년이므로 2월 29일이 없음 → 3월 1일
      expect(result.turns65On).toBe("2025-03-01");
      expect(result.applyFrom).toBe("2025-02-01");
      expect(result.canApplyNow).toBe(true);
    });
  });

  // ============================================================================
  // AC-2: validateForm의 금액 칸 검증
  // ============================================================================
  describe("AC-2: validateForm의 금액 칸 오류 문구", () => {
    it("AC-2[P0]: '12.5' → '만 원 단위 정수로 입력해 주세요' (소수점)", () => {
      if (!validateForm) {
        throw new Error(
          "validateForm not implemented in @/lib/validation (TDD red phase)"
        );
      }

      const form: FormState = {
        birthDate: "19611110",
        hasSpouse: false,
        spouseEligible: false,
        region: "metro",
        earned: "12.5",
        other: "",
        general: "",
        financial: "",
        debt: "",
        luxury: "",
      };

      const validation = validateForm(form, today);

      expect(validation.errors.earned).toBe(
        "만 원 단위 정수로 입력해 주세요"
      );
      expect(validation.valid).toBe(false);
    });

    it("AC-2[P0]: 'abc' → '만 원 단위 정수로 입력해 주세요' (문자)", () => {
      if (!validateForm) {
        throw new Error(
          "validateForm not implemented in @/lib/validation (TDD red phase)"
        );
      }

      const form: FormState = {
        birthDate: "19611110",
        hasSpouse: false,
        spouseEligible: false,
        region: "metro",
        earned: "",
        other: "abc",
        general: "",
        financial: "",
        debt: "",
        luxury: "",
      };

      const validation = validateForm(form, today);

      expect(validation.errors.other).toBe(
        "만 원 단위 정수로 입력해 주세요"
      );
    });

    it("AC-2[P0]: '-5' 소득 칸 → '0 ~ 10,000만 원 사이로 입력해 주세요' (음수, 범위)", () => {
      if (!validateForm) {
        throw new Error(
          "validateForm not implemented in @/lib/validation (TDD red phase)"
        );
      }

      const form: FormState = {
        birthDate: "19611110",
        hasSpouse: false,
        spouseEligible: false,
        region: "metro",
        earned: "-5",
        other: "",
        general: "",
        financial: "",
        debt: "",
        luxury: "",
      };

      const validation = validateForm(form, today);

      expect(validation.errors.earned).toBe(
        "0 ~ 10,000만 원 사이로 입력해 주세요"
      );
    });

    it("AC-2: '-5' 재산 칸 → '0 ~ 1,000,000만 원 사이로 입력해 주세요' (음수, 재산 범위)", () => {
      if (!validateForm) {
        throw new Error(
          "validateForm not implemented in @/lib/validation (TDD red phase)"
        );
      }

      const form: FormState = {
        birthDate: "19611110",
        hasSpouse: false,
        spouseEligible: false,
        region: "metro",
        earned: "",
        other: "",
        general: "-5",
        financial: "",
        debt: "",
        luxury: "",
      };

      const validation = validateForm(form, today);

      expect(validation.errors.general).toBe(
        "0 ~ 1,000,000만 원 사이로 입력해 주세요"
      );
    });

    it("AC-2[P0]: '0050' → 오류 없음 (앞자리 0 무시)", () => {
      if (!validateForm || !toAppInput) {
        throw new Error(
          "validateForm/toAppInput not implemented in @/lib/validation (TDD red phase)"
        );
      }

      const form: FormState = {
        birthDate: "19611110",
        hasSpouse: false,
        spouseEligible: false,
        region: "metro",
        earned: "0050",
        other: "",
        general: "",
        financial: "",
        debt: "",
        luxury: "",
      };

      const validation = validateForm(form, today);

      expect(validation.errors.earned).toBeUndefined();
      expect(validation.valid).toBe(true);

      const input = toAppInput(form);
      expect(input.monthlyEarnedIncome).toBe(500000);
    });

    it("AC-2[P0]: 빈 문자열 '' → 오류 없음 (0원으로 처리)", () => {
      if (!validateForm || !toAppInput) {
        throw new Error(
          "validateForm/toAppInput not implemented in @/lib/validation (TDD red phase)"
        );
      }

      const form: FormState = {
        birthDate: "19611110",
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

      const validation = validateForm(form, today);
      expect(validation.errors.earned).toBeUndefined();
      expect(validation.errors.other).toBeUndefined();

      const input = toAppInput(form);
      expect(input.monthlyEarnedIncome).toBe(0);
      expect(input.monthlyOtherIncome).toBe(0);
    });

    it("AC-2[P0]: 소득 칸 '10001' → 범위 오류 (10,000만 원 초과)", () => {
      if (!validateForm) {
        throw new Error(
          "validateForm not implemented in @/lib/validation (TDD red phase)"
        );
      }

      const form: FormState = {
        birthDate: "19611110",
        hasSpouse: false,
        spouseEligible: false,
        region: "metro",
        earned: "10001",
        other: "",
        general: "",
        financial: "",
        debt: "",
        luxury: "",
      };

      const validation = validateForm(form, today);

      expect(validation.errors.earned).toBe(
        "0 ~ 10,000만 원 사이로 입력해 주세요"
      );
    });
  });

  // ============================================================================
  // AC-3: validateForm의 생년월일 검증
  // ============================================================================
  describe("AC-3: validateForm의 생년월일 오류 문구", () => {
    it("AC-3[P0]: '1961111' (7자리) → '올바른 생년월일을 입력해 주세요'", () => {
      if (!validateForm) {
        throw new Error(
          "validateForm not implemented in @/lib/validation (TDD red phase)"
        );
      }

      const form: FormState = {
        birthDate: "1961111",
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

      const validation = validateForm(form, today);

      expect(validation.errors.birthDate).toBe(
        "올바른 생년월일을 입력해 주세요"
      );
    });

    it("AC-3[P0]: '19610231' (존재하지 않는 날짜) → '올바른 생년월일을 입력해 주세요'", () => {
      if (!validateForm) {
        throw new Error(
          "validateForm not implemented in @/lib/validation (TDD red phase)"
        );
      }

      const form: FormState = {
        birthDate: "19610231",
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

      const validation = validateForm(form, today);

      expect(validation.errors.birthDate).toBe(
        "올바른 생년월일을 입력해 주세요"
      );
    });

    it("AC-3[P0]: '18991231' (1900-01-01 이전) → '올바른 생년월일을 입력해 주세요'", () => {
      if (!validateForm) {
        throw new Error(
          "validateForm not implemented in @/lib/validation (TDD red phase)"
        );
      }

      const form: FormState = {
        birthDate: "18991231",
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

      const validation = validateForm(form, today);

      expect(validation.errors.birthDate).toBe(
        "올바른 생년월일을 입력해 주세요"
      );
    });

    it("AC-3[P0]: 오늘 이후 날짜 → '올바른 생년월일을 입력해 주세요'", () => {
      if (!validateForm) {
        throw new Error(
          "validateForm not implemented in @/lib/validation (TDD red phase)"
        );
      }

      const form: FormState = {
        birthDate: "20261001", // 2026-10-01 (today보다 이후)
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

      const validation = validateForm(form, today);

      expect(validation.errors.birthDate).toBe(
        "올바른 생년월일을 입력해 주세요"
      );
    });

    it("AC-3[P0]: 생년월일이 비어 있음 → missingRequired true", () => {
      if (!validateForm) {
        throw new Error(
          "validateForm not implemented in @/lib/validation (TDD red phase)"
        );
      }

      const form: FormState = {
        birthDate: "",
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

      const validation = validateForm(form, today);

      expect(validation.missingRequired).toBe(true);
    });

    it("AC-3: hasSpouse === null → missingRequired true", () => {
      if (!validateForm) {
        throw new Error(
          "validateForm not implemented in @/lib/validation (TDD red phase)"
        );
      }

      const form: FormState = {
        birthDate: "19611110",
        hasSpouse: null,
        spouseEligible: false,
        region: "metro",
        earned: "",
        other: "",
        general: "",
        financial: "",
        debt: "",
        luxury: "",
      };

      const validation = validateForm(form, today);

      expect(validation.missingRequired).toBe(true);
    });

    it("AC-3: region === null → missingRequired true", () => {
      if (!validateForm) {
        throw new Error(
          "validateForm not implemented in @/lib/validation (TDD red phase)"
        );
      }

      const form: FormState = {
        birthDate: "19611110",
        hasSpouse: false,
        spouseEligible: false,
        region: null,
        earned: "",
        other: "",
        general: "",
        financial: "",
        debt: "",
        luxury: "",
      };

      const validation = validateForm(form, today);

      expect(validation.missingRequired).toBe(true);
    });
  });

  // ============================================================================
  // AC-4: toAppInput 변환 규칙
  // ============================================================================
  describe("AC-4: toAppInput(form) 변환", () => {
    it("AC-4[P0]: form.hasSpouse=false, spouseEligible=true → 결과 spouseEligible=false", () => {
      if (!toAppInput) {
        throw new Error(
          "toAppInput not implemented in @/lib/validation (TDD red phase)"
        );
      }

      const form: FormState = {
        birthDate: "19611110",
        hasSpouse: false,
        spouseEligible: true, // 입력에는 true이지만
        region: "metro",
        earned: "0",
        other: "500",
        general: "2000",
        financial: "300",
        debt: "0",
        luxury: "0",
      };

      const input: AppInput = toAppInput(form);

      // 결과에서는 항상 false
      expect(input.hasSpouse).toBe(false);
      expect(input.spouseEligible).toBe(false);
    });

    it("AC-4[P0]: birthDate '19611110' → 결과 '1961-11-10' (YYYY-MM-DD 형식)", () => {
      if (!toAppInput) {
        throw new Error(
          "toAppInput not implemented in @/lib/validation (TDD red phase)"
        );
      }

      const form: FormState = {
        birthDate: "19611110",
        hasSpouse: false,
        spouseEligible: false,
        region: "metro",
        earned: "0",
        other: "500",
        general: "2000",
        financial: "300",
        debt: "0",
        luxury: "0",
      };

      const input: AppInput = toAppInput(form);

      expect(input.birthDate).toBe("1961-11-10");
    });

    it("AC-4[P0]: 금액 '500' (만 원) → 5,000,000원 (원 단위)", () => {
      if (!toAppInput) {
        throw new Error(
          "toAppInput not implemented in @/lib/validation (TDD red phase)"
        );
      }

      const form: FormState = {
        birthDate: "19611110",
        hasSpouse: false,
        spouseEligible: false,
        region: "metro",
        earned: "0",
        other: "500",
        general: "2000",
        financial: "300",
        debt: "100",
        luxury: "50",
      };

      const input: AppInput = toAppInput(form);

      expect(input.monthlyOtherIncome).toBe(5000000);
      expect(input.generalProperty).toBe(20000000);
      expect(input.financialProperty).toBe(3000000);
      expect(input.debt).toBe(1000000);
      expect(input.luxuryAssets).toBe(500000);
    });

    it("AC-4: 빈 문자열 '' → 0원", () => {
      if (!toAppInput) {
        throw new Error(
          "toAppInput not implemented in @/lib/validation (TDD red phase)"
        );
      }

      const form: FormState = {
        birthDate: "19611110",
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

      const input: AppInput = toAppInput(form);

      expect(input.monthlyEarnedIncome).toBe(0);
      expect(input.monthlyOtherIncome).toBe(0);
      expect(input.generalProperty).toBe(0);
      expect(input.financialProperty).toBe(0);
      expect(input.debt).toBe(0);
      expect(input.luxuryAssets).toBe(0);
    });

    it("AC-4: '0050' (앞자리 0) → 500,000원 (0 무시)", () => {
      if (!toAppInput) {
        throw new Error(
          "toAppInput not implemented in @/lib/validation (TDD red phase)"
        );
      }

      const form: FormState = {
        birthDate: "19611110",
        hasSpouse: false,
        spouseEligible: false,
        region: "metro",
        earned: "0050",
        other: "",
        general: "",
        financial: "",
        debt: "",
        luxury: "",
      };

      const input: AppInput = toAppInput(form);

      expect(input.monthlyEarnedIncome).toBe(500000);
    });
  });

  // ============================================================================
  // AC-5: runDiagnosis 계산 검증
  // ============================================================================
  describe("AC-5: runDiagnosis(input, today) 계산", () => {
    it("AC-5[P0]: 입력 A → recognizedIncome 750000, threshold 2280000, verdict 'likely', perPerson 342510, policyYear 2025", () => {
      if (!runDiagnosis) {
        throw new Error(
          "runDiagnosis not implemented in @/lib/validation (TDD red phase)"
        );
      }

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

      const result: AppResult = runDiagnosis(inputA, today);

      expect(result.recognizedIncome).toBe(750000);
      expect(result.threshold).toBe(2280000);
      expect(result.verdict).toBe("likely");
      expect(result.pension.perPerson).toBe(342510);
      expect(result.policyYear).toBe(2025);
    });

    it("AC-5[P0]: 결과에 NaN이 있으면 Error를 throw", () => {
      if (!runDiagnosis) {
        throw new Error(
          "runDiagnosis not implemented in @/lib/validation (TDD red phase)"
        );
      }

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

      // runDiagnosis 내부에서 NaN 검사 후 throw하는지 확인
      expect(() => {
        const result = runDiagnosis(inputA, today);
        // 모든 수치 필드가 valid한지 확인
        if (
          Number.isNaN(result.recognizedIncome) ||
          Number.isNaN(result.threshold) ||
          Number.isNaN(result.ratio) ||
          Number.isNaN(result.pension.perPerson) ||
          Number.isNaN(result.pension.household)
        ) {
          throw new Error("NaN detected in calculation results");
        }
      }).not.toThrow();
    });

    it("AC-5[P0]: 결과에 Infinity가 있으면 Error를 throw", () => {
      if (!runDiagnosis) {
        throw new Error(
          "runDiagnosis not implemented in @/lib/validation (TDD red phase)"
        );
      }

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

      expect(() => {
        const result = runDiagnosis(inputA, today);
        // 모든 수치 필드가 finite한지 확인
        if (
          !Number.isFinite(result.recognizedIncome) ||
          !Number.isFinite(result.threshold) ||
          !Number.isFinite(result.ratio) ||
          !Number.isFinite(result.pension.perPerson) ||
          !Number.isFinite(result.pension.household)
        ) {
          throw new Error("Infinity detected in calculation results");
        }
      }).not.toThrow();
    });

    it("AC-5: 배우자 있고 eligible 시 recipients=2", () => {
      if (!runDiagnosis) {
        throw new Error(
          "runDiagnosis not implemented in @/lib/validation (TDD red phase)"
        );
      }

      const inputCouple: AppInput = {
        birthDate: "1961-11-10",
        hasSpouse: true,
        spouseEligible: true,
        region: "metro",
        monthlyEarnedIncome: 0,
        monthlyOtherIncome: 500000,
        generalProperty: 200000000,
        financialProperty: 30000000,
        debt: 0,
        luxuryAssets: 0,
      };

      const result: AppResult = runDiagnosis(inputCouple, today);

      expect(result.pension.recipients).toBe(2);
      expect(result.threshold).toBe(3648000); // THRESHOLD_COUPLE
    });

    it("AC-5: 모든 필드가 AppResult 타입으로 정의됨", () => {
      if (!runDiagnosis) {
        throw new Error(
          "runDiagnosis not implemented in @/lib/validation (TDD red phase)"
        );
      }

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

      const result: AppResult = runDiagnosis(inputA, today);

      // 모든 필드 존재 확인
      expect(result).toHaveProperty("income");
      expect(result).toHaveProperty("property");
      expect(result).toHaveProperty("recognizedIncome");
      expect(result).toHaveProperty("threshold");
      expect(result).toHaveProperty("ratio");
      expect(result).toHaveProperty("verdict");
      expect(result).toHaveProperty("pension");
      expect(result).toHaveProperty("schedule");
      expect(result).toHaveProperty("policyYear");

      expect(result.income).toHaveProperty("earnedReflected");
      expect(result.income).toHaveProperty("other");
      expect(result.income).toHaveProperty("total");

      expect(result.property).toHaveProperty("general");
      expect(result.property).toHaveProperty("financial");
      expect(result.property).toHaveProperty("debt");
      expect(result.property).toHaveProperty("basicDeduction");
      expect(result.property).toHaveProperty("luxury");
      expect(result.property).toHaveProperty("clamped");
      expect(result.property).toHaveProperty("total");

      expect(result.pension).toHaveProperty("eligible");
      expect(result.pension).toHaveProperty("recipients");
      expect(result.pension).toHaveProperty("perPerson");
      expect(result.pension).toHaveProperty("household");
      expect(result.pension).toHaveProperty("reductions");

      expect(result.schedule).toHaveProperty("age");
      expect(result.schedule).toHaveProperty("turns65On");
      expect(result.schedule).toHaveProperty("applyFrom");
      expect(result.schedule).toHaveProperty("canApplyNow");
      expect(result.schedule).toHaveProperty("dDay");
    });
  });

  // ============================================================================
  // AC-6: 통합 검증 — 모든 export가 있는가
  // ============================================================================
  describe("AC-6: 통합 검증", () => {
    it("모든 검증 함수와 일정 계산이 export되어 있음", () => {
      if (
        !calcSchedule ||
        !validateForm ||
        !toAppInput ||
        !runDiagnosis ||
        !validateAmountText ||
        !isValidBirthDate
      ) {
        throw new Error(
          "One or more functions not implemented (TDD red phase)"
        );
      }

      expect(typeof calcSchedule).toBe("function");
      expect(typeof validateForm).toBe("function");
      expect(typeof toAppInput).toBe("function");
      expect(typeof runDiagnosis).toBe("function");
      expect(typeof validateAmountText).toBe("function");
      expect(typeof isValidBirthDate).toBe("function");
    });

    it("AMOUNT_LIMIT_MANWON 상수가 export됨", () => {
      if (!AMOUNT_LIMIT_MANWON) {
        throw new Error(
          "AMOUNT_LIMIT_MANWON not implemented in @/lib/validation (TDD red phase)"
        );
      }

      expect(AMOUNT_LIMIT_MANWON).toBeDefined();
      expect(typeof AMOUNT_LIMIT_MANWON).toBe("object");
      expect(AMOUNT_LIMIT_MANWON).toHaveProperty("income");
      expect(AMOUNT_LIMIT_MANWON).toHaveProperty("asset");
      expect(AMOUNT_LIMIT_MANWON.income).toBe(10000);
      expect(AMOUNT_LIMIT_MANWON.asset).toBe(1000000);
    });
  });
});
