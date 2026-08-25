import {
  Braces,
  Bug,
  FlaskConical,
  GitBranch,
  type LucideIcon,
  Palette,
  ShieldAlert,
  Wrench,
} from "lucide-react"

import type { FindingCategory, ReviewSource, Severity } from "../types/review"

/**
 * One icon per concept, fixed here so the vocabulary cannot drift across views
 * (`.claude/rules/ui-and-styling.md`).
 */

export type CategoryMeta = {
  key: FindingCategory
  label: string
  icon: LucideIcon
  emptyText: string
}

/** Render order of the finding groups on the results view (AC3). */
export const CATEGORY_META: CategoryMeta[] = [
  {
    key: "style",
    label: "Style",
    icon: Palette,
    emptyText: "No style findings for this submission.",
  },
  {
    key: "bug",
    label: "Bugs",
    icon: Bug,
    emptyText: "No bugs found in this submission.",
  },
  {
    key: "security",
    label: "Security",
    icon: ShieldAlert,
    emptyText: "No security findings for this submission.",
  },
  {
    key: "refactor",
    label: "Refactor Suggestions",
    icon: Wrench,
    emptyText: "No refactor suggestions for this submission.",
  },
]

/** The fifth group on the results view. It holds tests, not findings. */
export const GENERATED_TEST_META = {
  label: "Generated Tests",
  icon: FlaskConical,
  emptyText: "No functions were detected, so no tests were generated.",
} as const

export type SeverityMeta = {
  key: Severity
  label: string
  color: "error" | "warning" | "info"
}

export const SEVERITY_META: SeverityMeta[] = [
  { key: "critical", label: "Critical", color: "error" },
  { key: "warning", label: "Warning", color: "warning" },
  { key: "info", label: "Info", color: "info" },
]

export function severityMeta(severity: Severity): SeverityMeta {
  return SEVERITY_META.find(entry => entry.key === severity) ?? SEVERITY_META[2]!
}

export const SOURCE_ICON: Record<ReviewSource, LucideIcon> = {
  paste: Braces,
  github: GitBranch,
}

export function sourceLabel(source: ReviewSource): string {
  return source === "github" ? "GitHub file" : "Pasted snippet"
}
