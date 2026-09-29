import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { execSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { mockTds, mockAppsInToss } from "@/__tests__/__helpers__/mocks";
import App from "@/App";

mockTds();
mockAppsInToss();

vi.mock("@/components/AdSlot", () => ({
  AdSlot: () => React.createElement("div", { "data-testid": "ad-slot" }),
  default: () => React.createElement("div", { "data-testid": "ad-slot" }),
}));

const ROOT = process.cwd();
const RESULT_VERDICT = /받을 가능성이 높아요|기준선 근처예요|받기 어려워 보여요/;

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-09-30T09:00:00+09:00"));
  Element.prototype.scrollIntoView = vi.fn();
  vi.stubEnv("VITE_TOSS_AD_GROUP_ID", "");
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  errorSpy.mockRestore();
});

function renderAt(path: string) {
  return render(
    React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(App)),
  );
}

const submitBtn = () => screen.getByRole("button", { name: "진단하기" }) as HTMLButtonElement;

function fillAndSubmit() {
  fireEvent.change(screen.getByPlaceholderText("예: 19611110"), { target: { value: "19611110" } });
  fireEvent.click(screen.getByRole("button", { name: "없음" }));
  fireEvent.click(screen.getByRole("button", { name: "대도시" }));
  fireEvent.click(submitBtn());
}

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === "__tests__" ? [] : listSourceFiles(p);
    return /\.(tsx?|css|html)$/.test(name) && !/\.test\./.test(name) ? [p] : [];
  });
}

describe("Routing & Integration", () => {
  it("AC-1[P0]: '/'는 Home, '/result'는 Result(자리 페이지 아님)를 렌더한다", () => {
    const home = renderAt("/");
    expect(submitBtn().disabled).toBe(true);
    expect(screen.queryByTestId("placeholder-result")).toBeNull();
    home.unmount();

    renderAt("/result");
    expect(screen.queryByTestId("placeholder-result")).toBeNull();
    expect(screen.queryByRole("button", { name: "진단하기" })).toBeNull();
    // route state도 lastInput도 없으면 Empty State
    expect(screen.getByText("아직 진단 결과가 없어요")).toBeTruthy();
    expect(screen.getByRole("button", { name: "진단하러 가기" })).toBeTruthy();
  });

  it("AC-1[P0]: 정의되지 않은 경로는 '/'로 redirect되어 Home이 보이고 Result 내용은 없다", () => {
    renderAt("/unknown/deep/path");
    expect(submitBtn().disabled).toBe(true);
    expect(screen.getByPlaceholderText("예: 19611110")).toBeTruthy();
    expect(screen.queryByText("아직 진단 결과가 없어요")).toBeNull();
    expect(screen.queryByTestId("placeholder-result")).toBeNull();
  });

  it("AC-2[P0]: src에 외부 링크·window.open·로깅 SDK·location.href 대입이 0건이다", () => {
    const pattern = /href="http|window\.open|gtag|amplitude|location\.href *=/;
    const hits = listSourceFiles(join(ROOT, "src")).filter((f) => pattern.test(readFileSync(f, "utf8")));
    expect(hits).toEqual([]);
    expect(listSourceFiles(join(ROOT, "src")).length).toBeGreaterThan(10);
  });

  it("AC-3[P0]: 입력 A → 결과 → 다시 계산 흐름에서 console.error가 0건이고 Home으로 돌아온다", () => {
    renderAt("/");
    fillAndSubmit();

    expect(screen.getByText(RESULT_VERDICT)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "진단하기" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "다시 계산하기" }));
    // SPEC: Home은 loadLastInput()으로 폼을 미리 채운다 → 방금 입력이 남아 있고 바로 다시 제출할 수 있다
    expect((screen.getByPlaceholderText("예: 19611110") as HTMLInputElement).value).not.toBe("");
    expect(submitBtn().disabled).toBe(false);
    expect(screen.queryByText(RESULT_VERDICT)).toBeNull();
    expect(errorSpy).toHaveBeenCalledTimes(0);
  });

  it("AC-4[P0]: 광고 env가 비어도 흐름을 끝까지 수행하고 광고 오류 문구·광고 슬롯이 0건이다", () => {
    renderAt("/");
    expect(screen.queryByTestId("ad-slot")).toBeNull();
    fillAndSubmit();
    expect(screen.getByText(RESULT_VERDICT)).toBeTruthy();
    expect(screen.queryByText(/광고.*(오류|실패|불러올 수 없)/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "다시 계산하기" }));
    expect(screen.getByPlaceholderText("예: 19611110")).toBeTruthy();
    expect(screen.queryByText(/광고.*(오류|실패|불러올 수 없)/)).toBeNull();
    expect(errorSpy).toHaveBeenCalledTimes(0);
  });

  it("AC-4[P0]: VITE_TOSS_AD_GROUP_ID를 비운 채 vite build가 성공하고 결과물이 생긴다", () => {
    const outDir = mkdtempSync(join(tmpdir(), "bpc-build-"));
    const out = execSync(`npx vite build --outDir ${outDir} --emptyOutDir`, {
      cwd: ROOT,
      env: { ...process.env, VITE_TOSS_AD_GROUP_ID: "" },
      encoding: "utf8",
      stdio: "pipe",
    });
    expect(out).toMatch(/built in/);
    expect(existsSync(join(outDir, "index.html"))).toBe(true);
  }, 240_000);

  it("AC-5[P0]: main.tsx와 components/AdSlot*는 HEAD 대비 diff가 0줄이다", () => {
    const diff = execSync("git diff HEAD --numstat -- src/main.tsx 'src/components/AdSlot*'", {
      cwd: ROOT,
      encoding: "utf8",
    });
    expect(diff.trim()).toBe("");
    expect(existsSync(join(ROOT, "src/main.tsx"))).toBe(true);
    expect(existsSync(join(ROOT, "src/components/AdSlot.tsx"))).toBe(true);
  });

  it("AC-6[P1]: App.tsx는 Home/Result/redirect 라우트를 갖고 navigate 대상이 모두 Route에 있다", () => {
    const app = readFileSync(join(ROOT, "src/App.tsx"), "utf8");
    expect(app).toMatch(/path="\/"[^>]*element=\{<Home \/>\}/);
    expect(app).toMatch(/path="\/result"[^>]*element=\{<Result \/>\}/);
    expect(app).toMatch(/path="\*"[^>]*<Navigate to="\/" replace \/>/);

    const routes = new Set([...app.matchAll(/path="([^"]+)"/g)].map((m) => m[1]));
    const targets = listSourceFiles(join(ROOT, "src/pages"))
      .flatMap((f) => [...readFileSync(f, "utf8").matchAll(/navigate\(\s*['"](\/[^'"]*)['"]/g)].map((m) => m[1]));
    expect(targets.length).toBeGreaterThan(0);
    for (const t of targets) expect(routes.has(t)).toBe(true);
  });
});
