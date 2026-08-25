import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { afterEach, describe, expect, it, vi } from "vitest"

import { renderApp } from "./helper/render-app"
import { buildPastedReview } from "./helper/fixture"
import { generateReview } from "../../src/mock/seed"

vi.mock("sonner", async importOriginal => {
  const actual = await importOriginal<typeof import("sonner")>()
  return { ...actual, toast: { success: vi.fn(), error: vi.fn() } }
})

const review = buildPastedReview()

function renderResult() {
  return renderApp({ route: `/review/${review.id}`, initialReview: [review] })
}

/**
 * `userEvent.setup()` installs its own `navigator.clipboard` stub, so the spy
 * has to replace it afterwards to be the one the copy button actually calls.
 */
function stubClipboard(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
    writable: true,
  })
  return writeText
}

afterEach(() => {
  Reflect.deleteProperty(navigator, "clipboard")
})

describe("review result view", () => {
  it("groups findings into all five categories (AC3)", () => {
    renderResult()

    // Each group heading carries its count, e.g. "Security 2".
    for (const label of ["Style", "Bugs", "Security", "Refactor Suggestions", "Generated Tests"]) {
      expect(screen.getByRole("heading", { name: new RegExp(`^${label} \\d+$`) })).toBeInTheDocument()
    }
  })

  it("shows severity, a file/line reference and a description on each finding (AC3)", () => {
    renderResult()

    const security = within(screen.getByTestId("category-security"))
    expect(security.getAllByTestId("finding-severity")[0]).toHaveTextContent("Critical")
    expect(security.getByText("snippet.ts:9")).toBeInTheDocument()
    expect(security.getByText("`eval` executes arbitrary code")).toBeInTheDocument()
    expect(
      security.getByText(/attacker-controlled substring reaching `eval`/),
    ).toBeInTheDocument()
  })

  it("narrows findings and the visible count when a severity is picked (AC4)", async () => {
    const user = userEvent.setup()
    renderResult()

    expect(screen.getByTestId("finding-count")).toHaveTextContent(
      `Showing ${review.finding.length} of ${review.finding.length} findings`,
    )

    await user.click(screen.getByRole("button", { name: "Critical" }))

    expect(screen.getByTestId("finding-count")).toHaveTextContent(
      `Showing ${review.summary.critical} of ${review.finding.length} findings`,
    )
    expect(screen.getAllByTestId("finding")).toHaveLength(review.summary.critical)
    for (const chip of screen.getAllByTestId("finding-severity")) {
      expect(chip).toHaveTextContent("Critical")
    }
  })

  it("restores the full list when the filter is cleared (AC4)", async () => {
    const user = userEvent.setup()
    renderResult()

    await user.click(screen.getByRole("button", { name: "Info" }))
    expect(screen.getAllByTestId("finding")).toHaveLength(review.summary.info)

    await user.click(screen.getByRole("button", { name: "All" }))

    expect(screen.getAllByTestId("finding")).toHaveLength(review.finding.length)
    expect(screen.getByTestId("finding-count")).toHaveTextContent(
      `Showing ${review.finding.length} of ${review.finding.length} findings`,
    )
  })

  it("shows a generated test per reviewed function and copies it (AC5)", async () => {
    const user = userEvent.setup()
    const writeText = stubClipboard(vi.fn().mockResolvedValue(undefined))
    renderResult()

    const tests = within(screen.getByTestId("category-generated-test"))
    expect(tests.getAllByTestId("generated-test")).toHaveLength(review.generatedTest.length)

    await user.click(tests.getByRole("button", { name: "Copy the loadUser test" }))

    expect(writeText).toHaveBeenCalledWith(review.generatedTest[0]?.code)
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith("Copied the loadUser test")
    expect(await tests.findByRole("button", { name: "Copy the loadUser test" })).toHaveTextContent(
      "Copied",
    )
  })

  it("reports a failed copy instead of failing silently (AC7)", async () => {
    const user = userEvent.setup()
    stubClipboard(vi.fn().mockRejectedValue(new Error("denied")))
    renderResult()

    const tests = within(screen.getByTestId("category-generated-test"))
    await user.click(tests.getByRole("button", { name: "Copy the loadUser test" }))

    expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
      "Could not copy to the clipboard.",
      expect.anything(),
    )
  })

  it("renders an empty state for a category with no findings (AC7)", () => {
    const clean = generateReview(
      {
        source: "paste",
        code: "export function add(a: number, b: number) {\n  return a + b\n}\n",
        file: "add.ts",
        language: "typescript",
      },
      new Date("2026-08-24T12:00:00.000Z"),
    )
    renderApp({ route: `/review/${clean.id}`, initialReview: [clean] })

    expect(screen.getByText("No security findings for this submission.")).toBeInTheDocument()
    expect(screen.queryAllByTestId("finding")).toHaveLength(0)
  })

  it("falls back to an empty state for a review that is not in the session (AC7)", () => {
    renderApp({ route: "/review/rv-does-not-exist" })

    expect(screen.getByText("That review is not in this session")).toBeInTheDocument()
  })
})
