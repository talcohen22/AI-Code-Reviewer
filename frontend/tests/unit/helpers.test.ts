import { describe, expect, it } from "vitest"

import {
  cls,
  fileBaseName,
  fileName,
  languageFromPath,
  lineCount,
  parseGithubUrl,
  timeAgo,
} from "../../src/lib/helpers"

describe("cls", () => {
  it("joins the truthy parts only", () => {
    expect(cls("a", false, undefined, "b", null, "")).toBe("a b")
  })
})

describe("timeAgo", () => {
  const now = new Date("2026-08-24T12:00:00.000Z")

  it("reports anything under a minute as just now", () => {
    expect(timeAgo("2026-08-24T11:59:31.000Z", now)).toBe("just now")
  })

  it("reports minutes, hours and days", () => {
    expect(timeAgo("2026-08-24T11:56:00.000Z", now)).toBe("4m ago")
    expect(timeAgo("2026-08-24T09:00:00.000Z", now)).toBe("3h ago")
    expect(timeAgo("2026-08-22T12:00:00.000Z", now)).toBe("2d ago")
  })

  it("falls back to unknown for an unparseable timestamp", () => {
    expect(timeAgo("not-a-date", now)).toBe("unknown")
  })
})

describe("parseGithubUrl", () => {
  it("parses a blob file link into owner, repo, branch and path", () => {
    expect(parseGithubUrl("https://github.com/acme/checkout/blob/main/src/session.ts")).toEqual({
      owner: "acme",
      repo: "checkout",
      branch: "main",
      path: "src/session.ts",
    })
  })

  it("accepts the link without a scheme and with surrounding whitespace", () => {
    expect(parseGithubUrl("  github.com/acme/checkout/blob/main/index.ts  ")).toEqual({
      owner: "acme",
      repo: "checkout",
      branch: "main",
      path: "index.ts",
    })
  })

  it.each([
    ["another host", "https://gitlab.com/acme/checkout/blob/main/src/session.ts"],
    ["a repo root", "https://github.com/acme/checkout"],
    ["a tree link", "https://github.com/acme/checkout/tree/main/src"],
    ["a path with no file", "https://github.com/acme/checkout/blob/main/src"],
    ["free text", "please review my code"],
    ["an empty string", ""],
  ])("rejects %s", (_label, url) => {
    expect(parseGithubUrl(url)).toBeNull()
  })
})

describe("path helpers", () => {
  it("reads the file name and base name out of a path", () => {
    expect(fileName("src/lib/format-date.ts")).toBe("format-date.ts")
    expect(fileBaseName("src/lib/format-date.ts")).toBe("format-date")
  })

  it("maps an extension to a Monaco language and defaults to TypeScript", () => {
    expect(languageFromPath("src/app.py")).toBe("python")
    expect(languageFromPath("src/app.tsx")).toBe("typescript")
    expect(languageFromPath("Makefile")).toBe("typescript")
  })
})

describe("lineCount", () => {
  it("counts lines, treating empty input as zero", () => {
    expect(lineCount("")).toBe(0)
    expect(lineCount("one")).toBe(1)
    expect(lineCount("one\ntwo\n")).toBe(3)
  })
})
