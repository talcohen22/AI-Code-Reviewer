import { ThemeProvider } from "@mui/material"
import { render } from "@testing-library/react"
import { MemoryRouter } from "react-router"

import { CodeReviewerApp } from "../../../src/components/code-reviewer-app"
import { theme } from "../../../src/theme"
import type { Review } from "../../../src/types/review"

type Options = {
  route?: string
  initialReview?: Review[]
}

/** Render the whole app at a route, with an optional seeded session history. */
export function renderApp({ route = "/", initialReview = [] }: Options = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[route]}>
        <CodeReviewerApp initialReview={initialReview} />
      </MemoryRouter>
    </ThemeProvider>,
  )
}
