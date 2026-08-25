import { createTheme } from "@mui/material/styles"

/** Monospace stack shared by the editor chrome, code blocks and file references. */
export const monoFontFamily =
  '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#8aa4ff" },
    secondary: { main: "#5ad1b0" },
    error: { main: "#ff6b6b" },
    warning: { main: "#ffb454" },
    info: { main: "#6fb3ff" },
    success: { main: "#5ad1b0" },
    background: { default: "#0d1117", paper: "#161b24" },
    divider: "rgba(148, 163, 184, 0.22)",
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily:
      '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { fontSize: "1.9rem", fontWeight: 700, letterSpacing: "-0.02em" },
    h2: { fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.01em" },
    h3: { fontSize: "1.1rem", fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "transparent" },
      styleOverrides: {
        root: { backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(148, 163, 184, 0.22)" },
      },
    },
    MuiPaper: { defaultProps: { elevation: 0 } },
    MuiAccordion: {
      defaultProps: { disableGutters: true, square: false },
      styleOverrides: {
        root: {
          border: "1px solid rgba(148, 163, 184, 0.22)",
          borderRadius: 10,
          "&::before": { display: "none" },
        },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
  },
})
