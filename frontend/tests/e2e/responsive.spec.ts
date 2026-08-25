import { expect, test } from "@playwright/test"

import { SAMPLE_CODE, pasteCode, runReview } from "./helper/app"

const MOBILE_VIEWPORT = { width: 375, height: 812 }

test.use({ viewport: MOBILE_VIEWPORT })

/** Nothing may push the document wider than the viewport (AC8). */
async function expectNoHorizontalScroll(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement
    return {
      scrollWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
      clientWidth: root.clientWidth,
    }
  })

  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1)
}

test("all three views stay usable at a 375px viewport (AC8)", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Review a snippet" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Run review" })).toBeVisible()
  await expectNoHorizontalScroll(page)

  await pasteCode(page, SAMPLE_CODE)
  await runReview(page)
  await expect(page.getByRole("heading", { name: "Security" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Critical", exact: true })).toBeVisible()
  await expectNoHorizontalScroll(page)

  await page.getByRole("link", { name: "Dashboard", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Quality dashboard" })).toBeVisible()
  await expect(page.getByTestId("review-row")).toHaveCount(1)
  await expectNoHorizontalScroll(page)
})

test("the dashboard empty state fits a 375px viewport (AC7, AC8)", async ({ page }) => {
  await page.goto("/dashboard")

  await expect(page.getByText("No reviews yet")).toBeVisible()
  await expectNoHorizontalScroll(page)
})
