import { createContext, useContext } from "react"

import type { Review } from "../types/review"

/**
 * Session-scoped review history. There is no account system and no backend in
 * this phase, so history lives in React state and resets on reload.
 */
export type ReviewStore = {
  /** Newest first. */
  review: Review[]
  addReview: (next: Review) => void
  findReview: (id: string) => Review | undefined
}

export const ReviewStoreContext = createContext<ReviewStore | null>(null)

export function useReviewStore(): ReviewStore {
  const store = useContext(ReviewStoreContext)
  if (!store) throw new Error("useReviewStore must be used inside <ReviewStoreProvider>")
  return store
}
