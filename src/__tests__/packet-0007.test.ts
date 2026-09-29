import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { mockTds, mockAppsInToss } from "@/__tests__/__helpers__/mocks";
import { runDiagnosis } from "@/lib/validation";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { AppInput, AppResult } from "@/lib/types";
import Result from "@/pages/Result";

mockTds();
mockAppsInToss();

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => ({
  ...(await vi.importActual("react-router-dom")),
  useNavigate: () => mockNavigate,
}));

vi.mock("@/state/AppStateContext", () => ({
  useAppState: () => ({ input: {}, setInput: vi.fn() }),
}));

const TODAY = new Date("2026-09-30T09:00:00+09:00");

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(TODAY);
});

// 공통 예시 입력 A: 배우자 없음, 대도시, 기타소득 50만 원, 일반재산 2억, 금융재산 3천만 원
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

function renderResult(state?: unknown) {
  return render(
    React.createElement(
      MemoryRouter,
      { initialEntries: [{ pathname: "/result", state: state ?? null }] },
      React.createElement(Result),
    ),
  );
}

function stateFor(input: AppInput, mutate?: (r: AppResult) => void) {
  const result = runDiagnosis(input, TODAY);
  mutate?.(result);
  return { input, result };
}

const DISCLAIMER =
  "2025년 선정기준액으로 계산한 모의 추정이에요. 실제 수급 여부는 국민연금공단·주민센터 조사로 결정돼요.";

describe("Result Page: 판정·수령액·신청 시기", () => {
  it("AC-1[P0]: 입력 A 결과에 판정·소득인정액·선정기준액·비율·수령액·감액 없음이 표시된다", () => {
    renderResult(stateFor(inputA));
    expect(screen.getByText("받을 가능성이 높아요")).toBeInTheDocument();
    expect(screen.getAllByText(formatCurrency(750000)).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(formatCurrency(2280000)).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/32\.9%/)).toBeInTheDocument();
    // 1인 342,510 + 가구 합계 342,510
    expect(screen.getAllByText(new RegExp(formatCurrency(342510).replace("₩", "\\₩"))).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("감액 없음")).toBeInTheDocument();
  });

  it("AC-2[P0]: 판정 문구 3종이 SPEC 문구와 정확히 같다", () => {
    const texts: Record<string, string> = {
      likely: "받을 가능성이 높아요",
      borderline: "기준선 근처예요",
      unlikely: "받기 어려워 보여요",
    };
    for (const [verdict, text] of Object.entries(texts)) {
      const { unmount } = renderResult(
        stateFor(inputA, (r) => {
          r.verdict = verdict as AppResult["verdict"];
        }),
      );
      expect(screen.getByText(text)).toBeInTheDocument();
      unmount();
    }
  });

  it("AC-2[P0]: 해당하는 감액 사유가 모두 Badge로 보인다", () => {
    renderResult(
      stateFor(inputA, (r) => {
        r.pension.reductions = ["couple", "incomeReversal"];
      }),
    );
    expect(screen.getByText("부부 감액 20%")).toBeInTheDocument();
    expect(screen.getByText("소득역전 방지 감액")).toBeInTheDocument();
    expect(screen.queryByText("감액 없음")).toBeNull();
  });

  it("AC-3[P0]: eligible=false면 Badge 대신 안내 문구가 나오고 금액은 0원이다", () => {
    const rich: AppInput = { ...inputA, monthlyOtherIncome: 3000000 };
    renderResult(stateFor(rich));
    expect(screen.getByText("기준을 넘어 수령액이 없을 것으로 보여요")).toBeInTheDocument();
    expect(screen.queryByText("감액 없음")).toBeNull();
    expect(screen.getAllByText(formatCurrency(0)).length).toBeGreaterThanOrEqual(2);
  });

  it("AC-4[P0]: today=2026-09-30, 1961-11-10생이면 D-1 신청 시기와 만 64세가 표시된다", () => {
    renderResult(stateFor(inputA));
    expect(screen.getByText(`2026년 10월 1일부터 신청할 수 있어요 (D-${formatNumber(1)})`)).toBeInTheDocument();
    expect(screen.getByText(/만 64세/)).toBeInTheDocument();
    expect(screen.getByText("D-1")).toBeInTheDocument();
  });

  it("AC-4[P0]: canApplyNow면 '지금 신청할 수 있어요'와 Badge '신청 가능'이 표시된다", () => {
    renderResult(stateFor({ ...inputA, birthDate: "1960-04-15" }));
    expect(screen.getByText("지금 신청할 수 있어요")).toBeInTheDocument();
    expect(screen.getByText("신청 가능")).toBeInTheDocument();
    expect(screen.getByText(/만 66세/)).toBeInTheDocument();
  });

  it("AC-5[P0]: route state·localStorage가 비면 EmptyState가 뜨고 버튼이 '/'로 이동한다", () => {
    renderResult();
    expect(screen.getByText("아직 진단 결과가 없어요")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "진단하러 가기" }));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("AC-5[P0]: localStorage가 '{bad json'이어도 EmptyState가 뜬다", () => {
    localStorage.setItem("bpc:lastInput", "{bad json");
    renderResult();
    expect(screen.getByText("아직 진단 결과가 없어요")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "진단하러 가기" })).toBeInTheDocument();
  });

  it("AC-5[P0]: route state가 없고 유효한 lastInput이 있으면 다시 계산한 결과가 보인다", () => {
    localStorage.setItem("bpc:lastInput", JSON.stringify(inputA));
    renderResult();
    expect(screen.queryByText("아직 진단 결과가 없어요")).toBeNull();
    expect(screen.getByText("받을 가능성이 높아요")).toBeInTheDocument();
    expect(screen.getAllByText(formatCurrency(750000)).length).toBeGreaterThanOrEqual(1);
  });

  it("AC-6[P0]: 구조가 잘못된 route state면 에러 화면이 뜨고 버튼이 '/'로 이동한다", () => {
    renderResult({ foo: 1 });
    expect(screen.getByText("계산 중 문제가 생겼어요")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "다시 계산하기" }));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("AC-6[P0]: NaN이 든 결과는 크래시 없이 에러 화면을 보여 준다", () => {
    renderResult(
      stateFor(inputA, (r) => {
        r.recognizedIncome = NaN;
      }),
    );
    expect(screen.getByText("계산 중 문제가 생겼어요")).toBeInTheDocument();
    expect(screen.queryByText("받을 가능성이 높아요")).toBeNull();
  });

  it("AC-7[P0]: 면책 문구가 항상 보이고 <a href>가 0개다", () => {
    const { container, unmount } = renderResult(stateFor(inputA));
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument();
    expect(container.querySelectorAll("a[href]").length).toBe(0);
    unmount();
    const empty = renderResult();
    expect(empty.container.querySelectorAll("a[href]").length).toBe(0);
  });

  it("AC-8[P1]: 광고 env 없이도 모든 섹션이 렌더되고 리워드 광고 게이트가 없다", () => {
    renderResult(stateFor(inputA));
    expect(screen.getByText("예상 월 수령액")).toBeInTheDocument();
    expect(screen.getByText("신청 가능 시기")).toBeInTheDocument();
    expect(screen.getByText("소득 반영 내역")).toBeInTheDocument();
    expect(screen.getByText("재산 환산 내역 (월)")).toBeInTheDocument();
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 계산하기" })).toBeInTheDocument();
    expect(screen.queryByText(/광고를 보고/)).toBeNull();
  });
});
