import { test } from "@playwright/test";
test("repro", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "대도시" }).click();
  await page.getByRole("button", { name: "있음" }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: "/tmp/repro/a.png" });
  console.log(await page.locator("button", { hasText: "있음" }).evaluate(e => e.outerHTML));
  console.log(await page.locator("button", { hasText: "대도시" }).evaluate(e => e.outerHTML));
});
