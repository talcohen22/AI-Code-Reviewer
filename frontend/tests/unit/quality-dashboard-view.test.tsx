import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { renderApp } from "./helper/render-app"
import { buildGithubReview, buildPastedReview } from "./helper/fixture"

const older = buildPastedReview(new Date("2026-08-24T09:00:00.000Z"))
const newer = buildGithubReview(new Date("2026-08-24T11:30:00.000Z"))

describe("quality dashboard view", () => {
  it("renders an empty state when the session has no reviews (AC7)", () => {
    renderApp({ route: "/dashboard" })

    expect(screen.getByText("No reviews yet")).toBeInTheDocument()
    expect(screen.queryAllByTestId("review-row")).toHaveLength(0)
    expect(screen.getByRole("link", { name: "Start a review" })).toBeInTheDocument()
  })

  it("lists this session's reviews newest first (AC6)", () => {
    renderApp({ route: "/dashboard", initialReview: [older, newer] })

    const row = screen.getAllByTestId("review-row")
    expect(row).toHaveLength(2)
    expect(row[0]).toHaveTextContent("GitHub file")
    expect(row[0]).toHaveTextContent("src/session.ts")
    expect(row[1]).toHaveTextContent("Pasted snippet")
    expect(row[1]).toHaveTextContent("snippet.ts")
  })

  it("shows source, relative time and per-category counts on each row (AC6)", () => {
    renderApp({ route: "/dashboard", initialReview: [older, newer] })

    const first = within(screen.getAllByTestId("review-row")[0]!)
    expect(first.getByText(/ago|just now/)).toBeInTheDocument()

    const counts = within(first.getByTestId("review-row-count"))
    expect(counts.getByText(`Style ${newer.summary.style}`)).toBeInTheDocument()
    expect(counts.getByText(`Bugs ${newer.summary.bug}`)).toBeInTheDocument()
    expect(counts.getByText(`Security ${newer.summary.security}`)).toBeInTheDocument()
    expect(
      counts.getByText(`Refactor Suggestions ${newer.summary.refactor}`),
    ).toBeInTheDocument()
    expect(
      counts.getByText(`Generated Tests ${newer.summary.generatedTest}`),
    ).toBeInTheDocument()
  })

  it("opens a review's results when its row is clicked (AC6)", async () => {
    const user = userEvent.setup()
    renderApp({ route: "/dashboard", initialReview: [older, newer] })

    await user.click(screen.getByRole("button", { name: `Open the review of ${newer.sourceLabel}` }))

    expect(await screen.findByRole("heading", { name: "Review results" })).toBeInTheDocument()
    expect(screen.getByText("GitHub file")).toBeInTheDocument()
  })
})
