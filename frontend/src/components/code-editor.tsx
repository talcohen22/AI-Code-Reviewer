import { Box, CircularProgress, Stack, Typography } from "@mui/material"
import { Suspense, lazy } from "react"

/**
 * Monaco is heavy, so the whole editor — the React wrapper, the monaco bundle
 * and its worker wiring — is pulled in lazily and only on the submission view.
 */
const MonacoEditor = lazy(async () => {
  const [reactMonaco, monaco] = await Promise.all([
    import("@monaco-editor/react"),
    import("monaco-editor"),
    import("../lib/monaco-env"),
  ])

  reactMonaco.loader.config({ monaco })
  return { default: reactMonaco.default }
})

function EditorFallback() {
  return (
    <Stack
      spacing={1}
      sx={{ height: "100%", alignItems: "center", justifyContent: "center" }}
    >
      <CircularProgress size={22} />
      <Typography variant="caption" color="text.secondary">
        Loading the editor…
      </Typography>
    </Stack>
  )
}

type Props = {
  value: string
  language: string
  onChange: (next: string) => void
}

export function CodeEditor({ value, language, onChange }: Props) {
  return (
    <Box
      data-testid="code-editor"
      sx={{
        height: { xs: 260, sm: 340, md: 420 },
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        overflow: "hidden",
      }}
    >
      <Suspense fallback={<EditorFallback />}>
        <MonacoEditor
          height="100%"
          language={language}
          theme="vs-dark"
          value={value}
          onChange={next => onChange(next ?? "")}
          loading={<EditorFallback />}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            tabSize: 2,
            // Verbatim input: no bracket/quote completion rewriting what is typed
            // or pasted, which also keeps the e2e typing deterministic.
            autoClosingBrackets: "never",
            autoClosingQuotes: "never",
            autoSurround: "never",
            autoIndent: "none",
            formatOnPaste: false,
            formatOnType: false,
            renderLineHighlight: "none",
            padding: { top: 12, bottom: 12 },
          }}
        />
      </Suspense>
    </Box>
  )
}
