import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Container,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material"
import { ChevronDown, Clock, ListFilter } from "lucide-react"
import { useState } from "react"
import { Link as RouterLink, useParams } from "react-router"

import { EmptyState } from "./empty-state"
import { FindingCard } from "./finding-card"
import { GeneratedTestCard } from "./generated-test-card"
import { timeAgo } from "../lib/helpers"
import {
  CATEGORY_META,
  GENERATED_TEST_META,
  SEVERITY_META,
  SOURCE_ICON,
  sourceLabel,
} from "../lib/review-presentation"
import { useReviewStore } from "../state/review-store"
import { monoFontFamily } from "../theme"
import type { Severity } from "../types/review"

type SeverityFilter = Severity | "all"

export function ReviewResultView() {
  const { id } = useParams()
  const { findReview } = useReviewStore()
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all")

  const review = id ? findReview(id) : undefined

  if (!review) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 4, sm: 6 } }}>
        <EmptyState
          title="That review is not in this session"
          description="Review history lives in memory only and resets on reload. Run a new review to see results."
          action={
            <Button component={RouterLink} to="/" variant="contained">
              Start a review
            </Button>
          }
        />
      </Container>
    )
  }

  const visibleFinding =
    severityFilter === "all"
      ? review.finding
      : review.finding.filter(entry => entry.severity === severityFilter)

  const SourceIcon = SOURCE_ICON[review.source]

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 5 } }}>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h1" component="h1">
          Review results
        </Typography>
        <Stack
          direction="row"
          spacing={1.5}
          useFlexGap
          sx={{ flexWrap: "wrap", color: "text.secondary", alignItems: "center" }}
        >
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
            <SourceIcon size={15} aria-hidden />
            <Typography variant="body2">{sourceLabel(review.source)}</Typography>
          </Stack>
          <Typography variant="body2" sx={{ fontFamily: monoFontFamily, wordBreak: "break-all" }}>
            {review.file}
          </Typography>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
            <Clock size={15} aria-hidden />
            <Typography variant="body2">{timeAgo(review.createdAt)}</Typography>
          </Stack>
        </Stack>
      </Stack>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{
          mb: 3,
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
        }}
      >
        <Stack spacing={1}>
          <Stack
            direction="row"
            spacing={0.75}
            sx={{ color: "text.secondary", alignItems: "center" }}
          >
            <ListFilter size={15} aria-hidden />
            <Typography variant="body2">Filter by severity</Typography>
          </Stack>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={severityFilter}
            onChange={(_event, next: SeverityFilter | null) => setSeverityFilter(next ?? "all")}
            aria-label="Filter findings by severity"
            sx={{ flexWrap: "wrap" }}
          >
            <ToggleButton value="all">All</ToggleButton>
            {SEVERITY_META.map(severity => (
              <ToggleButton key={severity.key} value={severity.key}>
                {severity.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        <Typography variant="body2" color="text.secondary" data-testid="finding-count">
          Showing {visibleFinding.length} of {review.finding.length} findings
        </Typography>
      </Stack>

      <Stack spacing={2}>
        {CATEGORY_META.map(category => {
          const entry = visibleFinding.filter(finding => finding.category === category.key)
          const Icon = category.icon

          return (
            <Accordion key={category.key} defaultExpanded data-testid={`category-${category.key}`}>
              <AccordionSummary expandIcon={<ChevronDown size={18} aria-hidden />}>
                <Stack direction="row" spacing={1.25} sx={{ minWidth: 0, alignItems: "center" }}>
                  <Icon size={18} aria-hidden />
                  <Typography variant="h3" component="span">
                    {category.label}
                  </Typography>
                  <Chip size="small" label={entry.length} />
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                {entry.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {severityFilter === "all"
                      ? category.emptyText
                      : `No ${category.label.toLowerCase()} findings at this severity.`}
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {entry.map(finding => (
                      <FindingCard key={finding.id} finding={finding} />
                    ))}
                  </Stack>
                )}
              </AccordionDetails>
            </Accordion>
          )
        })}

        <Accordion defaultExpanded data-testid="category-generated-test">
          <AccordionSummary expandIcon={<ChevronDown size={18} aria-hidden />}>
            <Stack direction="row" spacing={1.25} sx={{ minWidth: 0, alignItems: "center" }}>
              <GENERATED_TEST_META.icon size={18} aria-hidden />
              <Typography variant="h3" component="span">
                {GENERATED_TEST_META.label}
              </Typography>
              <Chip size="small" label={review.generatedTest.length} />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            {review.generatedTest.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {GENERATED_TEST_META.emptyText}
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {review.generatedTest.map(generatedTest => (
                  <GeneratedTestCard key={generatedTest.id} generatedTest={generatedTest} />
                ))}
              </Stack>
            )}
          </AccordionDetails>
        </Accordion>
      </Stack>

      <Box sx={{ pt: 3 }}>
        <Button component={RouterLink} to="/dashboard" variant="text">
          See the quality dashboard
        </Button>
      </Box>
    </Container>
  )
}
