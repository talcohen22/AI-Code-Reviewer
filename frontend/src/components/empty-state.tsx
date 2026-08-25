import { Box, Paper, Stack, Typography } from "@mui/material"
import { Inbox, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

type Props = {
  title: string
  description: string
  icon?: LucideIcon
  action?: ReactNode
}

/** The deliberate empty state every list in the app falls back to (AC7). */
export function EmptyState({ title, description, icon: Icon = Inbox, action }: Props) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 3, sm: 5 },
        textAlign: "center",
        borderStyle: "dashed",
        bgcolor: "transparent",
      }}
    >
      <Stack spacing={1.5} sx={{ alignItems: "center" }}>
        <Box sx={{ color: "text.disabled", display: "flex" }}>
          <Icon size={32} aria-hidden />
        </Box>
        <Typography variant="h3" component="p">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
          {description}
        </Typography>
        {action ? <Box sx={{ pt: 1 }}>{action}</Box> : null}
      </Stack>
    </Paper>
  )
}
