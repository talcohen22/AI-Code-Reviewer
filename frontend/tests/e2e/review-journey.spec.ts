import { expect, test } from "@playwright/test"

import { SAMPLE_CODE, VALID_GITHUB_LINK, pasteCode, runReview } from "./helper/app"

test.beforeEach(async ({ page }) => {
  await page.goto("/")
})

test("reviews a pasted snippet and groups the findings by category (AC1, AC3)", async ({
  page,
}) => {
  await pasteCode(page, SAMPLE_CODE)
  await runReview(page)

  await expect(page).toHaveURL(/\/review\/rv-/)
  for (const label of ["Style", "Bugs", "Security", "Refactor Suggestions", "Generated Tests"]) {
    await expect(page.getByRole("heading", { name: label })).toBeVisible()
  }

  const security = page.getByTestId("category-security")
  await expect(security.getByText("`eval` executes arbitrary code")).toBeVisible()
  await expect(security.getByText("snippet.ts:9")).toBeVisible()
  await expect(security.getByTestId("finding-severity").first()).toHaveText("Critical")
})

test("imports a GitHub file into the editor before reviewing it (AC2)", async ({ page }) => {
  await page.getByLabel("GitHub file link").fill(VALID_GITHUB_LINK)
  await page.getByRole("button", { name: "Import file" }).click()

  await expect(page.getByText("Imported src/session.ts")).toBeVisible()
  await expect(page.getByTestId("submission-meta")).toContainText("src/session.ts")
  await expect(page.locator(".monaco-editor").first()).toContainText("acme/checkout")

  await runReview(page)
  await expect(page.getByText("GitHub file")).toBeVisible()
  await expect(page.getByText("src/session.ts").first()).toBeVisible()
})

test("rejects an invalid GitHub link with a toast and stays put (AC2, AC7)", async ({ page }) => {
  await page.getByLabel("GitHub file link").fill("https://example.com/acme/checkout/file.ts")
  await page.getByRole("button", { name: "Import file" }).click()

  await expect(page.getByText("That is not a GitHub file link.")).toBeVisible()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole("heading", { name: "Review a snippet" })).toBeVisible()
  await expect(page.getByTestId("submission-meta")).toContainText("0 lines")
})

test("refuses to review an empty editor with a toast (AC7)", async ({ page }) => {
  await page.locator(".monaco-editor").first().waitFor({ state: "visible" })
  await page.getByRole("button", { name: "Run review" }).click()

  await expect(page.getByText("There is nothing to review yet.")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Review a snippet" })).toBeVisible()
})

test("filters findings by severity and restores the full list (AC4)", async ({ page }) => {
  await pasteCode(page, SAMPLE_CODE)
  await runReview(page)

  const count = page.getByTestId("finding-count")
  const total = await page.getByTestId("finding").count()
  await expect(count).toHaveText(`Showing ${total} of ${total} findings`)

  await page.getByRole("button", { name: "Critical", exact: true }).click()

  const criticalCount = await page.getByTestId("finding").count()
  expect(criticalCount).toBeGreaterThan(0)
  expect(criticalCount).toBeLessThan(total)
  await expect(count).toHaveText(`Showing ${criticalCount} of ${total} findings`)
  for (const chip of await page.getByTestId("finding-severity").all()) {
    await expect(chip).toHaveText("Critical")
  }

  await page.getByRole("button", { name: "All", exact: true }).click()

  await expect(page.getByTestId("finding")).toHaveCount(total)
  await expect(count).toHaveText(`Showing ${total} of ${total} findings`)
})

test("shows a generated test per function with a working copy button (AC5)", async ({ page }) => {
  await pasteCode(page, SAMPLE_CODE)
  await runReview(page)

  const tests = page.getByTestId("category-generated-test")
  await expect(tests.getByTestId("generated-test")).toHaveCount(2)
  await expect(tests.getByText(`describe("loadUser"`)).toBeVisible()

  await tests.getByRole("button", { name: "Copy the loadUser test" }).click()

  await expect(page.getByText("Copied the loadUser test")).toBeVisible()
  await expect(tests.getByRole("button", { name: "Copy the loadUser test" })).toHaveText("Copied")

  const clipboard = await page.evaluate(() => navigator.clipboard.readText())
  expect(clipboard).toContain(`describe("loadUser"`)
})
