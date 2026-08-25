import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import { GitBranch, Sparkles } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"

import { CodeEditor } from "./code-editor"
import { languageFromPath, lineCount, parseGithubUrl } from "../lib/helpers"
import { DEFAULT_SNIPPET_FILE, mockGithubFile, runReview } from "../mock/seed"
import { useReviewStore } from "../state/review-store"
import type { ReviewSource } from "../types/review"

const LINK_EXAMPLE = "https://github.com/acme/checkout/blob/main/src/session.ts"

export function CodeSubmissionView() {
  const { addReview } = useReviewStore()
  const navigate = useNavigate()

  const [code, setCode] = useState("")
  const [githubUrl, setGithubUrl] = useState("")
  const [source, setSource] = useState<ReviewSource>("paste")
  const [file, setFile] = useState(DEFAULT_SNIPPET_FILE)
  const [language, setLanguage] = useState("typescript")
  const [isReviewing, setIsReviewing] = useState(false)

  function handleImport() {
    const ref = parseGithubUrl(githubUrl)
    if (!ref) {
      toast.error("That is not a GitHub file link.", {
        description: `Use the blob form, for example ${LINK_EXAMPLE}`,
      })
      return
    }

    setCode(mockGithubFile(ref))
    setSource("github")
    setFile(ref.path)
    setLanguage(languageFromPath(ref.path))
    toast.success(`Imported ${ref.path}`, {
      description: `${ref.owner}/${ref.repo} @ ${ref.branch} — contents are mocked in this phase.`,
    })
  }

  async function handleSubmit() {
    if (code.trim().length === 0) {
      toast.error("There is nothing to review yet.", {
        description: "Paste some code into the editor, or import a GitHub file first.",
      })
      return
    }

    setIsReviewing(true)
    try {
      const review = await runReview({ source, code, file, language, githubUrl: githubUrl || undefined })
      addReview(review)
      toast.success(`Review ready — ${review.summary.total} findings`)
      navigate(`/review/${review.id}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : "The review could not be completed."
      toast.error("The review could not be completed.", { description: message })
    } finally {
      setIsReviewing(false)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 5 } }}>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h1" component="h1">
          Review a snippet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Paste code, or import a single GitHub file. One pass returns style, bug and security
          findings, refactor suggestions, and generated tests.
        </Typography>
      </Stack>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ alignItems: { xs: "stretch", sm: "flex-start" } }}
        >
          <TextField
            fullWidth
            size="small"
            label="GitHub file link"
            placeholder={LINK_EXAMPLE}
            helperText="github.com/{owner}/{repo}/blob/{branch}/{path} — the fetch is mocked in this phase."
            value={githubUrl}
            onChange={event => setGithubUrl(event.target.value)}
            onKeyDown={event => {
              if (event.key === "Enter") {
                event.preventDefault()
                handleImport()
              }
            }}
          />
          <Button
            variant="outlined"
            onClick={handleImport}
            startIcon={<GitBranch size={16} aria-hidden />}
            sx={{ flexShrink: 0, mt: { xs: 0, sm: 0.25 } }}
          >
            Import file
          </Button>
        </Stack>
      </Paper>

      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
          }}
        >
          <Typography variant="h3" component="h2">
            Code
          </Typography>
          <Typography variant="caption" color="text.secondary" data-testid="submission-meta">
            {lineCount(code)} lines · {language} · {file}
          </Typography>
        </Stack>

        <CodeEditor value={code} language={language} onChange={setCode} />

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1.5,
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Nothing leaves the browser — this phase runs against a mock review layer.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={isReviewing}
            startIcon={
              isReviewing ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Sparkles size={18} aria-hidden />
              )
            }
          >
            {isReviewing ? "Reviewing…" : "Run review"}
          </Button>
        </Box>
      </Stack>
    </Container>
  )
}
