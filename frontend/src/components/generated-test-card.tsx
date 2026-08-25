import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material"
import { Check, Copy } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { monoFontFamily } from "../theme"
import type { GeneratedTest } from "../types/review"

type Props = {
  generatedTest: GeneratedTest
}

/** One generated test with a copy-to-clipboard action (AC5). */
export function GeneratedTestCard({ generatedTest }: Props) {
  const [isCopied, setIsCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(generatedTest.code)
      setIsCopied(true)
      toast.success(`Copied the ${generatedTest.functionName} test`)
      window.setTimeout(() => setIsCopied(false), 2000)
    } catch {
      toast.error("Could not copy to the clipboard.", {
        description: "Select the snippet and copy it by hand instead.",
      })
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }} data-testid="generated-test">
      <Stack spacing={1.5}>
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}
        >
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ flexWrap: "wrap", alignItems: "center", minWidth: 0 }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, fontFamily: monoFontFamily, wordBreak: "break-all" }}
            >
              {generatedTest.functionName}
            </Typography>
            <Chip size="small" variant="outlined" label={generatedTest.framework} />
          </Stack>
          <Button
            size="small"
            variant="outlined"
            onClick={handleCopy}
            aria-label={`Copy the ${generatedTest.functionName} test`}
            startIcon={
              isCopied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />
            }
          >
            {isCopied ? "Copied" : "Copy"}
          </Button>
        </Stack>

        <Box
          component="pre"
          sx={{
            m: 0,
            p: 1.5,
            borderRadius: 1,
            bgcolor: "rgba(13, 17, 23, 0.8)",
            border: 1,
            borderColor: "divider",
            fontFamily: monoFontFamily,
            fontSize: 12.5,
            lineHeight: 1.6,
            overflowX: "auto",
          }}
        >
          <code>{generatedTest.code}</code>
        </Box>
      </Stack>
    </Paper>
  )
}
