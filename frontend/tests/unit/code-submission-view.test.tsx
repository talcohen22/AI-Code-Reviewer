import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { renderApp } from "./helper/render-app"
import { SAMPLE_CODE } from "./helper/fixture"

// Monaco cannot run in jsdom, so the editor surface stands in as a textarea.
// The editor itself is covered end to end by the Playwright suite.
vi.mock("../../src/components/code-editor", () => ({
  CodeEditor: ({ value, onChange }: { value: string; onChange: (next: string) => void }) => (
    <textarea aria-label="Code" value={value} onChange={event => onChange(event.target.value)} />
  ),
}))

vi.mock("sonner", async importOriginal => {
  const actual = await importOriginal<typeof import("sonner")>()
  return { ...actual, toast: { success: vi.fn(), error: vi.fn() } }
})

const VALID_LINK = "https://github.com/acme/checkout/blob/main/src/session.ts"

beforeEach(() => {
  vi.stubEnv("VITE_REVIEW_LATENCY_MS", "0")
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("code submission view", () => {
  it("reviews a pasted snippet and lands on its results (AC1)", async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByLabelText("Code"))
    await user.paste(SAMPLE_CODE)
    await user.click(screen.getByRole("button", { name: "Run review" }))

    expect(await screen.findByRole("heading", { name: "Review results" })).toBeInTheDocument()
    expect(screen.getByText("Pasted snippet")).toBeInTheDocument()
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith(expect.stringContaining("Review ready"))
  })

  it("refuses to review an empty editor and surfaces a toast (AC7)", async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole("button", { name: "Run review" }))

    expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
      "There is nothing to review yet.",
      expect.objectContaining({ description: expect.stringContaining("Paste some code") }),
    )
    expect(screen.getByRole("heading", { name: "Review a snippet" })).toBeInTheDocument()
  })

  it("populates the editor from a valid GitHub file link (AC2)", async () => {
    const user = userEvent.setup()
    renderApp()

    await user.type(screen.getByLabelText("GitHub file link"), VALID_LINK)
    await user.click(screen.getByRole("button", { name: "Import file" }))

    const editor = screen.getByLabelText<HTMLTextAreaElement>("Code")
    expect(editor.value).toContain("github.com/acme/checkout")
    expect(editor.value).toContain("export function session(")
    expect(screen.getByTestId("submission-meta")).toHaveTextContent("src/session.ts")
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
      "Imported src/session.ts",
      expect.anything(),
    )
  })

  it("rejects an invalid GitHub link with a toast and no navigation (AC2, AC7)", async () => {
    const user = userEvent.setup()
    renderApp()

    await user.type(screen.getByLabelText("GitHub file link"), "https://example.com/some/file.ts")
    await user.click(screen.getByRole("button", { name: "Import file" }))

    expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
      "That is not a GitHub file link.",
      expect.objectContaining({ description: expect.stringContaining("blob") }),
    )
    expect(screen.getByLabelText("Code")).toHaveValue("")
    expect(screen.getByRole("heading", { name: "Review a snippet" })).toBeInTheDocument()
  })

  it("reports a rejected review instead of failing silently (AC7)", async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByLabelText("Code"))
    await user.paste("x".repeat(20_001))
    await user.click(screen.getByRole("button", { name: "Run review" }))

    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        "The review could not be completed.",
        expect.objectContaining({ description: expect.stringContaining("Trim it to") }),
      )
    })
    expect(screen.getByRole("heading", { name: "Review a snippet" })).toBeInTheDocument()
  })

  it("adds each completed review to the session history (AC6)", async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByLabelText("Code"))
    await user.paste(SAMPLE_CODE)
    await user.click(screen.getByRole("button", { name: "Run review" }))
    await screen.findByRole("heading", { name: "Review results" })

    await user.click(screen.getByRole("link", { name: "Dashboard" }))

    expect(await screen.findByRole("heading", { name: "Quality dashboard" })).toBeInTheDocument()
    expect(screen.getAllByTestId("review-row")).toHaveLength(1)
  })
})
