import { expect, test } from "@playwright/test"

import { SAMPLE_CODE, VALID_GITHUB_LINK, pasteCode, runReview } from "./helper/app"

test("shows an empty state before any review has run (AC6, AC7)", async ({ page }) => {
  await page.goto("/dashboard")

  await expect(page.getByRole("heading", { name: "Quality dashboard" })).toBeVisible()
  await expect(page.getByText("No reviews yet")).toBeVisible()
  await expect(page.getByTestId("review-row")).toHaveCount(0)
})

test("lists this session's reviews newest first with source, time and counts (AC6)", async ({
  page,
}) => {
  await page.goto("/")
  await pasteCode(page, SAMPLE_CODE)
  await runReview(page)

  await page.getByRole("link", { name: "New review", exact: true }).click()
  await page.getByLabel("GitHub file link").fill(VALID_GITHUB_LINK)
  await page.getByRole("button", { name: "Import file" }).click()
  await runReview(page)

  await page.getByRole("link", { name: "Dashboard", exact: true }).click()

  const row = page.getByTestId("review-row")
  await expect(row).toHaveCount(2)

  // Newest first: the GitHub import ran second.
  await expect(row.nth(0)).toContainText("GitHub file")
  await expect(row.nth(0)).toContainText("src/session.ts")
  await expect(row.nth(0)).toContainText("just now")
  await expect(row.nth(0).getByTestId("review-row-count")).toContainText("Style")
  await expect(row.nth(0).getByTestId("review-row-count")).toContainText("Generated Tests")

  await expect(row.nth(1)).toContainText("Pasted snippet")
  await expect(row.nth(1)).toContainText("snippet.ts")

  await row.nth(1).click()

  await expect(page.getByRole("heading", { name: "Review results" })).toBeVisible()
  await expect(page.getByText("Pasted snippet")).toBeVisible()
})
