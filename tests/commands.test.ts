import { describe, expect, setDefaultTimeout, test } from "bun:test"

import { latestAndroidPackages } from "../src/tools"

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
  test(`顺序：${pmName} → Git → GitHub CLI → GitLab CLI → Bun → uv → Python → Ruff → ty → Rust → Tauri Hasgard`, () => {
    const lines = commands("setup")
    const expected = windows
      ? [
          'iex "& {$(irm get.scoop.sh)} -RunAsAdmin"',
          "scoop install git",
          "scoop install gh",
          "scoop install glab",
          "scoop install bun",
          "irm https://astral.sh/uv/install.ps1 | iex",
          "uv python install",
          "uv tool install ruff",
          "uv tool install ty",
          String.raw`irm https://win.rustup.rs/x86_64 -OutFile $env:TEMP\rustup-init.exe; & $env:TEMP\rustup-init.exe -y`,
          "if (-not (scoop bucket list | Where-Object Name -eq 'nyssance')) { scoop bucket add nyssance https://github.com/nyssance/scoop-bucket }",
          "scoop install nyssance/tauri-hasgard"
        ]
      : [
          '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
          "brew install gh",
          "brew install glab",
          "brew install bun",
          "curl -LsSf https://astral.sh/uv/install.sh | sh",
          "uv python install",
          "uv tool install ruff",
          "uv tool install ty",
          "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y",
          "brew tap nyssance/tap",
          "brew trust --formula nyssance/tap/tauri-hasgard",
          "brew install tauri-hasgard"
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
    const pmUpgrade = index(windows ? "scoop update --all" : "brew upgrade --greedy")
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
    // The uninstall line appears only when uv manages more than one Python version.
    const rest = lines.filter((line) => !/^uv python uninstall '<\d+\.\d+\.\d+'$/.test(line))
    expect(rest).toEqual([...expected, "uv cache prune"])
  })
})

describe("Android SDK", () => {
  test("picks the newest stable platform, build tools and NDK", () => {
    const list = `Installed packages:
  platforms/android-37.2      2.0.0   Android SDK Platform 37.2
Available packages:
  build-tools/9.0.0           9.0.0   Android SDK Build-Tools 9
  build-tools/37.0.0          37.0.0  Android SDK Build-Tools 37
  build-tools/38.0.0-rc1      38.0.0  Android SDK Build-Tools 38-rc1
  ndk/28.2.13676358           28.2    NDK (Side by side) 28.2.13676358
  ndk/30.0.16248370           30.0    NDK (Side by side) 30.0.16248370
  platforms/android-37        2.0.0   Android SDK Platform 37
  platforms/android-36        2.0.0   Android SDK Platform 36
  platforms/android-37.2      2.0.0   Android SDK Platform 37.2`
    expect(latestAndroidPackages(list)).toEqual(["platforms/android-37.2", "build-tools/37.0.0", "ndk/30.0.16248370"])
  })
})
