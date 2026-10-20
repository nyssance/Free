import { describe, expect, setDefaultTimeout, test } from "bun:test"

setDefaultTimeout(60_000)

const windows = process.platform === "win32"
const pmName = windows ? "Scoop" : "Homebrew"

function commands(...args: string[]) {
  const { stdout, exitCode } = Bun.spawnSync(["bun", "main.ts", ...args], {
    env: { ...process.env, FREE_DRY_RUN: "1", LC_ALL: "zh_CN.UTF-8", LANG: "zh_CN.UTF-8" }
  })
  expect(exitCode).toBe(0)
  return stdout
    .toString()
    .split("\n")
    .map((line) => Bun.stripANSI(line))
    .filter((line) => /^[a-z/$]/i.test(line) && !/^(Free|HTTP|https:)/.test(line))
}

describe("setup", () => {
  test(`顺序：${pmName} → Bun → uv → Python → Ruff → ty → Rust`, () => {
    const lines = commands("setup")
    const expected = windows
      ? [
          'Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force; iex "& {$(irm get.scoop.sh)} -RunAsAdmin"',
          'powershell -c "irm bun.sh/install.ps1 | iex"',
          'powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"',
          "uv python install",
          "uv tool install ruff",
          "uv tool install ty",
          "irm https://win.rustup.rs/x86_64 -OutFile $env:TEMP\\rustup-init.exe; & $env:TEMP\\rustup-init.exe -y"
        ]
      : [
          '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
          "brew install bun",
          "curl -LsSf https://astral.sh/uv/install.sh | sh",
          "uv python install",
          "uv tool install ruff",
          "uv tool install ty",
          "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y"
        ]
    expect(lines).toEqual(expected)
  })
})

describe("upgrade", () => {
  test(`顺序：${pmName} → uv → Rust → 清理`, () => {
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
  test(`${pmName} 清理后清理 uv`, () => {
    const lines = commands("cleanup")
    const expected = windows ? ["scoop cleanup --all"] : ["brew cleanup"]
    expect(lines).toEqual([...expected, "uv cache prune"])
  })
})
