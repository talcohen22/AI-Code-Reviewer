import { Box } from "@mui/material"
import { Navigate, Route, Routes } from "react-router"
import { Toaster } from "sonner"

import { AppNav } from "./app-nav"
import { CodeSubmissionView } from "./code-submission-view"
import { QualityDashboardView } from "./quality-dashboard-view"
import { ReviewResultView } from "./review-result-view"
import { ReviewStoreProvider } from "../state/review-store-provider"
import type { Review } from "../types/review"

type Props = {
  /** Seeded session history. Tests pass this; the running app starts empty. */
  initialReview?: Review[]
}

/**
 * The whole app: session state, navigation, the three views, and the single
 * `<Toaster />` every failure path reports through (AC7).
 */
export function CodeReviewerApp({ initialReview }: Props) {
  return (
    <ReviewStoreProvider initialReview={initialReview}>
      <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        <AppNav />
        <Box component="main" sx={{ flexGrow: 1 }}>
          <Routes>
            <Route path="/" element={<CodeSubmissionView />} />
            <Route path="/review/:id" element={<ReviewResultView />} />
            <Route path="/dashboard" element={<QualityDashboardView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
      </Box>
      <Toaster position="bottom-right" richColors closeButton />
    </ReviewStoreProvider>
  )
}
