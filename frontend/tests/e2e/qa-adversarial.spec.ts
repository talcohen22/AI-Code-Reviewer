import { expect, test } from "@playwright/test"

import { pasteCode, runReview } from "./helper/app"

/**
 * QA adversarial e2e pass at the narrowest supported viewport (AC8). The
 * implementing agent's responsive spec uses a well-behaved sample; these cases
 * feed the layout the content most likely to burst it — a very long unbroken
 * file path, a very long unbroken code line, and a long identifier that flows
 * into every generated test — and still demand no horizontal scroll.
 */

const MOBILE_VIEWPORT = { width: 375, height: 812 }

test.use({ viewport: MOBILE_VIEWPORT })

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

/**
 * REGRESSION — currently FAILING, and reported in .orchestrate/qa-report.md.
 *
 * A long unbroken function name lands verbatim in the generated-test card header
 * (src/components/generated-test-card.tsx:45). That Typography has no
 * word-breaking and its wrapping Stack has no `minWidth: 0`, so the name forces
 * the whole document wider than the viewport: 534px against a 375px client.
 * The sibling surfaces that render the same kind of token — review-result-view
 * .tsx:81 and quality-dashboard-view.tsx:119 — both set `wordBreak: "break-all"`
 * and do not overflow. This test goes green once the card matches them.
 */
test("a long function name does not burst the 375px layout (AC8)", async ({ page }) => {
  await page.goto("/")

  await pasteCode(
    page,
    [
      `export function calculateQuarterlyRevenueProjectionForEnterpriseAccount(input) {`,
      `  return input`,
      `}`,
    ].join("\n"),
  )
  await expectNoHorizontalScroll(page)

  await runReview(page)
  await expect(page.getByTestId("generated-test")).toHaveCount(1)
  await expectNoHorizontalScroll(page)

  await page.getByRole("link", { name: "Dashboard", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Quality dashboard" })).toBeVisible()
  await expect(page.getByTestId("review-row")).toHaveCount(1)
  await expectNoHorizontalScroll(page)
})

test("a very long single code line stays inside its own scroll box (AC8)", async ({ page }) => {
  await page.goto("/")

  const longLine = [
    `export function overflowProbe(input) {`,
    `  const value = "${"x".repeat(400)}"`,
    `  return value + input`,
    `}`,
  ].join("\n")

  await pasteCode(page, longLine)
  await runReview(page)

  await expect(page.getByTestId("generated-test").first()).toBeVisible()
  await expectNoHorizontalScroll(page)

  // Filtering must not reflow the page into an overflow either.
  await page.getByRole("button", { name: "Info", exact: true }).click()
  await expectNoHorizontalScroll(page)
})

test("the results view of a review with no findings is not a blank screen (AC3, AC7)", async ({
  page,
}) => {
  await page.goto("/")

  await pasteCode(page, ["export function add(left, right) {", "  return left + right", "}"].join("\n"))
  await runReview(page)

  await expect(page.getByTestId("finding-count")).toHaveText("Showing 0 of 0 findings")
  for (const key of ["style", "bug", "security", "refactor"]) {
    await expect(page.getByTestId(`category-${key}`).getByText(/^No /)).toBeVisible()
  }
  // A finding-free review still has to produce its generated test.
  await expect(page.getByTestId("generated-test")).toHaveCount(1)
  await expectNoHorizontalScroll(page)
})

test("an unknown review URL shows an empty state instead of crashing (AC7)", async ({ page }) => {
  await page.goto("/review/rv-not-a-real-review-000")

  await expect(page.getByText("That review is not in this session")).toBeVisible()
  await expect(page.getByRole("link", { name: "Start a review" })).toBeVisible()
  await expectNoHorizontalScroll(page)
})
