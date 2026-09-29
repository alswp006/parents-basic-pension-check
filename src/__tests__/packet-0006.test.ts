import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { mockTds } from "@/__tests__/__helpers__/mocks";
import { formatCurrency } from "@/lib/utils";
import type { IncomeBreakdown, PropertyBreakdown } from "@/lib/types";
import BreakdownSection from "@/components/BreakdownSection";

mockTds();

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => ({
  ...(await vi.importActual("react-router-dom")),
  useNavigate: () => mockNavigate,
}));

vi.mock("@/state/AppStateContext", () => ({
  useAppState: () => ({ input: {}, setInput: vi.fn() }),
}));

// 입력 A 결과: 소득평가액 500,000 / 재산소득환산액 250,000
const income: IncomeBreakdown = { earnedReflected: 300000, other: 200000, total: 500000 };
const property: PropertyBreakdown = {
  general: 400000,
  financial: 100000,
  debt: -50000,
  basicDeduction: -450000,
  luxury: 250000,
  clamped: false,
  total: 250000,
};

const NOTICE = "공제액이 재산보다 커서 0원으로 계산했어요";

function renderSection(p: PropertyBreakdown = property) {
  return render(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(BreakdownSection, { income, property: p }),
    ),
  );
}

function rowOf(label: string): HTMLElement {
  const row = screen.getAllByRole("listitem").find((li) => li.textContent?.includes(label));
  if (!row) throw new Error(`row not found: ${label}`);
  return row;
}

describe("BreakdownSection: 소득·재산 환산 내역", () => {
  it("AC-1: 소득평가액·재산소득환산액 행에 formatCurrency 금액이 표시된다", () => {
    renderSection();
    expect(rowOf("소득평가액").textContent).toContain(formatCurrency(500000));
    expect(rowOf("재산소득환산액").textContent).toContain(formatCurrency(250000));
  });

  it("AC-2: 재산 섹션은 6개 행 라벨을 가지고 부채·기본재산 공제 앞에 '−'가 붙는다", () => {
    renderSection();
    for (const label of [
      "일반재산",
      "금융재산(2천만 원 공제 후)",
      "부채",
      "기본재산 공제",
      "고급자동차·회원권",
      "재산소득환산액",
    ]) {
      expect(rowOf(label)).toBeInTheDocument();
    }
    expect(rowOf("기본재산 공제").textContent).toContain(`−${formatCurrency(450000)}`);
    expect(rowOf("부채").textContent).toContain(`−${formatCurrency(50000)}`);
    expect(rowOf("일반재산").textContent).not.toContain("−");
  });

  it("AC-3: 소득 섹션 3개 + 재산 섹션 6개 = ListRow 정확히 9개", () => {
    renderSection();
    expect(screen.getAllByRole("listitem")).toHaveLength(9);
    expect(rowOf("근로소득 반영액").textContent).toContain(formatCurrency(300000));
    expect(rowOf("기타소득").textContent).toContain(formatCurrency(200000));
  });

  it("AC-4: clamped=true일 때만 안내 문구가 정확히 1회 렌더된다", () => {
    const { unmount } = renderSection({ ...property, clamped: true, total: 0 });
    expect(screen.getAllByText(NOTICE)).toHaveLength(1);
    expect(screen.getAllByRole("listitem")).toHaveLength(9);
    unmount();

    renderSection({ ...property, clamped: false });
    expect(screen.queryAllByText(NOTICE)).toHaveLength(0);
    expect(screen.queryByText(/0원으로 계산했어요/)).toBeNull();
  });

  it("AC-5: ListRow onClick 없음, HEX·rgb(·인라인 margin/padding 없음", () => {
    const { container } = renderSection({ ...property, clamped: true });
    expect(container.querySelectorAll("[role='button']")).toHaveLength(0);
    expect(container.querySelectorAll("button")).toHaveLength(0);
    const html = container.innerHTML;
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(html).not.toContain("rgb(");
    const styled = Array.from(container.querySelectorAll<HTMLElement>("[style]"));
    for (const el of styled) {
      expect(el.getAttribute("style") ?? "").not.toMatch(/margin|padding/i);
    }
    expect(styled.every((el) => !/margin|padding/i.test(el.style.cssText))).toBe(true);
  });
});
