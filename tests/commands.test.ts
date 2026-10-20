import { describe, expect, test } from "bun:test"

const windows = process.platform === "win32"
const pm = windows ? "scoop" : "brew"

function commands(...args: string[]) {
  const { stdout, exitCode } = Bun.spawnSync(["bun", "main.ts", ...args], {
    env: { ...process.env, FREE_DRY_RUN: "1", LANG: "zh_CN.UTF-8" }
  })
  expect(exitCode).toBe(0)
  return stdout
    .toString()
    .split("\n")
    .map((line) => Bun.stripANSI(line))
    .filter((line) => /^[a-z/$]/i.test(line) && !/^(Free|HTTP|https:)/.test(line))
}

describe("setup", () => {
  test("顺序：包管理器 → uv → Python → Ruff → ty", () => {
    const lines = commands("setup")
    const expected = windows
      ? [
          'Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force; iex "& {$(irm get.scoop.sh)} -RunAsAdmin"',
          'powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"'
        ]
      : [
          '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
          "curl -LsSf https://astral.sh/uv/install.sh | sh"
        ]
    expect(lines.slice(0, 5)).toEqual([...expected, "uv python install", "uv tool install ruff", "uv tool install ty"])
  })
})

describe("upgrade", () => {
  test("顺序：包管理器 → uv → Rust → 清理", () => {
    const lines = commands("upgrade")
    const index = (command: string) => {
      const i = lines.indexOf(command)
      expect(i, command).toBeGreaterThanOrEqual(0)
      return i
    }
    const pmUpgrade = index(windows ? "scoop update --all" : "brew upgrade")
    expect(pmUpgrade).toBeLessThan(index("uv self update"))
    expect(index("uv self update")).toBeLessThan(index("uv python upgrade"))
    expect(index("uv python upgrade")).toBeLessThan(index("uv tool upgrade --all"))
    expect(index("uv tool upgrade --all")).toBeLessThan(index("rustup update"))
    expect(index("rustup update")).toBeLessThan(index(windows ? "scoop cleanup --all" : "brew cleanup"))
    if (!windows) expect(index("brew update")).toBeLessThan(pmUpgrade)
  })
})

describe("cleanup", () => {
  test(`${pm} 清理后清理 uv`, () => {
    const lines = commands("cleanup")
    const expected = windows ? ["scoop cleanup --all", "scoop checkup"] : ["brew cleanup", "brew vulns", "brew doctor"]
    expect(lines).toEqual([...expected, "uv cache prune"])
  })
})
