import { expect, type Page } from "@playwright/test"

/**
 * The same shape of snippet the unit fixture uses: it trips at least one rule in
 * every category and declares two functions, so one submission exercises the
 * whole results view.
 */
export const SAMPLE_CODE = [
  `var cache = {}`,
  ``,
  `export function loadUser(id) {`,
  `  console.log("loading", id)`,
  `  if (id == null) {`,
  `    return null`,
  `  }`,
  `  const apiKey = "live_abc123456"`,
  `  return eval("cache[" + id + "]")`,
  `}`,
  ``,
  `export function saveUser(raw) {`,
  `  try {`,
  `    return JSON.parse(raw)`,
  `  } catch (error) {}`,
  `}`,
].join("\n")

export const VALID_GITHUB_LINK = "https://github.com/acme/checkout/blob/main/src/session.ts"

/** Type a snippet into Monaco and wait until the app's model has caught up. */
export async function pasteCode(page: Page, code: string) {
  const editor = page.locator(".monaco-editor").first()
  await editor.waitFor({ state: "visible" })

  // Monaco takes input through an EditContext-backed div rather than a
  // textarea, so focus it the way a user does — by clicking the rendered lines.
  await page.locator(".monaco-editor .view-lines").first().click()
  await page.keyboard.insertText(code)

  await expect(page.getByTestId("submission-meta")).toContainText(
    `${code.split("\n").length} lines`,
  )
}

/** Submit whatever is in the editor and wait for the results view. */
export async function runReview(page: Page) {
  await page.getByRole("button", { name: "Run review" }).click()
  await expect(page.getByRole("heading", { name: "Review results" })).toBeVisible()
}
