import type { GithubFileRef } from "../types/review"

/** Join class-name-ish parts, dropping anything falsy. */
export function cls(...part: Array<string | false | null | undefined>): string {
  return part.filter(Boolean).join(" ")
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** Short relative time — "just now", "4m ago", "3h ago", "2d ago". */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return "unknown"

  const elapsed = now.getTime() - then
  if (elapsed < MINUTE) return "just now"
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`
  return `${Math.floor(elapsed / DAY)}d ago`
}

const GITHUB_FILE_PATTERN =
  /^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+)\/blob\/([\w.\-/]+?)\/([\w.\-/]+\.[A-Za-z0-9]+)$/

/**
 * Parse a `github.com/{owner}/{repo}/blob/{branch}/{path}` file link.
 * Returns `null` for anything else — a repo root, a tree link, another host,
 * or a path with no file extension. AC2 requires rejecting those.
 */
export function parseGithubUrl(url: string): GithubFileRef | null {
  const match = GITHUB_FILE_PATTERN.exec(url.trim())
  if (!match) return null

  const [, owner, repo, branch, path] = match
  if (!owner || !repo || !branch || !path) return null
  return { owner, repo, branch, path }
}

/** The last segment of a path: `src/lib/format.ts` -> `format.ts`. */
export function fileName(path: string): string {
  const segment = path.split("/").filter(Boolean)
  return segment[segment.length - 1] ?? path
}

/** The last segment without its extension: `src/lib/format.ts` -> `format`. */
export function fileBaseName(path: string): string {
  const name = fileName(path)
  const dot = name.lastIndexOf(".")
  return dot > 0 ? name.slice(0, dot) : name
}

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  mts: "typescript",
  cts: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  py: "python",
  rb: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  php: "php",
  cs: "csharp",
  sql: "sql",
  json: "json",
  css: "css",
  html: "html",
  md: "markdown",
  yml: "yaml",
  yaml: "yaml",
}

/** Monaco language id for a file path, defaulting to TypeScript. */
export function languageFromPath(path: string): string {
  const name = fileName(path)
  const dot = name.lastIndexOf(".")
  const extension = dot > 0 ? name.slice(dot + 1).toLowerCase() : ""
  return LANGUAGE_BY_EXTENSION[extension] ?? "typescript"
}

/** Turn a file base name into a camelCase identifier: `format-date` -> `formatDate`. */
export function toCamelCase(value: string): string {
  const part = value.split(/[^A-Za-z0-9]+/).filter(Boolean)
  if (part.length === 0) return "handler"

  const [first, ...rest] = part
  const head = (first ?? "").toLowerCase()
  const tail = rest.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
  const identifier = [head, ...tail].join("")
  return /^[A-Za-z_$]/.test(identifier) ? identifier : `fn${identifier}`
}

/** Count the lines in a chunk of text; empty text has zero lines. */
export function lineCount(code: string): number {
  if (code.length === 0) return 0
  return code.split("\n").length
}
