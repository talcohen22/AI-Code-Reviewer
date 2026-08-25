import { fileBaseName, toCamelCase } from "../lib/helpers"
import type {
  Finding,
  FindingCategory,
  GeneratedTest,
  GithubFileRef,
  Review,
  ReviewRequest,
  ReviewSummary,
  Severity,
} from "../types/review"

/**
 * The mock AI layer. There is no backend in this phase, so a review is produced
 * locally by `generateReview`, a **pure function of its input** — same request in,
 * same review out (given the same `now`). Keeping it pure is what stops the test
 * suites from flaking.
 */

/** Longest snippet the (mock) reviewer accepts. */
export const MAX_CODE_LENGTH = 20_000

/** Default stand-in file name for a pasted snippet. */
export const DEFAULT_SNIPPET_FILE = "snippet.ts"

/** How long a review "takes", so the loading state is real. Overridable per env. */
export function reviewLatencyMs(): number {
  const configured = Number(import.meta.env.VITE_REVIEW_LATENCY_MS)
  return Number.isFinite(configured) && configured >= 0 ? configured : 700
}

type RuleDefinition = {
  key: string
  category: FindingCategory
  severity: Severity
  title: string
  description: string
  suggestion: string
  /** Must carry the global flag — the engine walks every match. */
  pattern: RegExp
  limit?: number
}

const RULE: RuleDefinition[] = [
  {
    key: "legacy-var",
    category: "style",
    severity: "warning",
    title: "Legacy `var` declaration",
    description:
      "`var` is function-scoped and hoisted, which makes the binding visible before it is assigned.",
    suggestion: "Declare the binding with `const`, or `let` when it is reassigned.",
    pattern: /\bvar\s+[A-Za-z_$][\w$]*/g,
  },
  {
    key: "debug-log",
    category: "style",
    severity: "info",
    title: "Debug logging left in the code",
    description: "A `console` call ships to production and can leak values into browser logs.",
    suggestion: "Remove the call, or route it through the project's logger behind a level check.",
    pattern: /console\.(?:log|debug)\s*\(/g,
  },
  {
    key: "long-line",
    category: "style",
    severity: "info",
    title: "Line exceeds 100 characters",
    description: "Long lines are hard to review side by side in a diff.",
    suggestion: "Wrap the expression, or extract part of it into a named intermediate value.",
    pattern: /^.{101,}$/gm,
    limit: 2,
  },
  {
    key: "loose-equality",
    category: "bug",
    severity: "warning",
    title: "Loose equality comparison",
    description:
      "`==` coerces its operands, so values such as `0`, `\"\"` and `null` compare equal in ways that surprise readers.",
    suggestion: "Use `===`, and compare against `null` explicitly when you mean nullish.",
    pattern: /[^=!<>]==[^=]/g,
  },
  {
    key: "empty-catch",
    category: "bug",
    severity: "critical",
    title: "Empty catch block swallows the error",
    description:
      "The failure is discarded silently, so the caller cannot tell a failed call from a successful one.",
    suggestion: "Log the error, rethrow it, or return an explicit failure result.",
    pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g,
  },
  {
    key: "unguarded-json-parse",
    category: "bug",
    severity: "warning",
    title: "Unguarded `JSON.parse`",
    description: "`JSON.parse` throws on malformed input, which takes down the surrounding call.",
    suggestion: "Wrap the parse in `try`/`catch` and return a typed failure on invalid input.",
    pattern: /JSON\.parse\s*\(/g,
  },
  {
    key: "parse-int-radix",
    category: "bug",
    severity: "info",
    title: "`parseInt` without a radix",
    description: "Omitting the radix leaves the base up to the engine's inference of the input.",
    suggestion: "Pass an explicit radix — `parseInt(value, 10)` — or use `Number(value)`.",
    pattern: /parseInt\s*\(\s*[^,()]+\)/g,
  },
  {
    key: "eval-use",
    category: "security",
    severity: "critical",
    title: "`eval` executes arbitrary code",
    description:
      "Any attacker-controlled substring reaching `eval` runs with the full privileges of the page.",
    suggestion: "Replace `eval` with a lookup, `JSON.parse`, or an explicit dispatch table.",
    pattern: /\beval\s*\(/g,
  },
  {
    key: "hardcoded-credential",
    category: "security",
    severity: "critical",
    title: "Hardcoded credential",
    description:
      "A literal secret in source is readable by anyone with repository access and survives in git history.",
    suggestion: "Read the value from an environment variable and rotate the exposed credential.",
    pattern: /(?:api[_-]?key|password|passwd|secret|token)\s*[:=]\s*["'`][^"'`\n]{4,}["'`]/gi,
  },
  {
    key: "inner-html",
    category: "security",
    severity: "warning",
    title: "Direct `innerHTML` assignment",
    description: "Assigning markup from a value renders any script it carries — a DOM XSS sink.",
    suggestion: "Set `textContent`, or sanitize the markup before assigning it.",
    pattern: /\.innerHTML\s*=/g,
  },
  {
    key: "shell-exec",
    category: "security",
    severity: "warning",
    title: "Synchronous shell execution",
    description: "Interpolating a value into a shell command allows command injection.",
    suggestion: "Use the array-argument form of `spawn`, and never interpolate untrusted input.",
    pattern: /\b(?:execSync|spawnSync)\s*\(/g,
  },
  {
    key: "index-loop",
    category: "refactor",
    severity: "info",
    title: "Manual index loop",
    description: "The index exists only to walk the collection, which hides the actual intent.",
    suggestion: "Use `for…of`, or an array method such as `map`, `filter`, or `reduce`.",
    pattern: /for\s*\(\s*(?:var|let)\s+[A-Za-z_$][\w$]*\s*=\s*0\s*;/g,
  },
  {
    key: "promise-chain",
    category: "refactor",
    severity: "info",
    title: "Promise chain could read as `async`/`await`",
    description: "`.then` chains obscure control flow and make error handling easy to miss.",
    suggestion: "Await the promise inside an `async` function and handle failures with `try`/`catch`.",
    pattern: /\.then\s*\(/g,
  },
]

/** A function found in the submitted code, used for tests and length findings. */
type DetectedFunction = {
  name: string
  line: number
  length: number
}

const FUNCTION_PATTERN: RegExp[] = [
  /(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(/g,
  /(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|\([^)\n]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/g,
]

/** Longest a function may run before the reviewer suggests splitting it. */
const LONG_FUNCTION_LINES = 12

const MAX_GENERATED_TEST = 6

function lineAt(code: string, index: number): number {
  let line = 1
  for (let position = 0; position < index && position < code.length; position += 1) {
    if (code[position] === "\n") line += 1
  }
  return line
}

/** Lines a function body spans, counted by brace balance from its opening `{`. */
function functionLength(code: string, startIndex: number): number {
  const openIndex = code.indexOf("{", startIndex)
  if (openIndex === -1) return 1

  let depth = 0
  for (let position = openIndex; position < code.length; position += 1) {
    const character = code[position]
    if (character === "{") depth += 1
    if (character === "}") {
      depth -= 1
      if (depth === 0) return lineAt(code, position) - lineAt(code, startIndex) + 1
    }
  }
  return lineCountFrom(code, startIndex)
}

function lineCountFrom(code: string, startIndex: number): number {
  return lineAt(code, code.length) - lineAt(code, startIndex) + 1
}

/** Every named function in the code, first occurrence wins, ordered by line. */
export function detectFunction(code: string): DetectedFunction[] {
  const found = new Map<string, DetectedFunction>()

  for (const pattern of FUNCTION_PATTERN) {
    const walker = new RegExp(pattern.source, pattern.flags)
    let match = walker.exec(code)
    while (match !== null) {
      const name = match[1]
      if (name && !found.has(name)) {
        found.set(name, {
          name,
          line: lineAt(code, match.index),
          length: functionLength(code, match.index),
        })
      }
      match = walker.exec(code)
    }
  }

  return [...found.values()].sort((left, right) => left.line - right.line)
}

function ruleFinding(code: string, file: string): Finding[] {
  const finding: Finding[] = []

  for (const rule of RULE) {
    const walker = new RegExp(rule.pattern.source, rule.pattern.flags)
    const limit = rule.limit ?? 3
    let hit = 0
    let match = walker.exec(code)

    while (match !== null && hit < limit) {
      // A zero-length match would loop forever; nudge the walker forward.
      if (match[0].length === 0) walker.lastIndex += 1
      else {
        hit += 1
        finding.push({
          id: `${rule.key}-${hit}`,
          category: rule.category,
          severity: rule.severity,
          title: rule.title,
          description: rule.description,
          suggestion: rule.suggestion,
          file,
          line: lineAt(code, match.index),
        })
      }
      match = walker.exec(code)
    }
  }

  return finding
}

function longFunctionFinding(detected: DetectedFunction[], file: string): Finding[] {
  return detected
    .filter(entry => entry.length > LONG_FUNCTION_LINES)
    .slice(0, 3)
    .map(entry => ({
      id: `long-function-${entry.name}`,
      category: "refactor" as const,
      severity: "warning" as const,
      title: `\`${entry.name}\` runs ${entry.length} lines`,
      description: `A function longer than ${LONG_FUNCTION_LINES} lines usually holds more than one responsibility.`,
      suggestion: `Extract the distinct steps of \`${entry.name}\` into named helpers.`,
      file,
      line: entry.line,
    }))
}

function generatedTestFor(detected: DetectedFunction[], file: string): GeneratedTest[] {
  const moduleName = fileBaseName(file) || "module"

  return detected.slice(0, MAX_GENERATED_TEST).map(entry => ({
    id: `test-${entry.name}`,
    functionName: entry.name,
    framework: "vitest",
    code: [
      `import { describe, expect, it } from "vitest"`,
      ``,
      `import { ${entry.name} } from "./${moduleName}"`,
      ``,
      `describe("${entry.name}", () => {`,
      `  it("returns a result for a representative input", () => {`,
      `    expect(${entry.name}).toBeTypeOf("function")`,
      `  })`,
      ``,
      `  it("handles a missing input without throwing", () => {`,
      `    expect(() => ${entry.name}(undefined as never)).not.toThrow()`,
      `  })`,
      `})`,
      ``,
    ].join("\n"),
  }))
}

function summarize(finding: Finding[], generatedTest: GeneratedTest[]): ReviewSummary {
  const countCategory = (category: FindingCategory) =>
    finding.filter(entry => entry.category === category).length
  const countSeverity = (severity: Severity) =>
    finding.filter(entry => entry.severity === severity).length

  return {
    style: countCategory("style"),
    bug: countCategory("bug"),
    security: countCategory("security"),
    refactor: countCategory("refactor"),
    generatedTest: generatedTest.length,
    critical: countSeverity("critical"),
    warning: countSeverity("warning"),
    info: countSeverity("info"),
    total: finding.length,
  }
}

/** Stable 32-bit FNV-1a hash, so a review id is derived rather than random. */
function hash(value: string): string {
  let accumulator = 2166136261
  for (let position = 0; position < value.length; position += 1) {
    accumulator ^= value.charCodeAt(position)
    accumulator = Math.imul(accumulator, 16777619) >>> 0
  }
  return accumulator.toString(36)
}

/**
 * Run the mock review. Pure: the only non-deterministic input is `now`, which
 * callers can pin. Findings come from the rules above, so results track the
 * submitted code instead of being one canned response.
 */
export function generateReview(request: ReviewRequest, now: Date = new Date()): Review {
  const file = request.file || DEFAULT_SNIPPET_FILE
  const detected = detectFunction(request.code)
  const finding = [...ruleFinding(request.code, file), ...longFunctionFinding(detected, file)]
  const generatedTest = generatedTestFor(detected, file)

  return {
    id: `rv-${hash(`${request.source}:${file}:${request.code}`)}-${now.getTime().toString(36)}`,
    source: request.source,
    sourceLabel: request.source === "github" ? file : "Pasted snippet",
    file,
    language: request.language,
    code: request.code,
    createdAt: now.toISOString(),
    finding,
    generatedTest,
    summary: summarize(finding, generatedTest),
  }
}

/**
 * What the UI calls. Stands in for `POST /api/review`: it validates the request,
 * waits out a short latency so the loading state is real, then resolves a review.
 * Rejects with the message the caller should surface as a toast.
 */
export async function runReview(request: ReviewRequest, now: Date = new Date()): Promise<Review> {
  if (request.code.trim().length === 0) {
    throw new Error("There is no code to review yet.")
  }
  if (request.code.length > MAX_CODE_LENGTH) {
    throw new Error(
      `That snippet is ${request.code.length.toLocaleString()} characters. Trim it to ${MAX_CODE_LENGTH.toLocaleString()} or fewer.`,
    )
  }

  await new Promise(resolve => {
    setTimeout(resolve, reviewLatencyMs())
  })

  return generateReview(request, now)
}

/**
 * Stand-in for the GitHub file the link points at. There are no live GitHub
 * calls in this phase, so the contents are derived from the ref itself.
 */
export function mockGithubFile(ref: GithubFileRef): string {
  const identifier = toCamelCase(fileBaseName(ref.path))

  return [
    `// github.com/${ref.owner}/${ref.repo} @ ${ref.branch}`,
    `// ${ref.path}`,
    ``,
    `var ${identifier}Cache = {}`,
    ``,
    `export function ${identifier}(rawInput) {`,
    `  console.log("${identifier}", rawInput)`,
    ``,
    `  if (rawInput == null) {`,
    `    return null`,
    `  }`,
    ``,
    `  const apiToken = "${ref.repo}_live_2f8c41ba9d"`,
    `  const parsed = JSON.parse(rawInput)`,
    `  const result = []`,
    ``,
    `  for (var index = 0; index < parsed.length; index++) {`,
    `    result.push(${identifier}Cache[parsed[index]] || parsed[index])`,
    `  }`,
    ``,
    `  return { token: apiToken, result: result }`,
    `}`,
    ``,
    `export const render${identifier.charAt(0).toUpperCase()}${identifier.slice(1)} = (node, rawInput) => {`,
    `  try {`,
    `    node.innerHTML = ${identifier}(rawInput).result.join(", ")`,
    `  } catch (error) {}`,
    `}`,
    ``,
  ].join("\n")
}

/**
 * Demo history. The running app starts with an empty session so the dashboard's
 * empty state is reachable (AC7); tests and demos seed from here instead.
 */
export const seedReview: Review[] = [
  generateReview(
    {
      source: "paste",
      file: "cart-total.ts",
      language: "typescript",
      code: [
        `var TAX = 0.17`,
        ``,
        `export function cartTotal(line) {`,
        `  var total = 0`,
        `  for (var index = 0; index < line.length; index++) {`,
        `    total = total + line[index].price * line[index].qty`,
        `  }`,
        `  if (total == 0) {`,
        `    return 0`,
        `  }`,
        `  return total * (1 + TAX)`,
        `}`,
        ``,
      ].join("\n"),
    },
    new Date("2026-08-24T09:00:00.000Z"),
  ),
  generateReview(
    {
      source: "github",
      file: "src/session.ts",
      language: "typescript",
      githubUrl: "https://github.com/acme/checkout/blob/main/src/session.ts",
      code: [
        `const password = "hunter2-not-a-real-secret"`,
        ``,
        `export function readSession(raw) {`,
        `  console.log("session", raw)`,
        `  return eval("(" + raw + ")")`,
        `}`,
        ``,
      ].join("\n"),
    },
    new Date("2026-08-24T10:30:00.000Z"),
  ),
]
