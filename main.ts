#!/usr/bin/env bun
import { chmodSync, existsSync, renameSync, unlinkSync } from "node:fs"
import { styleText } from "node:util"

import * as p from "@clack/prompts"
import { Command } from "commander"

import { link, links } from "./links"

const version = "0.1.4"
const pm = process.platform === "win32" ? "scoop" : "brew"
const menus = {
  zh: {
    choose: "选择操作",
    setup: "安装 Homebrew、GitHub CLI、Bun、uv、Python、Ruff、ty、Rust，再按项目类型安装所需工具",
    profile: "要开发什么",
    cleanup: "清理",
    install: "安装",
    upgrade: "升级",
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
    missing: "未安装",
    unknown: "未知工具",
    exitCode: "退出码"
  },
  en: {
    choose: "Choose an action",
    setup: "Install Homebrew, GitHub CLI, Bun, uv, Python, Ruff, ty and Rust, then what each project type needs",
    profile: "What will you build",
    cleanup: "Clean",
    install: "Install",
    upgrade: "Upgrade",
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
    missing: "not installed",
    unknown: "unknown tool",
    exitCode: "exit code"
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
const home = process.env.HOME ?? process.env.USERPROFILE ?? "~"
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
          },
      { name: "GitHub CLI", version: "gh --version", brew: ["brew install gh"], scoop: ["scoop install gh"] }
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
        scoop: ['powershell -c "irm bun.sh/install.ps1 | iex"'],
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
        scoop: ['powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"'],
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
const base = [pm === "brew" ? "Homebrew" : "Scoop", "GitHub CLI", "Bun", "uv", "Python", "Ruff", "ty", "Rust"]
const profiles: Record<string, string[]> = Object.fromEntries(
  groups
    .slice(1)
    .map(([group, tools]): [string, string[]] => [
      group,
      tools.map((tool) => tool.name).filter((name) => !base.includes(name))
    ])
    .filter(([, names]) => names.length > 0)
)

async function versionOf(tool: Tool) {
  if (!Bun.which(tool.version.split(" ")[0])) return
  const out = await output(tool.version)
  const versions =
    tool.name === "Python"
      ? [...out.matchAll(/cpython-(\d+\.\d+\.\d+)/g)].map((m) => m[1])
      : [out.match(/\d+(\.\d+)+/)?.[0] ?? out.split("\n")[0]]
  return [...new Set(versions)].join(", ")
}

async function setup(extra: string[] = []) {
  let chosen = extra.map((name) => {
    const key = Object.keys(profiles).find((key) => key.toLowerCase() === name.toLowerCase())
    if (!key) throw new Error(`${menuText.unknown}: ${name}`)
    return key
  })
  if (chosen.length === 0 && process.stdin.isTTY) {
    const picked = await p.multiselect({
      message: menuText.profile,
      withGuide: false,
      required: false,
      showInstructions: false,
      options: Object.entries(profiles).map(([name, names]) => ({ value: name, label: name, hint: names.join(", ") }))
    })
    if (p.isCancel(picked)) return
    chosen = picked
  }
  const installed = installTools([...base, ...chosen.flatMap((name) => profiles[name])])
  await list(installed)
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
  const options = Object.fromEntries(
    groups.map(([group, tools]) => [
      group,
      tools.map((tool) => ({ value: tool.name, label: tool.name, hint: versions.get(tool) ?? menuText.missing }))
    ])
  )
  const names = await p.groupMultiselect({
    message: menuText.install,
    withGuide: false,
    required: false,
    selectableGroups: false,
    showInstructions: false,
    options
  })
  if (p.isCancel(names) || names.length === 0) return
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
  hint("upgrade", menuText.done)
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

function shell(command: string) {
  return process.platform === "win32"
    ? [
        "powershell.exe",
        "-NoProfile",
        "-Command",
        `$ErrorActionPreference = 'Stop'; $env:Path += ';' + [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User'); ${command}; if ($LASTEXITCODE) { exit $LASTEXITCODE }`
      ]
    : ["sh", "-c", command]
}

function env() {
  const env: Record<string, string | undefined> = { ...process.env, HOMEBREW_NO_ASK: "1" }
  if (process.platform === "win32") delete env.PSModulePath
  return env
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
  if (child.signalCode === "SIGINT" || child.exitCode === 130) {
    process.exit(130)
  }
  if (child.exitCode !== 0 && !allowFailure) {
    throw new Error(`${command} · ${menuText.exitCode} ${child.exitCode}`)
  }
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

async function menu() {
  const action = await p.select({
    message: menuText.choose,
    withGuide: false,
    showInstructions: false,
    options: [
      { value: "setup", label: menuText.setup },
      { value: "cleanup", label: menuText.cleanup },
      { value: "install", label: menuText.install },
      { value: "upgrade", label: menuText.upgrade },
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
  .action(menu)
app.command("setup [tools...]").description(menuText.setup).action(setup)
app.command("cleanup").alias("clean").description(menuText.cleanup).action(cleanup)
app.command("install").description(menuText.install).action(install)
app.command("upgrade").alias("u").description(menuText.upgrade).action(upgrade)
app
  .command("list")
  .alias("ls")
  .description(menuText.list)
  .action(() => list())
app.command("self-update").description(menuText.selfUpdate).action(selfUpdate)
if (process.platform === "win32" && existsSync(`${process.execPath}.old`)) unlinkSync(`${process.execPath}.old`)
try {
  await app.parseAsync()
} catch (error) {
  p.log.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
