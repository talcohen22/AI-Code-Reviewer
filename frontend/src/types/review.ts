/**
 * Domain types for the AI Code Reviewer.
 *
 * These shapes are the contract a future AI-analysis backend must satisfy —
 * `.orchestrate/api-contract.yaml` mirrors them. Keep the two in step.
 * Array fields stay singular per `.claude/rules/naming.md`.
 */

/** How severe a finding is. Drives the results-view severity filter. */
export type Severity = "critical" | "warning" | "info"

/** The buckets findings are grouped into on the results view. */
export type FindingCategory = "style" | "bug" | "security" | "refactor"

/** Where the reviewed code came from. */
export type ReviewSource = "paste" | "github"

/** A single issue the review found in the submitted code. */
export type Finding = {
  id: string
  category: FindingCategory
  severity: Severity
  title: string
  description: string
  /** File the finding refers to — the GitHub path, or the snippet's stand-in name. */
  file: string
  /** 1-based line number inside `file`. */
  line: number
  suggestion: string
}

/** A test the reviewer generated for one function in the submitted code. */
export type GeneratedTest = {
  id: string
  functionName: string
  framework: string
  code: string
}

/** Per-category and per-severity counts, precomputed for the dashboard. */
export type ReviewSummary = {
  style: number
  bug: number
  security: number
  refactor: number
  generatedTest: number
  critical: number
  warning: number
  info: number
  total: number
}

/** One completed review of one submission. */
export type Review = {
  id: string
  source: ReviewSource
  /** Human-readable origin: "Pasted snippet" or the GitHub file path. */
  sourceLabel: string
  file: string
  language: string
  code: string
  /** ISO 8601 timestamp. */
  createdAt: string
  finding: Finding[]
  generatedTest: GeneratedTest[]
  summary: ReviewSummary
}

/** The payload the UI sends to run a review. */
export type ReviewRequest = {
  source: ReviewSource
  code: string
  file: string
  language: string
  /** Present only when `source` is "github". */
  githubUrl?: string
}

/** A parsed `github.com/{owner}/{repo}/blob/{branch}/{path}` file link. */
export type GithubFileRef = {
  owner: string
  repo: string
  branch: string
  path: string
}

/** A page of past reviews, newest first. */
export type ReviewListResponse = {
  item: Review[]
}

/** The error body every failing endpoint returns; surfaced as a sonner toast. */
export type ApiError = {
  message: string
}

/**
 * The endpoints a future backend must implement, keyed by method and path.
 * `.orchestrate/api-contract.yaml` is the OpenAPI rendering of this type.
 */
export type ApiContract = {
  "POST /api/review": {
    request: ReviewRequest
    response: Review
    error: ApiError
  }
  "GET /api/review": {
    request: never
    response: ReviewListResponse
    error: ApiError
  }
  "GET /api/review/{id}": {
    request: never
    response: Review
    error: ApiError
  }
}
