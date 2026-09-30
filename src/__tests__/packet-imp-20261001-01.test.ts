import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { fireEvent, screen } from "@testing-library/react";
import {
  mockAll,
  mockShareApp,
  mockLogClick,
  mockNavigate,
  mockLocation,
} from "@/__tests__/__helpers__/mocks";
import { renderWithRouter } from "@/__tests__/__helpers__/test-utils";
import { runDiagnosis } from "@/lib/validation";
import type { AppInput } from "@/lib/types";
import Result from "@/pages/Result";

mockAll();

const TODAY = new Date("2026-10-01T09:00:00+09:00");

const INPUT: AppInput = {
  birthDate: "1955-03-10",
  hasSpouse: false,
  spouseEligible: false,
  region: "metro",
  monthlyEarnedIncome: 0,
  monthlyOtherIncome: 500000,
  generalProperty: 100000000,
  financialProperty: 20000000,
  debt: 0,
  luxuryAssets: 0,
};

function renderResult() {
  const result = runDiagnosis(INPUT, TODAY);
  // mockRouter가 useLocation을 mockLocation으로 대체할 수 있어 양쪽에 같은 state를 둔다.
  mockLocation.state = { input: INPUT, result } as never;
  return renderWithRouter(React.createElement(Result), {
    initialEntries: [{ pathname: "/result", state: { input: INPUT, result } }],
  });
}

describe("[개선] 행동 로그·리뷰·공유 1가지 추가", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(TODAY);
    mockShareApp.mockClear();
    mockLogClick.mockClear();
    mockNavigate.mockClear();
    mockLocation.state = null;
  });

  it("AC-1[P0]: 결과 화면에 공유 버튼이 정확히 1개 있다", () => {
    renderResult();
    const buttons = screen.getAllByRole("button", { name: /공유/ });
    expect(buttons).toHaveLength(1);
    expect(buttons[0].tagName).toBe("BUTTON");
  });

  it("AC-1[P0]: 공유 버튼을 누르면 shareApp이 /result 경로와 문자열 message로 1번 호출된다", () => {
    renderResult();
    fireEvent.click(screen.getByRole("button", { name: /공유/ }));
    expect(mockShareApp).toHaveBeenCalledTimes(1);
    const arg = (mockShareApp.mock.calls as unknown as Array<[{ message: string; path?: string }]>)[0][0];
    expect(typeof arg.message).toBe("string");
    expect(arg.message.length).toBeGreaterThan(0);
    expect(arg.path).toBe("/result");
  });

  it("AC-1[P0]: 결과가 없는 빈 상태에서는 공유 버튼이 없고 shareApp도 호출되지 않는다", () => {
    renderWithRouter(React.createElement(Result), { initialEntries: ["/result"] });
    expect(screen.queryByRole("button", { name: /공유/ })).toBeNull();
    expect(mockShareApp).not.toHaveBeenCalled();
  });

  it("AC-2[P0]: 공유 버튼을 누르면 logClick('share_tap')이 함께 호출된다", () => {
    renderResult();
    fireEvent.click(screen.getByRole("button", { name: /공유/ }));
    expect(mockLogClick).toHaveBeenCalledWith("share_tap");
    expect(mockLogClick.mock.calls.filter(([n]) => n === "share_tap")).toHaveLength(1);
  });

  it("AC-2[P0]: 화면을 그리기만 하면 share_tap 로그도 shareApp도 나가지 않는다", () => {
    renderResult();
    expect(mockLogClick).not.toHaveBeenCalledWith("share_tap");
    expect(mockShareApp).not.toHaveBeenCalled();
  });
});
