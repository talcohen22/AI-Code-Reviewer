import { type ReactNode, useCallback, useMemo, useState } from "react"

import { ReviewStoreContext, type ReviewStore } from "./review-store"
import type { Review } from "../types/review"

type Props = {
  /** Seeded history. The running app passes nothing, so a session starts empty. */
  initialReview?: Review[]
  children: ReactNode
}

export function ReviewStoreProvider({ initialReview = [], children }: Props) {
  const [review, setReview] = useState<Review[]>(() =>
    [...initialReview].sort(
      (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
    ),
  )

  const addReview = useCallback((next: Review) => {
    setReview(current => [next, ...current.filter(entry => entry.id !== next.id)])
  }, [])

  const findReview = useCallback(
    (id: string) => review.find(entry => entry.id === id),
    [review],
  )

  const value = useMemo<ReviewStore>(
    () => ({ review, addReview, findReview }),
    [review, addReview, findReview],
  )

  return <ReviewStoreContext value={value}>{children}</ReviewStoreContext>
}
