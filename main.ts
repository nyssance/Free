#!/usr/bin/env bun
import { chmodSync, renameSync, rmSync } from "node:fs"
import { styleText } from "node:util"

import * as p from "@clack/prompts"
import block from "cfonts/fonts/block.json"
import { Command } from "commander"
import terminalLink from "terminal-link"

import { link, links } from "./links"
import { pick } from "./menu"

let version = "0.1.16"
const pm = process.platform === "win32" ? "scoop" : "brew"
const pmName = pm === "brew" ? "Homebrew" : "Scoop"
const menus = {
  zh: {
    choose: "选择操作",
    setup: `安装 ${pmName}、Git、GitHub CLI、GitLab CLI、Bun、uv、Python、Ruff、ty、Rust`,
    cleanup: "清理",
    install: "安装",
    upgrade: "升级",
    winget: "升级 winget 软件",
    listUpgrades: "查看",
    upgradeAll: "全部升级",
    list: "已安装的工具",
    selfUpdate: "更新 free 自己",
    exit: "退出",
    basics: "基础",
    database: "数据库",
    others: "其他",
    ai: "AI",
    description: "一条命令装好开发环境",
    version: "显示版本号",
    help: "显示帮助",
    latest: "已是最新",
    sourceRun: "当前从源码运行，不替换文件",
    done: "完成",
    missing: "未安装"
  },
  en: {
    choose: "Choose an action",
    setup: `Install ${pmName}, Git, GitHub CLI, GitLab CLI, Bun, uv, Python, Ruff, ty and Rust`,
    cleanup: "Clean",
    install: "Install",
    upgrade: "Upgrade",
    winget: "Upgrade winget packages",
    listUpgrades: "List",
    upgradeAll: "Upgrade all",
    list: "Installed tools",
    selfUpdate: "Update free itself",
    exit: "Exit",
    basics: "Basics",
    database: "Database",
    others: "Others",
    ai: "AI",
    description: "Set up a development environment in one command",
    version: "Show version",
    help: "Show help",
    latest: "is up to date",
    sourceRun: "Running from source, nothing replaced",
    done: "done",
    missing: "not installed"
  }
}
const locale =
  process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || Intl.DateTimeFormat().resolvedOptions().locale
const menuText = menus[/^zh(?:[-_]|$)/i.test(locale) ? "zh" : "en"]

type Tool = {
  name: string
  version: string
  brew: string[]
  scoop: string[]
  path?: string
}
const home = process.env.HOME ?? process.env.USERPROFILE
const androidSdk =
  "android sdk install platform-tools emulator platforms/android-37.2 build-tools/37.0.0 ndk/30.0.16248370"
const groups: [group: string, tools: Tool[]][] = [
  [
    menuText.basics,
    [
      pm === "brew"
        ? {
            name: "Homebrew",
            version: "brew --version",
            brew: ['/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'],
            scoop: [],
            path: "/opt/homebrew/bin:/usr/local/bin"
          }
        : {
            name: "Scoop",
            version: "scoop --version",
            brew: [],
            scoop: [
              'Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force; iex "& {$(irm get.scoop.sh)} -RunAsAdmin"'
            ],
            path: `${home}\\scoop\\shims`
          }
    ]
  ],
  [
    "Git",
    [
      { name: "Git", version: "git --version", brew: [], scoop: ["scoop install git"] },
      { name: "GitHub CLI", version: "gh --version", brew: ["brew install gh"], scoop: ["scoop install gh"] },
      { name: "GitLab CLI", version: "glab --version", brew: ["brew install glab"], scoop: ["scoop install glab"] }
    ]
  ],
  [
    "Android",
    [
      {
        name: "Android CLI",
        version: "android --version",
        brew: ["brew tap android/tap", "brew install android-cli", androidSdk],
        scoop: ["winget install --id Google.AndroidCLI --exact", androidSdk]
      },
      { name: "ktlint", version: "ktlint --version", brew: ["brew install ktlint"], scoop: ["scoop install ktlint"] }
    ]
  ],
  ...(process.platform === "darwin"
    ? ([
        [
          "iOS / macOS",
          [
            { name: "XcodeGen", version: "xcodegen --version", brew: ["brew install xcodegen"], scoop: [] },
            { name: "Baguette", version: "baguette --version", brew: ["brew install baguette"], scoop: [] },
            { name: "SwiftLint", version: "swiftlint --version", brew: ["brew install swiftlint"], scoop: [] }
          ]
        ]
      ] as [string, Tool[]][])
    : []),
  [
    "Flutter",
    [
      {
        name: "Flutter",
        version: "flutter --version",
        brew: ["brew install --cask flutter"],
        scoop: ["scoop bucket add extras", "scoop install extras/flutter"]
      },
      {
        name: "Maestro",
        version: "maestro --version",
        brew: [
          "brew tap mobile-dev-inc/tap",
          "brew trust --formula mobile-dev-inc/tap/maestro",
          "brew install mobile-dev-inc/tap/maestro"
        ],
        scoop: ["scoop bucket add java", "scoop install java/openjdk maestro"]
      }
    ]
  ],
  [
    "JavaScript & TypeScript",
    [
      {
        name: "Bun",
        version: "bun --version",
        brew: ["brew install bun"],
        scoop: ["irm bun.sh/install.ps1 | iex"],
        path: process.platform === "win32" ? `${home}\\.bun\\bin` : undefined
      }
    ]
  ],
  [
    "Python",
    [
      {
        name: "uv",
        version: "uv --version",
        brew: ["curl -LsSf https://astral.sh/uv/install.sh | sh"],
        scoop: ["irm https://astral.sh/uv/install.ps1 | iex"],
        path: `${home}/.local/bin`
      },
      {
        name: "Python",
        version: "uv python list --only-installed",
        brew: ["uv python install"],
        scoop: ["uv python install"]
      },
      { name: "Ruff", version: "ruff --version", brew: ["uv tool install ruff"], scoop: ["uv tool install ruff"] },
      { name: "ty", version: "ty --version", brew: ["uv tool install ty"], scoop: ["uv tool install ty"] },
      {
        name: "Fabric",
        version: "fab --version",
        brew: ["uv tool install fabric --with InquirerPy --with rich"],
        scoop: ["uv tool install fabric --with InquirerPy --with rich"]
      }
    ]
  ],
  [
    "Rust",
    [
      {
        name: "Rust",
        version: "rustc --version",
        brew: ["curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y"],
        scoop: [
          "irm https://win.rustup.rs/x86_64 -OutFile $env:TEMP\\rustup-init.exe; & $env:TEMP\\rustup-init.exe -y"
        ],
        path: `${home}/.cargo/bin`
      }
    ]
  ],
  [
    menuText.database,
    [
      { name: "MySQL", version: "mysql --version", brew: ["brew install mysql"], scoop: ["scoop install mysql"] },
      { name: "Redis", version: "redis-server --version", brew: ["brew install redis"], scoop: ["scoop install redis"] }
    ]
  ],
  [
    menuText.others,
    [
      {
        name: "fastlane",
        version: "fastlane --version",
        brew: ["brew install fastlane"],
        scoop: ["scoop install ruby", "gem install fastlane"]
      },
      {
        name: "zoxide",
        version: "zoxide --version",
        brew: ["brew install zoxide fzf"],
        scoop: ["scoop install zoxide fzf"]
      }
    ]
  ],
  [
    menuText.ai,
    [
      {
        name: "Codex",
        version: "codex --version",
        brew: ["brew install codex"],
        scoop: ["bun install -g @openai/codex"]
      },
      {
        name: "Claude Code",
        version: "claude --version",
        brew: ["brew install --cask claude-code"],
        scoop: ["irm https://claude.ai/install.ps1 | iex"]
      }
    ]
  ]
]
const tools = groups.flatMap(([, tools]) => tools)
const base = [pmName, "Git", "GitHub CLI", "GitLab CLI", "Bun", "uv", "Python", "Ruff", "ty", "Rust"]

async function versionOf(tool: Tool) {
  if (!Bun.which(tool.version.split(" ")[0])) return
  const out = await output(tool.version)
  const versions =
    tool.name === "Python"
      ? [...out.matchAll(/cpython-(\d+\.\d+\.\d+)/g)].map((m) => m[1])
      : [out.match(/\d+(\.\d+)+/)?.[0] ?? out.split("\n")[0]]
  return [...new Set(versions)].join(", ")
}

async function setup() {
  console.log(banner())
  await list(installTools(base))
}

function cleanup() {
  switch (pm) {
    case "brew":
      hint("clean", "Homebrew")
      run("brew cleanup")
      break
    case "scoop":
      hint("clean", "Scoop")
      run("scoop cleanup --all")
      break
  }
  hint("clean", "uv")
  run("uv cache prune")
}

async function install() {
  const versions = await versionsOf(tools)
  const names = await pick(
    menuText.install,
    Object.fromEntries(
      groups.map(([group, tools]) => [group, tools.map((tool) => ({ name: tool.name, version: versions.get(tool) }))])
    )
  )
  if (p.isCancel(names) || !names) return
  const installed = installTools(names)
  if (installed.some((name) => !base.includes(name))) cleanup()
}

function installTools(names: string[]) {
  const selected = tools.filter((tool) => names.includes(tool.name))
  for (const tool of selected) {
    hint("install", tool.name)
    for (const command of tool[pm]) run(command)
    if (tool.path) process.env.PATH = `${tool.path}${process.platform === "win32" ? ";" : ":"}${process.env.PATH}`
  }
  return selected.map((tool) => tool.name)
}

async function upgrade() {
  await selfUpdate().catch((error) => p.log.warn(Bun.inspect(error)))
  switch (pm) {
    case "brew":
      hint("upgrade", "Homebrew")
      run("brew update", true)
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
  hint("upgrade", menuText.done)
}

async function winget() {
  const command = await p.select({
    message: "winget",
    withGuide: false,
    showInstructions: false,
    options: [
      { value: "winget upgrade", label: menuText.listUpgrades },
      { value: "winget upgrade --all", label: menuText.upgradeAll }
    ]
  })
  if (p.isCancel(command)) return
  hint("upgrade", "winget")
  run(command)
}

async function versionsOf(tools: Tool[]) {
  const versions = await Promise.all(tools.map(versionOf))
  return new Map(tools.map((tool, i) => [tool, versions[i]]))
}

async function list(names?: string[]) {
  p.intro(`Free ${version} · ${menuText.list}`)
  const versions = await versionsOf(tools.filter((tool) => !names || names.includes(tool.name)))
  const width = Math.max(...tools.map((tool) => tool.name.length))
  const pad = (name: string) => " ".repeat(width - name.length + 2)
  const lines = groups.flatMap(([group, tools]) => {
    const shown = tools.filter((tool) => !names || names.includes(tool.name))
    if (shown.length === 0) return []
    return [
      styleText("bold", group),
      ...shown.map(
        (tool) => `  ${link(tool.name)}${pad(tool.name)}${versions.get(tool) ?? styleText("dim", menuText.missing)}`
      )
    ]
  })
  p.log.message(lines.join("\n"))
  p.outro()
}

async function selfUpdate() {
  const repo = "nyssance/Free"
  hint("upgrade", "free")
  if (process.env.FREE_DRY_RUN) return
  const latestUrl = `https://github.com/${repo}/releases/latest`
  const release = await fetch(latestUrl, { redirect: "manual" })
  const tag = release.headers.get("location")?.split("/tag/")[1]
  if (!tag) throw new Error(`${latestUrl} ${release.status} ${release.statusText}`)
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
  const url = `https://github.com/${repo}/releases/download/${tag}/${asset}.gz`
  const download = await fetch(url)
  if (!download.ok || !download.body) throw new Error(`${url} ${download.status} ${download.statusText}`)
  const total = Number(download.headers.get("content-length"))
  const mb = (bytes: number) => (bytes / 1048576).toFixed(1)
  const bar = p.progress({ style: "block", max: total, size: 30 })
  bar.start(`${tag} · ${mb(total)} MB`)
  const exe = process.execPath
  let received = 0
  const counted = new TransformStream({
    transform(chunk: Uint8Array, controller) {
      received += chunk.byteLength
      bar.advance(chunk.byteLength, `${tag} · ${mb(received)} / ${mb(total)} MB`)
      controller.enqueue(chunk)
    }
  })
  try {
    await Bun.write(
      `${exe}.new`,
      new Response(download.body.pipeThrough(counted).pipeThrough(new DecompressionStream("gzip")))
    )
  } catch (error) {
    bar.error(tag)
    rmSync(`${exe}.new`, { force: true })
    throw error
  }
  bar.stop(`${tag} · ${mb(total)} MB`)
  if (process.platform === "win32") renameSync(exe, `${exe}.old`)
  else chmodSync(`${exe}.new`, 0o755)
  renameSync(`${exe}.new`, exe)
  p.log.success(`free ${version} → ${latest}`)
  version = latest
  console.log(banner())
}

function shell(command: string) {
  return process.platform === "win32"
    ? [
        "pwsh",
        "-NoProfile",
        "-Command",
        `$ErrorActionPreference = 'Stop'; $env:Path += ';' + [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User'); ${command}; if ($LASTEXITCODE) { exit $LASTEXITCODE }`
      ]
    : ["sh", "-c", command]
}

function env() {
  return { ...process.env, HOMEBREW_NO_ASK: "1" }
}

async function output(command: string) {
  const child = Bun.spawn(shell(command), { env: env(), stdout: "pipe", stderr: "pipe" })
  const [stdout, stderr] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text()])
  return (stdout + stderr).trim()
}

function run(command: string, allowFailure = false) {
  console.log(styleText("bold", command))
  if (process.env.FREE_DRY_RUN) return
  const child = Bun.spawnSync(shell(command), { env: env(), stdin: "inherit", stdout: "inherit", stderr: "inherit" })
  if (child.signalCode === "SIGINT" || child.exitCode === 130) process.exit(130)
  if (child.exitCode !== 0 && !allowFailure) process.exit(child.exitCode ?? 1)
}

function hint(operation: "upgrade" | "clean" | "install", message: string) {
  const { label, color } = (
    {
      upgrade: { label: menuText.upgrade, color: "bgBlue" },
      clean: { label: menuText.cleanup, color: "bgYellow" },
      install: { label: menuText.install, color: "bgGreen" }
    } as const
  )[operation]
  const linked = Object.keys(links)
    .sort((a, b) => b.length - a.length)
    .reduce((text, name) => text.replace(new RegExp(`\\b${name}\\b`, "g"), link(name)), message)
  console.log(styleText(color, label), linked)
}

function banner() {
  if (!process.stdout.isTTY && !process.env.FORCE_COLOR) return ""
  const chars = block.chars as Record<string, string[]>
  const rows = Array.from({ length: block.lines }, (_, row) =>
    [..."FREE"].map((char) => chars[char][row].replace(/<\/?c\d>/g, "")).join(" ")
  )
  const width = Math.max(...rows.map((row) => row.length))
  const [from, to] = [
    [0x22, 0xd3, 0xee],
    [0xa7, 0x8b, 0xfa]
  ]
  const hex = (t: number) =>
    `#${from
      .map((c, i) =>
        Math.round(c + (to[i] - c) * t)
          .toString(16)
          .padStart(2, "0")
      )
      .join("")}` as const
  const art = rows.map(
    (row) => ` ${[...row].map((char, i) => (char === " " ? char : styleText(hex(i / (width - 1)), char))).join("")}`
  )
  const repo = terminalLink(styleText("dim", "github.com/nyssance/Free"), "https://github.com/nyssance/Free", {
    fallback: (text) => text
  })
  return `\n${art.join("\n")}\n ${styleText("dim", `v${version}`)}  ${repo}\n`
}

async function menu() {
  console.log(banner())
  const action = await p.select({
    message: menuText.choose,
    withGuide: false,
    showInstructions: false,
    options: [
      { value: "setup", label: menuText.setup },
      { value: "cleanup", label: menuText.cleanup },
      { value: "install", label: menuText.install },
      { value: "upgrade", label: menuText.upgrade },
      ...(process.platform === "win32" ? [{ value: "winget", label: menuText.winget }] : []),
      { value: "list", label: menuText.list },
      { value: "exit", label: menuText.exit }
    ]
  })
  if (p.isCancel(action)) return
  switch (action) {
    case "setup":
      await setup()
      break
    case "cleanup":
      cleanup()
      break
    case "install":
      await install()
      break
    case "upgrade":
      await upgrade()
      break
    case "winget":
      await winget()
      break
    case "list":
      await list()
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
  .addHelpText("beforeAll", banner)
  .configureOutput({
    getOutHasColors: () => Boolean(process.stdout.isTTY || process.env.FORCE_COLOR) && !process.env.NO_COLOR,
    getErrHasColors: () => Boolean(process.stderr.isTTY || process.env.FORCE_COLOR) && !process.env.NO_COLOR
  })
  .action(menu)
app.command("setup").description(menuText.setup).action(setup)
app.command("cleanup").alias("clean").description(menuText.cleanup).action(cleanup)
app.command("install").description(menuText.install).action(install)
app.command("upgrade").alias("u").description(menuText.upgrade).action(upgrade)
app
  .command("list")
  .alias("ls")
  .description(menuText.list)
  .action(() => list())
if (process.platform === "win32") app.command("winget").description(menuText.winget).action(winget)
app.command("self-update").description(menuText.selfUpdate).action(selfUpdate)
if (process.platform === "win32") rmSync(`${process.execPath}.old`, { force: true })
try {
  await app.parseAsync()
} catch (error) {
  p.log.error(Bun.inspect(error))
  process.exitCode = 1
}
