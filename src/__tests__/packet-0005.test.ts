import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { readFileSync } from "node:fs";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { mockTds, mockAppsInToss } from "@/__tests__/__helpers__/mocks";
import Home from "@/pages/Home";

mockTds();
mockAppsInToss();

const { mockNavigate, runDiagnosisSpy, saveLastInputSpy } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  runDiagnosisSpy: vi.fn(),
  saveLastInputSpy: vi.fn(),
}));

vi.mock("react-router-dom", async () => ({
  ...(await vi.importActual("react-router-dom")),
  useNavigate: () => mockNavigate,
}));

vi.mock("@/state/AppStateContext", () => ({
  useAppState: () => ({ input: {}, setInput: vi.fn() }),
}));

// 실제 구현을 감싸는 스파이 — 호출 횟수·반환값을 보고, 필요할 때만 throw/false로 바꾼다.
vi.mock("@/lib/validation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/validation")>();
  runDiagnosisSpy.mockImplementation(actual.runDiagnosis);
  return { ...actual, runDiagnosis: runDiagnosisSpy };
});
vi.mock("@/lib/storedInput", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/storedInput")>();
  saveLastInputSpy.mockImplementation(actual.saveLastInput);
  return { ...actual, saveLastInput: saveLastInputSpy };
});

vi.mock("@/components/AdSlot", () => ({
  AdSlot: () => React.createElement("div", { "data-testid": "ad-slot" }),
  default: () => React.createElement("div", { "data-testid": "ad-slot" }),
}));

const HINT = "생년월일·배우자 유무·거주 지역을 입력해 주세요";
const scrollIntoView = vi.fn();

const INPUT_A = {
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

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-09-30T09:00:00+09:00"));
  Element.prototype.scrollIntoView = scrollIntoView;
});

function renderHome() {
  return render(React.createElement(MemoryRouter, null, React.createElement(Home)));
}

const birthInput = () => screen.getByPlaceholderText("예: 19611110") as HTMLInputElement;
const earnedInput = () => screen.getByLabelText(/근로소득/) as HTMLInputElement;
const submitBtn = () => screen.getByRole("button", { name: "진단하기" }) as HTMLButtonElement;
const chip = (name: string) => screen.getByRole("button", { name });
const invalidCount = (c: HTMLElement) => c.querySelectorAll('[aria-invalid="true"]').length;

function fillRequired(spouse: "없음" | "있음" = "없음") {
  fireEvent.change(birthInput(), { target: { value: "19611110" } });
  fireEvent.click(chip(spouse));
  fireEvent.click(chip("대도시"));
}

describe("Home Page: 입력 폼·검증·제출", () => {
  it("AC-1[P0]: 첫 렌더에는 빨간 칸이 0개이고 blur 뒤에만 hasError와 help가 나온다", () => {
    const { container } = renderHome();
    expect(invalidCount(container)).toBe(0);

    fireEvent.change(birthInput(), { target: { value: "1961" } });
    expect(invalidCount(container)).toBe(0); // 입력만으로는 안 보인다
    expect(screen.queryByText("올바른 생년월일을 입력해 주세요")).toBeNull();

    fireEvent.blur(birthInput());
    expect(birthInput().getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("올바른 생년월일을 입력해 주세요")).toBeTruthy();
    expect(invalidCount(container)).toBe(1);
  });

  it("AC-2[P0]: 필수 3개가 비면 진단하기 disabled + 정확한 hint, 다 채우면 활성(금액은 비어도 됨)", () => {
    renderHome();
    expect(submitBtn().disabled).toBe(true);
    expect(screen.getByText(HINT)).toBeTruthy();

    fireEvent.change(birthInput(), { target: { value: "19611110" } });
    fireEvent.click(chip("없음"));
    expect(submitBtn().disabled).toBe(true); // 지역이 비어 있다

    fireEvent.click(chip("대도시"));
    expect(submitBtn().disabled).toBe(false);
    expect(screen.queryByText(HINT)).toBeNull();
    expect(earnedInput().value).toBe("");
  });

  it("AC-3[P0]: 생년월일 붙여넣기 정제(maxLength 10), 금액 쉼표 제거, '12.5'는 blur 뒤 오류 + CTA disabled", () => {
    renderHome();
    expect(birthInput().getAttribute("maxlength")).toBe("10");
    fireEvent.change(birthInput(), { target: { value: "1961-11-10" } });
    expect(birthInput().value).toBe("19611110");

    fireEvent.click(chip("없음"));
    fireEvent.click(chip("대도시"));
    expect(submitBtn().disabled).toBe(false);

    fireEvent.change(earnedInput(), { target: { value: "1,500" } });
    expect(earnedInput().value).toBe("1500");
    expect(submitBtn().disabled).toBe(false);

    fireEvent.change(earnedInput(), { target: { value: "12.5" } });
    expect(earnedInput().value).toBe("12.5"); // 숫자만 뽑지 않는다
    expect(screen.queryByText("만 원 단위 정수로 입력해 주세요")).toBeNull();
    expect(submitBtn().disabled).toBe(true); // 오류가 있는 동안은 즉시 disabled

    fireEvent.blur(earnedInput());
    expect(screen.getByText("만 원 단위 정수로 입력해 주세요")).toBeTruthy();
    expect(earnedInput().getAttribute("aria-invalid")).toBe("true");
  });

  it("AC-4[P0]: 있음→Switch 켬→없음이면 Switch 0개, 진단은 recipients 1·couple 0건, 다시 있음이면 꺼진 Switch", () => {
    renderHome();
    fillRequired("있음");
    expect(screen.getAllByRole("switch")).toHaveLength(1);
    fireEvent.click(screen.getByRole("switch"));
    expect((screen.getByRole("switch") as HTMLInputElement).checked).toBe(true);

    fireEvent.click(chip("없음"));
    expect(screen.queryAllByRole("switch")).toHaveLength(0);

    fireEvent.click(submitBtn());
    expect(runDiagnosisSpy).toHaveBeenCalledTimes(1);
    const result = runDiagnosisSpy.mock.results[0].value;
    expect(result.pension.recipients).toBe(1);
    expect(result.pension.reductions.filter((r: string) => r === "couple")).toHaveLength(0);

    fireEvent.click(chip("있음"));
    expect((screen.getByRole("switch") as HTMLInputElement).checked).toBe(false);
  });

  it("AC-5[P0]: 빠르게 3번 눌러도 runDiagnosis 1회, 이동 전까지 disabled", () => {
    renderHome();
    fillRequired();
    const btn = submitBtn();
    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(runDiagnosisSpy).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(submitBtn().disabled).toBe(true);
  });

  it("AC-6[P0]: saveLastInput이 false여도 /result로 state와 함께 이동한다", () => {
    saveLastInputSpy.mockReturnValueOnce(false);
    renderHome();
    fillRequired();
    fireEvent.change(earnedInput(), { target: { value: "100" } });
    fireEvent.click(submitBtn());

    expect(saveLastInputSpy).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const [path, opts] = mockNavigate.mock.calls[0];
    expect(path).toBe("/result");
    expect(opts.state.input).toMatchObject({
      birthDate: "1961-11-10",
      hasSpouse: false,
      spouseEligible: false,
      region: "metro",
      monthlyEarnedIncome: 1000000,
      monthlyOtherIncome: 0,
    });
    expect(opts.state.result.pension.recipients).toBe(1);
  });

  it("AC-6[P0]: runDiagnosis가 throw하면 '계산 중 문제가 생겼어요' 다이얼로그와 [다시 시도], 이동 없음", () => {
    runDiagnosisSpy.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    renderHome();
    fillRequired();
    fireEvent.click(submitBtn());

    const dialog = screen.getByRole("alertdialog", { name: "계산 중 문제가 생겼어요" });
    expect(dialog).toBeTruthy();
    expect(mockNavigate).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "다시 시도" }));
    expect(runDiagnosisSpy).toHaveBeenCalledTimes(2);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate.mock.calls[0][0]).toBe("/result");
  });

  it("AC-7[P0]: 유효한 저장값으로 미리 채우고, 손상된 JSON이면 빈 폼 + 빨간 칸 0개", () => {
    localStorage.setItem("bpc:lastInput", JSON.stringify(INPUT_A));
    const first = renderHome();
    expect(birthInput().value).toBe("19611110");
    expect((screen.getByLabelText(/일반재산/) as HTMLInputElement).value).toBe("20000");
    expect((screen.getByLabelText(/기타소득/) as HTMLInputElement).value).toBe("50");
    expect(chip("없음").getAttribute("aria-pressed")).toBe("true");
    expect(chip("대도시").getAttribute("aria-pressed")).toBe("true");
    expect(submitBtn().disabled).toBe(false);
    first.unmount();

    localStorage.setItem("bpc:lastInput", "{bad json");
    const { container } = renderHome();
    expect(birthInput().value).toBe("");
    expect(chip("없음").getAttribute("aria-pressed")).toBe("false");
    expect(invalidCount(container)).toBe(0);
    expect(submitBtn().disabled).toBe(true);
  });

  it("AC-8[P1]: 모든 TextField에 aria-label, focus 시 scrollIntoView center, 인라인 간격·HEX·rgb( 0건", () => {
    const { container } = renderHome();
    const fields = screen.getAllByRole("textbox") as HTMLInputElement[];
    expect(fields).toHaveLength(7);
    for (const f of fields) {
      expect((f.getAttribute("aria-label") ?? "").length).toBeGreaterThan(0);
    }

    fireEvent.focus(birthInput());
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "center" });

    const html = container.innerHTML;
    expect(/style="[^"]*(margin|padding)/i.test(html)).toBe(false);
    const src = readFileSync("src/pages/Home.tsx", "utf8");
    expect(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![\w-])|rgb\(/.test(src)).toBe(false);
    expect(/style=\{\{[^}]*(margin|padding)/i.test(src)).toBe(false);
  });

  it("AC-9[P1]: VITE_TOSS_AD_GROUP_ID 없이도 조작·제출이 되고 광고는 CTA 밖, 광고 오류 문구 없음", () => {
    expect(import.meta.env.VITE_TOSS_AD_GROUP_ID).toBeUndefined();
    renderHome();
    fillRequired();
    for (const ad of screen.queryAllByTestId("ad-slot")) {
      expect(ad.closest("button")).toBeNull();
    }
    expect(screen.queryByText(/광고.*(오류|실패|불러오지)/)).toBeNull();

    fireEvent.click(submitBtn());
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate.mock.calls[0][0]).toBe("/result");
  });
});
