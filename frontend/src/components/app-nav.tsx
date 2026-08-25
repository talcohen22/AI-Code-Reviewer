import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material"
import { Code, LayoutDashboard, SearchCode } from "lucide-react"
import { Link as RouterLink, useLocation } from "react-router"

const NAV_ITEM = [
  { to: "/", label: "New review", icon: Code },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
]

export function AppNav() {
  const { pathname } = useLocation()

  return (
    <AppBar position="sticky">
      <Toolbar sx={{ gap: 1, px: { xs: 1.5, sm: 3 } }}>
        <Box
          component={RouterLink}
          to="/"
          aria-label="AI Code Reviewer home"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "text.primary",
            textDecoration: "none",
            minWidth: 0,
            flexGrow: 1,
          }}
        >
          <SearchCode size={22} aria-hidden />
          <Typography
            variant="h3"
            component="span"
            sx={{ whiteSpace: "nowrap", display: { xs: "none", sm: "block" } }}
          >
            AI Code Reviewer
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
          {NAV_ITEM.map(item => {
            const Icon = item.icon
            const isActive =
              item.to === "/" ? pathname === "/" : pathname.startsWith(item.to)

            return (
              <Button
                key={item.to}
                component={RouterLink}
                to={item.to}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                color={isActive ? "primary" : "inherit"}
                startIcon={<Icon size={16} aria-hidden />}
                sx={{ px: { xs: 1, sm: 1.5 }, whiteSpace: "nowrap" }}
              >
                {item.label}
              </Button>
            )
          })}
        </Box>
      </Toolbar>
    </AppBar>
  )
}
