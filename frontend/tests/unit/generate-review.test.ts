import { afterEach, describe, expect, it, vi } from "vitest"

import { parseGithubUrl } from "../../src/lib/helpers"
import {
  MAX_CODE_LENGTH,
  detectFunction,
  generateReview,
  mockGithubFile,
  runReview,
} from "../../src/mock/seed"
import type { FindingCategory } from "../../src/types/review"
import { CLEAN_CODE, SAMPLE_CODE, buildPastedReview } from "./helper/fixture"

const NOW = new Date("2026-08-24T12:00:00.000Z")

function categoryOf(category: FindingCategory, review = buildPastedReview()) {
  return review.finding.filter(finding => finding.category === category)
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("generateReview", () => {
  it("groups findings into every category the snippet trips", () => {
    expect(categoryOf("style").length).toBeGreaterThan(0)
    expect(categoryOf("bug").length).toBeGreaterThan(0)
    expect(categoryOf("security").length).toBeGreaterThan(0)
    expect(categoryOf("refactor").length).toBeGreaterThan(0)
  })

  it("gives every finding a severity, a file/line reference and a description", () => {
    const review = buildPastedReview()

    for (const finding of review.finding) {
      expect(["critical", "warning", "info"]).toContain(finding.severity)
      expect(finding.file).toBe("snippet.ts")
      expect(finding.line).toBeGreaterThan(0)
      expect(finding.description.length).toBeGreaterThan(0)
      expect(finding.suggestion.length).toBeGreaterThan(0)
    }
  })

  it("flags eval and a hardcoded credential as critical security findings", () => {
    const security = categoryOf("security")

    expect(security.map(finding => finding.title)).toEqual(
      expect.arrayContaining(["`eval` executes arbitrary code", "Hardcoded credential"]),
    )
    expect(security.every(finding => finding.severity === "critical")).toBe(true)
  })

  it("points a finding at the line the pattern was found on", () => {
    const evalFinding = categoryOf("security").find(
      finding => finding.title === "`eval` executes arbitrary code",
    )

    // `eval` sits on line 9 of the fixture snippet.
    expect(evalFinding?.line).toBe(9)
  })

  it("generates one test per detected function", () => {
    const review = buildPastedReview()

    expect(review.generatedTest.map(test => test.functionName)).toEqual(["loadUser", "saveUser"])
    for (const test of review.generatedTest) {
      expect(test.code).toContain(`describe("${test.functionName}"`)
      expect(test.framework).toBe("vitest")
    }
  })

  it("summarizes counts consistently with the findings it returned", () => {
    const review = buildPastedReview()
    const { summary } = review

    expect(summary.total).toBe(review.finding.length)
    expect(summary.style + summary.bug + summary.security + summary.refactor).toBe(summary.total)
    expect(summary.critical + summary.warning + summary.info).toBe(summary.total)
    expect(summary.generatedTest).toBe(review.generatedTest.length)
  })

  it("labels the source it was submitted from", () => {
    expect(buildPastedReview().sourceLabel).toBe("Pasted snippet")
    expect(
      generateReview(
        { source: "github", code: SAMPLE_CODE, file: "src/session.ts", language: "typescript" },
        NOW,
      ).sourceLabel,
    ).toBe("src/session.ts")
  })

  it("is a pure function of its input, so two runs match", () => {
    const first = generateReview(
      { source: "paste", code: SAMPLE_CODE, file: "snippet.ts", language: "typescript" },
      NOW,
    )
    const second = generateReview(
      { source: "paste", code: SAMPLE_CODE, file: "snippet.ts", language: "typescript" },
      NOW,
    )

    expect(second).toEqual(first)
  })

  it("returns fewer findings for code that trips no rules", () => {
    const review = generateReview(
      { source: "paste", code: CLEAN_CODE, file: "add.ts", language: "typescript" },
      NOW,
    )

    expect(review.finding).toHaveLength(0)
    expect(review.summary.total).toBe(0)
    expect(review.generatedTest).toHaveLength(1)
  })

  it("generates no tests when the snippet declares no function", () => {
    const review = generateReview(
      { source: "paste", code: "var total = 1 + 2\n", file: "snippet.ts", language: "typescript" },
      NOW,
    )

    expect(review.generatedTest).toHaveLength(0)
    expect(review.summary.generatedTest).toBe(0)
  })
})

describe("detectFunction", () => {
  it("finds declarations and arrow functions, ordered by line", () => {
    const detected = detectFunction(
      ["function first() {", "  return 1", "}", "", "const second = () => 2", ""].join("\n"),
    )

    expect(detected.map(entry => entry.name)).toEqual(["first", "second"])
    expect(detected[0]?.line).toBe(1)
    expect(detected[1]?.line).toBe(5)
  })
})

describe("runReview", () => {
  it("resolves a review for a valid submission", async () => {
    vi.stubEnv("VITE_REVIEW_LATENCY_MS", "0")

    const review = await runReview(
      { source: "paste", code: SAMPLE_CODE, file: "snippet.ts", language: "typescript" },
      NOW,
    )

    expect(review.id).toMatch(/^rv-/)
    expect(review.finding.length).toBeGreaterThan(0)
  })

  it("rejects an empty submission", async () => {
    vi.stubEnv("VITE_REVIEW_LATENCY_MS", "0")

    await expect(
      runReview({ source: "paste", code: "   \n  ", file: "snippet.ts", language: "typescript" }),
    ).rejects.toThrow("There is no code to review yet.")
  })

  it("rejects a submission over the size limit", async () => {
    vi.stubEnv("VITE_REVIEW_LATENCY_MS", "0")

    await expect(
      runReview({
        source: "paste",
        code: "a".repeat(MAX_CODE_LENGTH + 1),
        file: "snippet.ts",
        language: "typescript",
      }),
    ).rejects.toThrow(/Trim it to/)
  })
})

describe("mockGithubFile", () => {
  it("derives contents from the ref that reference the file it stands in for", () => {
    const ref = parseGithubUrl("https://github.com/acme/checkout/blob/main/src/session.ts")
    expect(ref).not.toBeNull()

    const contents = mockGithubFile(ref!)

    expect(contents).toContain("github.com/acme/checkout")
    expect(contents).toContain("src/session.ts")
    expect(contents).toContain("export function session(")
  })
})
