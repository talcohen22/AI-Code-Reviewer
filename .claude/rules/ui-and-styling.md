# UI and Styling

## Libraries
- `sonner` for toast messages — keep them concise and action-oriented.
- `lucide-react` for icons — reuse the same icon name for the same concept
  across features.

## Styling engine
`frontend/` is styled with **MUI** (`@mui/material` + `@emotion/react` +
`@emotion/styled`). Use MUI components and the `sx` prop / `styled()` API.
Do not add new `.css` files and do not use inline `style={}` props.

## Design tokens
- Declare shared tokens (palette, typography, spacing, shape) in a single MUI
  theme created with `createTheme()` in `frontend/src/theme.ts`, and provide it
  once via `<ThemeProvider theme={theme}>` at the app root.
- Reference theme tokens (`theme.palette.*`, `theme.spacing()`, etc.) from the
  `sx` prop rather than hardcoding colors or spacing values.
- Use `styled()` only where a component needs styling that would be unwieldy
  inline in `sx` — keep it colocated with the component it styles.
