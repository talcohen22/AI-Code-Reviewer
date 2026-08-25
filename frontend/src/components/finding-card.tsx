import { Chip, Paper, Stack, Typography } from "@mui/material"

import { severityMeta } from "../lib/review-presentation"
import { monoFontFamily } from "../theme"
import type { Finding } from "../types/review"

type Props = {
  finding: Finding
}

/** One finding: severity, file/line reference, description and a suggested fix (AC3). */
export function FindingCard({ finding }: Props) {
  const severity = severityMeta(finding.severity)

  return (
    <Paper variant="outlined" sx={{ p: 2 }} data-testid="finding">
      <Stack spacing={1}>
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ flexWrap: "wrap", alignItems: "center" }}
        >
          <Chip
            size="small"
            color={severity.color}
            variant="outlined"
            label={severity.label}
            data-testid="finding-severity"
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontFamily: monoFontFamily, wordBreak: "break-all" }}
          >
            {finding.file}:{finding.line}
          </Typography>
        </Stack>

        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {finding.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {finding.description}
        </Typography>
        <Typography variant="body2" sx={{ color: "secondary.main" }}>
          Suggested fix: {finding.suggestion}
        </Typography>
      </Stack>
    </Paper>
  )
}
