import { generateReview } from "../../../src/mock/seed"
import type { Review } from "../../../src/types/review"

/**
 * One snippet that trips at least one rule in every category and declares two
 * functions, so a single fixture exercises grouping, filtering and generated
 * tests. Reviews are pinned to a fixed `now` to keep ids and timestamps stable.
 */
export const SAMPLE_CODE = [
  `var cache = {}`,
  ``,
  `export function loadUser(id) {`,
  `  console.log("loading", id)`,
  `  if (id == null) {`,
  `    return null`,
  `  }`,
  `  const apiKey = "live_abc123456"`,
  `  return eval("cache[" + id + "]")`,
  `}`,
  ``,
  `export function saveUser(raw) {`,
  `  try {`,
  `    return JSON.parse(raw)`,
  `  } catch (error) {}`,
  `}`,
  ``,
  `const ids = [1, 2, 3]`,
  `for (var index = 0; index < ids.length; index++) {`,
  `  loadUser(ids[index])`,
  `}`,
  ``,
].join("\n")

export const CLEAN_CODE = [
  `export function add(left: number, right: number): number {`,
  `  return left + right`,
  `}`,
  ``,
].join("\n")

export function buildPastedReview(now = new Date("2026-08-24T12:00:00.000Z")): Review {
  return generateReview(
    { source: "paste", code: SAMPLE_CODE, file: "snippet.ts", language: "typescript" },
    now,
  )
}

export function buildGithubReview(now = new Date("2026-08-24T13:00:00.000Z")): Review {
  return generateReview(
    {
      source: "github",
      code: SAMPLE_CODE,
      file: "src/session.ts",
      language: "typescript",
      githubUrl: "https://github.com/acme/checkout/blob/main/src/session.ts",
    },
    now,
  )
}
