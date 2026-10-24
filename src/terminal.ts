import { constants } from "node:os"
import { styleText } from "node:util"

import { GroupMultiSelectPrompt } from "@clack/core"
import block from "cfonts/fonts/block.json" with { type: "json" }
import terminalLink from "terminal-link"

import { pmName, windows } from "./tools"

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
export const menuText = menus[/^zh(?:[-_]|$)/i.test(locale) ? "zh" : "en"]

export function groupName(group: string) {
  const names: Record<string, string> = {
    Basics: menuText.basics,
    Database: menuText.database,
    Others: menuText.others,
    AI: menuText.ai
  }
  return names[group] ?? group
}

const links: Record<string, string> = {
  Homebrew: "https://brew.sh",
  Git: "https://git-scm.com",
  "GitHub CLI": "https://cli.github.com",
  "GitLab CLI": "https://gitlab.com/gitlab-org/cli",
  Scoop: "https://scoop.sh",
  uv: "https://astral.sh/uv",
  Python: "https://www.python.org",
  Ruff: "https://astral.sh/ruff",
  ty: "https://github.com/astral-sh/ty",
  Fabric: "https://www.fabfile.org",
  Bun: "https://bun.sh",
  Rust: "https://www.rust-lang.org",
  Flutter: "https://flutter.dev",
  Maestro: "https://maestro.dev",
  fastlane: "https://fastlane.tools",
  zoxide: "https://github.com/ajeetdsouza/zoxide",
  fzf: "https://github.com/junegunn/fzf",
  MySQL: "https://www.mysql.com",
  Redis: "https://redis.io",
  XcodeGen: "https://github.com/yonaskolb/XcodeGen",
  Baguette: "https://github.com/tddworks/baguette",
  SwiftLint: "https://github.com/realm/SwiftLint",
  ktlint: "https://github.com/pinterest/ktlint",
  "Android CLI": "https://developer.android.com/tools/agents/android-cli",
  Codex: "https://github.com/openai/codex",
  "Claude Code": "https://claude.com/claude-code",
  Tauri: "https://tauri.app"
}

export function link(text: string) {
  const url = links[text]
  return url ? terminalLink(styleText(["underline", "cyan"], text), url, { fallback: () => text }) : text
}

function shell(command: string) {
  return windows
    ? [
        Bun.which("pwsh") ?? "powershell",
        "-NoProfile",
        "-Command",
        `$ErrorActionPreference = 'Stop'; $env:Path += ';' + [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User'); ${command}; if ($LASTEXITCODE) { exit $LASTEXITCODE }`
      ]
    : ["sh", "-c", command]
}

function env() {
  return { ...process.env, HOMEBREW_NO_ASK: "1" }
}

export async function output(command: string, timeout = 10_000) {
  const child = Bun.spawn(shell(command), {
    env: env(),
    stdout: "pipe",
    stderr: "pipe",
    timeout,
    killSignal: "SIGKILL"
  })
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited
  ])
  if (exitCode === 0 && !child.signalCode) return (stdout + stderr).trim()
}

export class CommandError extends Error {
  constructor(
    command: string,
    readonly exitCode: number
  ) {
    super(`Command failed (${exitCode}): ${command}`)
  }
}

export function run(command: string, allowFailure = false) {
  console.log(styleText("bold", command))
  if (process.env.FREE_DRY_RUN) return
  const child = Bun.spawnSync(shell(command), { env: env(), stdin: "inherit", stdout: "inherit", stderr: "inherit" })
  const signal = typeof child.signalCode === "string" ? constants.signals[child.signalCode] : child.signalCode
  const exitCode = signal ? 128 + signal : (child.exitCode ?? 1)
  if (exitCode !== 0 && (signal || exitCode === 130 || !allowFailure)) throw new CommandError(command, exitCode)
}

const linkPattern = new RegExp(
  `\\b(?:${Object.keys(links)
    .sort((a, b) => b.length - a.length)
    .map(RegExp.escape)
    .join("|")})\\b`,
  "g"
)

export function hint(operation: "upgrade" | "clean" | "install", message: string) {
  const { label, color } = (
    {
      upgrade: { label: menuText.upgrade, color: "bgBlue" },
      clean: { label: menuText.cleanup, color: "bgYellow" },
      install: { label: menuText.install, color: "bgGreen" }
    } as const
  )[operation]
  const linked = message.replace(linkPattern, (name) => link(name))
  console.log(styleText(color, label), linked)
}

export function banner(version: string) {
  if (!process.stdout.isTTY && !process.env.FORCE_COLOR) return ""
  const chars: Record<string, string[]> = block.chars
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

type Item = { name: string; version?: string }
type Option = { value: string; label: string; hint?: string }

const symbols = {
  initial: "◆",
  active: "◆",
  validating: "◆",
  error: "▲",
  submit: "◇",
  cancel: "■"
} as const

export function pick(message: string, groups: Record<string, Item[]>) {
  const width = Math.max(...Object.values(groups).flatMap((items) => items.map((item) => item.name.length)))
  const options = Object.fromEntries(
    Object.entries(groups).map(([group, items]) => [
      group,
      items.map((item) => ({ value: item.name, label: item.name, hint: item.version }))
    ])
  )
  return new GroupMultiSelectPrompt<Option>({
    options,
    required: false,
    selectableGroups: false,
    render() {
      const head = `${styleText("cyan", symbols[this.state])}  ${message}\n`
      const chosen = this.value ?? []
      if (this.state === "submit" || this.state === "cancel") {
        return `${head}${styleText("gray", "│")}  ${styleText("dim", chosen.join(", "))}`
      }
      const bar = styleText("cyan", "│")
      const lines = this.options.map((option, index) => {
        const label = option.label
        if (option.group === true) return `${bar}  ${styleText("bold", label)}`
        const active = index === this.cursor
        const selected = chosen.includes(option.value)
        const box = selected ? styleText("green", "◼") : styleText(active ? "cyan" : "dim", "◻")
        const current = option.hint ? `${" ".repeat(width - label.length + 2)}${styleText("dim", option.hint)}` : ""
        return `${bar}    ${box} ${active ? label : styleText("dim", label)}${current}`
      })
      return `${head}${lines.join("\n")}\n${styleText("cyan", "└")}\n`
    }
  }).prompt()
}
