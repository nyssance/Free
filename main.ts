#!/usr/bin/env bun
import { chmodSync, existsSync, renameSync, unlinkSync } from "node:fs"

import * as p from "@clack/prompts"
import { Command } from "commander"

const version = "0.1.0"
const pm = process.platform === "win32" ? "scoop" : "brew"
const menus = {
  zh: {
    choose: "选择操作",
    cleanup: "清理",
    install: "安装",
    upgrade: "升级",
    diagnose: "检查环境",
    selfUpdate: "更新 free 自己",
    exit: "退出",
    basics: "基础",
    development: "开发",
    database: "数据库",
    others: "其他",
    description: "一条命令装好开发环境",
    version: "显示版本号",
    help: "显示帮助",
    latest: "已是最新",
    sourceRun: "当前从源码运行，不替换文件"
  },
  en: {
    choose: "Choose an action",
    cleanup: "Clean",
    install: "Install",
    upgrade: "Upgrade",
    diagnose: "Check environment",
    selfUpdate: "Update free itself",
    exit: "Exit",
    basics: "Basics",
    development: "Development",
    database: "Database",
    others: "Others",
    description: "Set up a development environment in one command",
    version: "Show version",
    help: "Show help",
    latest: "is up to date",
    sourceRun: "Running from source, nothing replaced"
  }
}
const locale =
  process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || Intl.DateTimeFormat().resolvedOptions().locale
const menuText = menus[/^zh(?:[-_]|$)/i.test(locale) ? "zh" : "en"]

function cleanup() {
  switch (pm) {
    case "brew":
      hint("clean", "Homebrew")
      run("brew cleanup")
      run("brew vulns", true)
      run("brew doctor", true)
      break
    case "scoop":
      hint("clean", "Scoop")
      run("scoop cleanup --all")
      run("scoop checkup")
      break
  }
  hint("clean", "uv")
  run("uv cache prune")
}

async function install() {
  const roles = await p.groupMultiselect({
    message: menuText.install,
    withGuide: false,
    required: false,
    selectableGroups: false,
    showInstructions: false,
    options: {
      [menuText.basics]: [{ value: "pm", label: pm === "brew" ? "Homebrew" : "Scoop" }],
      [menuText.development]: [
        { value: "android", label: "Android" },
        ...(process.platform === "darwin" ? [{ value: "ios", label: "iOS / macOS" }] : []),
        { value: "flutter", label: "Flutter" },
        { value: "js", label: "JavaScript & TypeScript" },
        { value: "python", label: "Python" },
        { value: "rust", label: "Rust" }
      ],
      [menuText.database]: [
        { value: "mysql", label: "MySQL" },
        { value: "redis", label: "Redis" }
      ],
      [menuText.others]: [
        { value: "fastlane", label: "fastlane" },
        { value: "zoxide", label: "zoxide" }
      ]
    }
  })
  if (p.isCancel(roles) || roles.length === 0) return
  const has = (...names: string[]) => names.some((name) => roles.includes(name))
  if (has("pm")) installPackageManager()
  if (has("android", "flutter")) {
    hint("install", "Android CLI, SDK, Emulator, ktlint")
    switch (pm) {
      case "brew":
        run("brew tap android/tap")
        run("brew install android-cli ktlint")
        break
      case "scoop":
        run("winget install --id Google.AndroidCLI --exact")
        run("scoop install ktlint")
        break
    }
    run("android sdk install platform-tools emulator platforms/android-37.2 build-tools/37.0.0 ndk/30.0.16248370")
  }
  if (has("ios") || (has("flutter") && process.platform === "darwin")) {
    hint("install", "XcodeGen, Baguette, SwiftLint")
    run("brew install xcodegen baguette swiftlint")
  }
  if (has("flutter")) {
    hint("install", "Flutter")
    switch (pm) {
      case "brew":
        run("brew install --cask flutter")
        break
      case "scoop":
        run("scoop bucket add extras")
        run("scoop install extras/flutter")
        break
    }
  }
  if (has("android", "ios", "flutter")) {
    hint("install", "Maestro")
    switch (pm) {
      case "brew":
        run("brew tap mobile-dev-inc/tap")
        run("brew trust --formula mobile-dev-inc/tap/maestro")
        run("brew install mobile-dev-inc/tap/maestro")
        break
      case "scoop":
        run("scoop bucket add java")
        run("scoop install java/openjdk maestro")
        break
    }
  }
  if (has("js")) {
    hint("install", "Bun")
    run(`${pm} install bun`)
  }
  if (has("python")) {
    hint("install", "uv, Python, Fabric, Ruff, ty")
    run(
      process.platform === "win32"
        ? 'powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"'
        : "curl -LsSf https://astral.sh/uv/install.sh | sh"
    )
    run("uv python install")
    run("uv tool install fabric --with InquirerPy --with rich")
    run("uv tool install ruff")
    run("uv tool install ty")
  }
  if (has("rust")) {
    hint("install", "Rust")
    run(
      process.platform === "win32"
        ? "Start-Process https://rust-lang.org/tools/install/"
        : "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    )
  }
  if (has("mysql")) {
    hint("install", "MySQL")
    run(`${pm} install mysql`)
  }
  if (has("redis")) {
    hint("install", "Redis")
    run(`${pm} install redis`)
  }
  if (has("fastlane")) {
    hint("install", "fastlane")
    switch (pm) {
      case "brew":
        run("brew install fastlane")
        break
      case "scoop":
        run("scoop install ruby")
        run("gem install fastlane")
        break
    }
  }
  if (has("zoxide")) {
    hint("install", "zoxide fzf")
    run(`${pm} install zoxide fzf`)
  }
  if (roles.some((role) => role !== "pm")) cleanup()
}

async function upgrade() {
  await selfUpdate()
  switch (pm) {
    case "brew":
      hint("upgrade", "Homebrew")
      run("brew update")
      run("brew upgrade")
      break
    case "scoop":
      hint("upgrade", "Scoop")
      run("scoop update --all")
      break
  }
  if (Bun.which("android")) {
    hint("upgrade", "Android SDK")
    run("android sdk update")
  }
  hint("upgrade", "uv/python/tool")
  run("uv self update")
  run("uv python upgrade")
  run("uv tool upgrade --all")
  hint("upgrade", "Rust")
  run("rustup update")
  cleanup()
  if (process.platform === "win32") run("winget upgrade --all")
  hint("upgrade", "完成")
}

function diagnose() {
  p.intro(`Free ${version} · ${menuText.diagnose}`)
  for (const tool of [pm, "uv", "rustup"]) {
    const path = Bun.which(tool)
    if (!path) {
      p.log.warn(`${tool} · 未安装`)
      continue
    }
    p.log.step(`${tool} · ${path}`)
    run(`${tool} --version`, true)
  }
  switch (pm) {
    case "brew":
      run("brew vulns", true)
      run("brew doctor", true)
      break
    case "scoop":
      run("scoop checkup", true)
      break
  }
  p.outro("检查完成，没有执行更新")
}

async function selfUpdate() {
  const repo = "nyssance/Free"
  hint("upgrade", "free")
  const release = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: { Accept: "application/vnd.github+json" }
  })
  if (!release.ok) throw new Error(`GitHub API ${release.status}`)
  const { tag_name: tag } = (await release.json()) as { tag_name: string }
  const latest = tag.replace(/^v/, "")
  if (latest === version) {
    p.log.success(`free ${version} ${menuText.latest}`)
    return
  }
  const compiled = Bun.main.startsWith("/$bunfs/") || Bun.main.includes("~BUN")
  if (!compiled) {
    p.log.warn(`${version} → ${latest} · ${menuText.sourceRun}`)
    return
  }
  const asset = process.platform === "win32" ? "free-windows-x64.exe" : "free-darwin-arm64"
  const url = `https://github.com/${repo}/releases/download/${tag}/${asset}`
  console.log(url)
  const download = await fetch(url)
  if (!download.ok) throw new Error(`HTTP ${download.status}`)
  const exe = process.execPath
  await Bun.write(`${exe}.new`, download)
  if (process.platform === "win32") renameSync(exe, `${exe}.old`)
  else chmodSync(`${exe}.new`, 0o755)
  renameSync(`${exe}.new`, exe)
  p.log.success(`free ${version} → ${latest}`)
}

function installPackageManager() {
  switch (pm) {
    case "brew":
      hint("install", "Homebrew")
      run('/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"')
      process.env.PATH = `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH}`
      break
    case "scoop":
      hint("install", "Scoop")
      run("Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force; irm get.scoop.sh | iex")
      process.env.PATH = `${process.env.USERPROFILE}\\scoop\\shims;${process.env.PATH}`
      break
  }
}

function run(command: string, allowFailure = false) {
  console.log(`\x1b[1m${command}\x1b[0m`)
  const shell =
    process.platform === "win32"
      ? [
          "powershell.exe",
          "-NoProfile",
          "-Command",
          `$ErrorActionPreference = 'Stop'; $env:Path += ';' + [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User'); ${command}; if ($LASTEXITCODE) { exit $LASTEXITCODE }`
        ]
      : ["sh", "-c", command]
  const child = Bun.spawnSync(shell, {
    env: { ...process.env, HOMEBREW_NO_ASK: "1" },
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit"
  })
  if (child.signalCode === "SIGINT" || child.exitCode === 130) {
    process.exit(130)
  }
  if (child.exitCode !== 0 && !allowFailure) {
    throw new Error(`${command}：退出码 ${child.exitCode}`)
  }
}

function hint(operation: "upgrade" | "clean" | "install", message: string) {
  const { label, color } = {
    upgrade: { label: "升级", color: 44 },
    clean: { label: "清理", color: 43 },
    install: { label: "安装", color: 42 }
  }[operation]
  console.log(`\x1b[${color}m${label}\x1b[0m ${message}`)
}

async function menu() {
  const action = await p.select({
    message: menuText.choose,
    withGuide: false,
    showInstructions: false,
    options: [
      { value: "cleanup", label: menuText.cleanup },
      { value: "install", label: menuText.install },
      { value: "upgrade", label: menuText.upgrade },
      { value: "diagnose", label: menuText.diagnose },
      { value: "exit", label: menuText.exit }
    ]
  })
  if (p.isCancel(action)) return
  switch (action) {
    case "cleanup":
      cleanup()
      break
    case "install":
      await install()
      break
    case "upgrade":
      await upgrade()
      break
    case "diagnose":
      diagnose()
      break
    case "exit":
      break
  }
}

const app = new Command()
  .name("free")
  .description(menuText.description)
  .version(version, "-v, --version", menuText.version)
  .helpOption("-h, --help", menuText.help)
  .action(menu)
app.command("cleanup").alias("clean").description(menuText.cleanup).action(cleanup)
app.command("install").description(menuText.install).action(install)
app.command("upgrade").alias("u").description(menuText.upgrade).action(upgrade)
app.command("doctor").description(menuText.diagnose).action(diagnose)
app.command("self-update").description(menuText.selfUpdate).action(selfUpdate)
if (process.platform === "win32" && existsSync(`${process.execPath}.old`)) unlinkSync(`${process.execPath}.old`)
try {
  await app.parseAsync()
} catch (error) {
  p.log.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
