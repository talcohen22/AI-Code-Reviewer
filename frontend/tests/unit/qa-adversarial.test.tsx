import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { renderApp } from "./helper/render-app"
import { CLEAN_CODE, SAMPLE_CODE, buildPastedReview } from "./helper/fixture"
import { parseGithubUrl } from "../../src/lib/helpers"
import * as seed from "../../src/mock/seed"
import { MAX_CODE_LENGTH, generateReview, runReview } from "../../src/mock/seed"

/**
 * QA adversarial pass. These do not re-run the implementing agent's happy paths —
 * every case here tries to break the delivered feature: look-alike hosts, boundary
 * lengths, whitespace-only input, rapid repeated interaction, a review that trips
 * no rule at all, and a filter that matches nothing.
 */

// Monaco cannot run in jsdom, so the editor surface stands in as a textarea.
vi.mock("../../src/components/code-editor", () => ({
  CodeEditor: ({ value, onChange }: { value: string; onChange: (next: string) => void }) => (
    <textarea aria-label="Code" value={value} onChange={event => onChange(event.target.value)} />
  ),
}))

vi.mock("sonner", async importOriginal => {
  const actual = await importOriginal<typeof import("sonner")>()
  return { ...actual, toast: { success: vi.fn(), error: vi.fn() } }
})

beforeEach(() => {
  vi.stubEnv("VITE_REVIEW_LATENCY_MS", "0")
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
  Reflect.deleteProperty(navigator, "clipboard")
})

describe("adversarial: GitHub link validation (AC2)", () => {
  it.each([
    ["a look-alike subdomain", "https://github.com.evil.example/acme/checkout/blob/main/a.ts"],
    ["github.com in the path of another host", "https://evil.example/github.com/a/b/blob/main/a.ts"],
    ["a host that merely ends in github.com", "https://notgithub.com/a/b/blob/main/a.ts"],
    ["a javascript: scheme", "javascript:alert(1)//github.com/a/b/blob/main/a.ts"],
    ["a trailing query string", "https://github.com/a/b/blob/main/a.ts?plain=1"],
    ["a trailing fragment", "https://github.com/a/b/blob/main/a.ts#L4"],
    ["a blob link with no branch", "https://github.com/a/b/blob/a.ts"],
    ["a raw.githubusercontent link", "https://raw.githubusercontent.com/a/b/main/a.ts"],
    ["an embedded newline", "https://github.com/a/b/blob/main/a.ts\nhttps://evil.example"],
    ["whitespace only", "     "],
  ])("rejects %s", (_label, url) => {
    expect(parseGithubUrl(url)).toBeNull()
  })

  it("keeps the editor untouched and stays put when an import is rejected", async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByLabelText("Code"))
    await user.paste(CLEAN_CODE)
    await user.type(
      screen.getByLabelText("GitHub file link"),
      "https://github.com.evil.example/acme/checkout/blob/main/a.ts",
    )
    await user.click(screen.getByRole("button", { name: "Import file" }))

    expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
      "That is not a GitHub file link.",
      expect.anything(),
    )
    // The previously pasted code must survive a rejected import.
    expect(screen.getByLabelText("Code")).toHaveValue(CLEAN_CODE)
    expect(screen.getByRole("heading", { name: "Review a snippet" })).toBeInTheDocument()
  })

  it("re-importing over existing code replaces it and retargets the language", async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByLabelText("Code"))
    await user.paste(CLEAN_CODE)

    const link = screen.getByLabelText("GitHub file link")
    await user.type(link, "https://github.com/acme/checkout/blob/main/scripts/deploy.py")
    await user.click(screen.getByRole("button", { name: "Import file" }))

    expect(screen.getByLabelText<HTMLTextAreaElement>("Code").value).not.toContain("export function add")
    expect(screen.getByTestId("submission-meta")).toHaveTextContent("python")
    expect(screen.getByTestId("submission-meta")).toHaveTextContent("scripts/deploy.py")
  })
})

describe("adversarial: submission guards (AC7)", () => {
  it("refuses a whitespace-only snippet with a toast and no navigation", async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByLabelText("Code"))
    await user.paste("   \n\n\t  \n")
    await user.click(screen.getByRole("button", { name: "Run review" }))

    expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
      "There is nothing to review yet.",
      expect.anything(),
    )
    expect(screen.getByRole("heading", { name: "Review a snippet" })).toBeInTheDocument()
  })

  it("accepts a snippet exactly at the size limit and rejects one character more", async () => {
    const atLimit = "a".repeat(MAX_CODE_LENGTH)
    await expect(
      runReview({ source: "paste", code: atLimit, file: "snippet.ts", language: "typescript" }),
    ).resolves.toMatchObject({ source: "paste" })

    await expect(
      runReview({
        source: "paste",
        code: atLimit + "a",
        file: "snippet.ts",
        language: "typescript",
      }),
    ).rejects.toThrow(/Trim it to/)
  })

  it("does not start a second review while the first is still in flight", async () => {
    // A real latency, so the extra clicks land squarely inside the in-flight window.
    vi.stubEnv("VITE_REVIEW_LATENCY_MS", "300")
    const runSpy = vi.spyOn(seed, "runReview")
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByLabelText("Code"))
    await user.paste(SAMPLE_CODE)
    await user.click(screen.getByRole("button", { name: "Run review" }))

    // The guard has to latch before the review resolves...
    const inFlight = screen.getByRole("button", { name: "Reviewing…" })
    expect(inFlight).toBeDisabled()

    // ...and hold even when the clicks are dispatched anyway, ignoring
    // `pointer-events: none`. A disabled attribute alone is only half the guard.
    const insistent = userEvent.setup({ pointerEventsCheck: 0, delay: null })
    await insistent.click(inFlight)
    await insistent.click(inFlight)
    expect(inFlight).toBeDisabled()
    expect(runSpy).toHaveBeenCalledTimes(1)

    await screen.findByRole("heading", { name: "Review results" })
    expect(runSpy).toHaveBeenCalledTimes(1)

    runSpy.mockRestore()
  })
})

describe("adversarial: results view with nothing to show (AC3, AC7)", () => {
  const cleanReview = generateReview(
    { source: "paste", code: CLEAN_CODE, file: "add.ts", language: "typescript" },
    new Date("2026-08-24T12:00:00.000Z"),
  )

  it("renders a deliberate empty state in every category when no rule is tripped", () => {
    expect(cleanReview.finding).toHaveLength(0)
    renderApp({ route: `/review/${cleanReview.id}`, initialReview: [cleanReview] })

    for (const key of ["style", "bug", "security", "refactor"]) {
      const group = within(screen.getByTestId(`category-${key}`))
      // A blank panel would fail this: each category must say something.
      expect(group.getByText(/^No .+/)).toBeInTheDocument()
    }
    expect(screen.getByTestId("finding-count")).toHaveTextContent("Showing 0 of 0 findings")
  })

  it("still generates a test for the reviewed function even with zero findings (AC5)", () => {
    renderApp({ route: `/review/${cleanReview.id}`, initialReview: [cleanReview] })

    const tests = within(screen.getByTestId("category-generated-test"))
    expect(tests.getAllByTestId("generated-test")).toHaveLength(1)
    expect(tests.getByText(/describe\("add"/)).toBeInTheDocument()
  })

  it("falls back to an empty state for a review id that is not in the session", () => {
    renderApp({ route: "/review/rv-does-not-exist-000", initialReview: [cleanReview] })

    expect(screen.getByText("That review is not in this session")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Start a review" })).toBeInTheDocument()
  })
})

describe("adversarial: severity filter (AC4)", () => {
  const review = buildPastedReview()

  function renderResult() {
    return renderApp({ route: `/review/${review.id}`, initialReview: [review] })
  }

  it("survives rapid repeated filter switching and lands on a consistent count", async () => {
    const user = userEvent.setup()
    renderResult()

    const criticalCount = review.finding.filter(entry => entry.severity === "critical").length

    for (const label of ["Critical", "Warning", "Info", "Critical", "All", "Critical"]) {
      await user.click(screen.getByRole("button", { name: label }))
    }

    expect(screen.getByTestId("finding-count")).toHaveTextContent(
      `Showing ${criticalCount} of ${review.finding.length} findings`,
    )
    expect(screen.getAllByTestId("finding-severity").every(node => node.textContent === "Critical")).toBe(
      true,
    )
  })

  it("tells the user why a category is empty at a severity rather than going blank", async () => {
    const user = userEvent.setup()
    renderResult()

    await user.click(screen.getByRole("button", { name: "Critical" }))

    // Style has no critical findings in this fixture.
    const style = within(screen.getByTestId("category-style"))
    expect(style.getByText(/at this severity/)).toBeInTheDocument()
  })

  it("keeps generated tests visible regardless of the severity filter (AC5)", async () => {
    const user = userEvent.setup()
    renderResult()

    const before = within(screen.getByTestId("category-generated-test")).getAllByTestId(
      "generated-test",
    ).length

    await user.click(screen.getByRole("button", { name: "Critical" }))

    expect(
      within(screen.getByTestId("category-generated-test")).getAllByTestId("generated-test"),
    ).toHaveLength(before)
  })
})

describe("adversarial: copy to clipboard (AC5)", () => {
  const review = buildPastedReview()

  it("copies the snippet verbatim, byte for byte, on repeated clicks", async () => {
    const user = userEvent.setup()
    const writeText = vi.fn<(value: string) => Promise<void>>().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
      writable: true,
    })

    renderApp({ route: `/review/${review.id}`, initialReview: [review] })

    const card = within(screen.getByTestId("category-generated-test")).getAllByTestId(
      "generated-test",
    )[0]
    const copy = within(card!).getByRole("button", { name: /^Copy the / })

    await user.click(copy)
    await user.click(copy)

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledTimes(2)
    })
    expect(writeText.mock.calls[0]?.[0]).toBe(review.generatedTest[0]?.code)
    expect(writeText.mock.calls[1]?.[0]).toBe(review.generatedTest[0]?.code)
  })
})

describe("adversarial: dashboard ordering (AC6)", () => {
  it("orders newest-first even when the seeded history arrives out of order", () => {
    const older = generateReview(
      { source: "paste", code: SAMPLE_CODE, file: "older.ts", language: "typescript" },
      new Date("2026-08-20T09:00:00.000Z"),
    )
    const newer = generateReview(
      { source: "github", code: SAMPLE_CODE, file: "newer.ts", language: "typescript" },
      new Date("2026-08-24T09:00:00.000Z"),
    )

    // Deliberately oldest-first: the view must not trust the array order.
    renderApp({ route: "/dashboard", initialReview: [older, newer] })

    const row = screen.getAllByTestId("review-row")
    expect(within(row[0]!).getByText("newer.ts")).toBeInTheDocument()
    expect(within(row[1]!).getByText("older.ts")).toBeInTheDocument()
  })
})
