import {
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material"
import { Clock } from "lucide-react"
import { useNavigate, Link as RouterLink } from "react-router"

import { EmptyState } from "./empty-state"
import { timeAgo } from "../lib/helpers"
import {
  CATEGORY_META,
  GENERATED_TEST_META,
  SOURCE_ICON,
  sourceLabel,
} from "../lib/review-presentation"
import { useReviewStore } from "../state/review-store"
import { monoFontFamily } from "../theme"
import type { Review } from "../types/review"

function categoryCount(review: Review) {
  return [
    ...CATEGORY_META.map(category => ({
      label: category.label,
      value: review.summary[category.key],
    })),
    { label: GENERATED_TEST_META.label, value: review.summary.generatedTest },
  ]
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, flex: 1, minWidth: 0 }}>
      <Typography variant="h2" component="p">
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  )
}

export function QualityDashboardView() {
  const { review } = useReviewStore()
  const navigate = useNavigate()

  const ordered = [...review].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  )
  const criticalCount = ordered.reduce((total, entry) => total + entry.summary.critical, 0)
  const testCount = ordered.reduce((total, entry) => total + entry.summary.generatedTest, 0)

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 5 } }}>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h1" component="h1">
          Quality dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Every review from this session, newest first. History is in-memory and resets on reload.
        </Typography>
      </Stack>

      {ordered.length === 0 ? (
        <EmptyState
          title="No reviews yet"
          description="Submit a snippet or a GitHub file link and the review will show up here."
          action={
            <Button component={RouterLink} to="/" variant="contained">
              Start a review
            </Button>
          }
        />
      ) : (
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <StatTile label="Reviews this session" value={ordered.length} />
            <StatTile label="Critical findings" value={criticalCount} />
            <StatTile label="Tests generated" value={testCount} />
          </Stack>

          <Stack spacing={1.5} data-testid="review-history">
            {ordered.map(entry => {
              const SourceIcon = SOURCE_ICON[entry.source]

              return (
                <Card key={entry.id} variant="outlined" data-testid="review-row">
                  <CardActionArea
                    onClick={() => navigate(`/review/${entry.id}`)}
                    aria-label={`Open the review of ${entry.sourceLabel}`}
                    sx={{ p: 2 }}
                  >
                    <Stack spacing={1.5}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        sx={{
                          justifyContent: "space-between",
                          alignItems: { xs: "flex-start", sm: "center" },
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          useFlexGap
                          sx={{ flexWrap: "wrap", minWidth: 0, alignItems: "center" }}
                        >
                          <SourceIcon size={16} aria-hidden />
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {sourceLabel(entry.source)}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontFamily: monoFontFamily, wordBreak: "break-all" }}
                          >
                            {entry.file}
                          </Typography>
                        </Stack>

                        <Stack
                          direction="row"
                          spacing={0.75}
                          sx={{ color: "text.secondary", flexShrink: 0, alignItems: "center" }}
                        >
                          <Clock size={14} aria-hidden />
                          <Typography variant="caption">{timeAgo(entry.createdAt)}</Typography>
                        </Stack>
                      </Stack>

                      <Box
                        sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}
                        data-testid="review-row-count"
                      >
                        {categoryCount(entry).map(count => (
                          <Chip
                            key={count.label}
                            size="small"
                            variant="outlined"
                            label={`${count.label} ${count.value}`}
                          />
                        ))}
                      </Box>
                    </Stack>
                  </CardActionArea>
                </Card>
              )
            })}
          </Stack>
        </Stack>
      )}
    </Container>
  )
}
