import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs"
import { homedir } from "node:os"
import { basename, dirname, join } from "node:path"
import { styleText } from "node:util"

import * as p from "@clack/prompts"

import { capture, lang, menuText, output } from "./terminal"
import { pm, pmName, windows } from "./tools"

/** Integrity check of the package manager: is this the official Homebrew / Scoop, unmodified, from the official source? */

export type Level = "ok" | "warn" | "fail"
export type Finding = { level: Level; name: string; detail?: string }

const official = windows
  ? { remote: "https://github.com/ScoopInstaller/Scoop", repository: "scoop prefix scoop" }
  : { remote: "https://github.com/Homebrew/brew", repository: "brew --repository" }

const texts = {
  zh: {
    missing: `${pmName} 未安装`,
    noRepo: "找不到安装仓库",
    location: "安装位置",
    locationBad: "PATH 里的命令不是官方安装位置的那个",
    shell: "shell 命令",
    shellBad: "被 alias 或函数劫持",
    shellUnknown: "无法确认是否被 alias",
    remote: "代码来源",
    remoteBad: "非官方源（镜像或被改）",
    gitConfig: "git 配置改写",
    hooks: "自定义 git 钩子",
    tree: "文件改动",
    treeClean: "与官方提交完全一致",
    treeDirty: (n: number) => `${n} 个文件被改动或新增`,
    hidden: "被标记为忽略改动的文件",
    head: "版本",
    headTag: (tag: string) => `正式版本 ${tag}，与 GitHub 一致`,
    headTagBad: (tag: string) => `版本标签 ${tag} 指向的提交与 GitHub 不一致`,
    headBranch: (branch: string) => `与 GitHub ${branch} 最新提交一致`,
    headDev: (branch: string) => `开发版提交，在上次同步的官方 ${branch} 历史内，未能在线核实`,
    headBad: (sha: string) => `提交 ${sha} 不在官方历史中`,
    offline: "无法联网核实版本",
    owner: "文件权限",
    ownerBad: (path: string) => `${path} 可被其他用户写入`,
    ownerOther: (path: string, uid: number) => `${path} 属主是 uid ${uid}`,
    env: "环境变量改写",
    coreTap: "homebrew-core 本地副本",
    ok: `${pmName} 完好，未发现篡改`,
    warn: (n: number) => `${n} 处需要留意`,
    fail: (n: number) => `发现 ${n} 处异常，${pmName} 可能被篡改`,
    stop: `已停止，不在可疑的 ${pmName} 上继续执行。修复：重新运行官方安装脚本，或删除后重装`
  },
  en: {
    missing: `${pmName} is not installed`,
    noRepo: "installation repository not found",
    location: "Location",
    locationBad: "the command on PATH is not the one in the official installation",
    shell: "Shell command",
    shellBad: "hijacked by an alias or function",
    shellUnknown: "could not confirm it is not aliased",
    remote: "Source",
    remoteBad: "unofficial source (mirror or modified)",
    gitConfig: "Git config overrides",
    hooks: "Custom git hooks",
    tree: "File changes",
    treeClean: "identical to the official commit",
    treeDirty: (n: number) => `${n} modified or added file(s)`,
    hidden: "files flagged to hide changes",
    head: "Version",
    headTag: (tag: string) => `release ${tag}, matches GitHub`,
    headTagBad: (tag: string) => `tag ${tag} points to a different commit than GitHub`,
    headBranch: (branch: string) => `matches the latest GitHub ${branch} commit`,
    headDev: (branch: string) =>
      `development commit within the last synced official ${branch} history, not verified online`,
    headBad: (sha: string) => `commit ${sha} is not in the official history`,
    offline: "could not verify the version online",
    owner: "Permissions",
    ownerBad: (path: string) => `${path} is writable by other users`,
    ownerOther: (path: string, uid: number) => `${path} is owned by uid ${uid}`,
    env: "Environment overrides",
    coreTap: "homebrew-core local copy",
    ok: `${pmName} is intact, no tampering found`,
    warn: (n: number) => `${n} item(s) to review`,
    fail: (n: number) => `${n} anomalies, ${pmName} may be tampered with`,
    stop: `Stopped: not continuing on a suspicious ${pmName}. Fix: rerun the official install script, or remove and reinstall`
  }
}
const text = texts[lang]

const git = (repo: string, ...args: string[]) => capture(["git", "-C", repo, ...args])

export const normalizeRemote = (url: string) =>
  url
    .trim()
    .replace(/^git@github\.com:/i, "https://github.com/")
    .replace(/^(?:git|ssh|http):\/\//i, "https://")
    .replace(/\.git$/i, "")
    .replace(/\/+$/, "")
    .toLowerCase()

/** git settings that change where code comes from or run code: anything matching these keys, except Homebrew's own `core.fsmonitor false`. */
export function suspiciousConfig(lines: string) {
  return lines
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !/\bcore\.fsmonitor false$/.test(line))
}
const configPattern = String.raw`^(url\..*\.insteadof|url\..*\.pushinsteadof|https?\.proxy|http\.sslverify|http\.sslcainfo|core\.hookspath|core\.fsmonitor|core\.sshcommand|core\.gitproxy|core\.askpass|core\.pager|include\.path|includeif\..*|uploadpack\..*|protocol\..*)$`

/** Hooks that are not git-lfs's own and not samples. */
export function customHooks(hooksDir: string) {
  if (!existsSync(hooksDir)) return []
  return readdirSync(hooksDir).filter((name) => {
    if (name.endsWith(".sample")) return false
    const file = join(hooksDir, name)
    if (!statSync(file).isFile()) return false
    const head = readFileSync(file, "utf8").slice(0, 2_000)
    return !/git[- ]lfs/.test(head)
  })
}

/** Decides what the local HEAD is relative to the official repository. */
export function classifyHead(input: {
  head: string
  tag?: string
  remoteTag?: string
  remoteHead?: string
  branch?: string
  localAhead?: number
  online: boolean
}): Finding {
  const branch = input.branch ?? "main"
  if (!input.online) return { level: "warn", name: text.head, detail: text.offline }
  if (input.tag) {
    if (input.remoteTag === input.head) return { level: "ok", name: text.head, detail: text.headTag(input.tag) }
    return { level: "fail", name: text.head, detail: text.headTagBad(input.tag) }
  }
  if (input.remoteHead === input.head) return { level: "ok", name: text.head, detail: text.headBranch(branch) }
  if (input.localAhead === 0) return { level: "warn", name: text.head, detail: text.headDev(branch) }
  return { level: "fail", name: text.head, detail: text.headBad(input.head.slice(0, 7)) }
}

const envKeys = windows
  ? []
  : [
      "HOMEBREW_BREW_GIT_REMOTE",
      "HOMEBREW_CORE_GIT_REMOTE",
      "HOMEBREW_API_DOMAIN",
      "HOMEBREW_BOTTLE_DOMAIN",
      "HOMEBREW_ARTIFACT_DOMAIN",
      "HOMEBREW_NO_VERIFY_ATTESTATIONS",
      "HOMEBREW_CURL_PATH",
      "HOMEBREW_GIT_PATH",
      "HOMEBREW_CURLRC",
      "HOMEBREW_DEVELOPER",
      "HOMEBREW_NO_INSTALL_FROM_API"
    ]

function same(a: string, b: string) {
  try {
    return realpathSync(a) === realpathSync(b)
  } catch {
    return false
  }
}

async function shellResolution(): Promise<Finding> {
  const shell = process.env.SHELL ?? ""
  const kind = basename(shell)
  const probe = kind === "zsh" ? "whence -w brew" : kind === "bash" ? "type -t brew" : undefined
  if (!probe) return { level: "ok", name: text.shell, detail: kind }
  const result = await capture([shell, "-ic", probe])
  const line = result.out.split("\n").findLast((item) => /brew|file|alias|function/.test(item)) ?? ""
  if (/^brew: command$/.test(line) || /^file$/.test(line)) return { level: "ok", name: text.shell, detail: kind }
  if (!result.out) return { level: "warn", name: text.shell, detail: text.shellUnknown }
  return { level: "fail", name: text.shell, detail: `${text.shellBad}: ${line || result.out.slice(0, 80)}` }
}

function permissions(paths: string[]): Finding[] {
  if (windows || typeof process.getuid !== "function") return []
  const uid = process.getuid()
  const findings: Finding[] = []
  for (const path of paths) {
    if (!existsSync(path)) continue
    const stat = statSync(path)
    if (stat.mode & 0o022) findings.push({ level: "fail", name: text.owner, detail: text.ownerBad(path) })
    else if (stat.uid !== uid)
      findings.push({ level: "warn", name: text.owner, detail: text.ownerOther(path, stat.uid) })
  }
  return findings.length ? findings : [{ level: "ok", name: text.owner }]
}

async function repoFindings(repo: string, remote: string, label: string): Promise<Finding[]> {
  const findings: Finding[] = []
  const origin = normalizeRemote((await git(repo, "remote", "get-url", "origin")).out)
  findings.push(
    origin === normalizeRemote(remote)
      ? { level: "ok", name: label, detail: origin }
      : { level: "warn", name: label, detail: `${text.remoteBad}: ${origin || "?"}` }
  )
  const status = (await git(repo, "status", "--porcelain")).out
  if (status) {
    const files = status.split("\n")
    const shown = files.slice(0, 5).map((line) => line.slice(3))
    findings.push({
      level: "fail",
      name: text.tree,
      detail: `${text.treeDirty(files.length)}: ${shown.join(", ")}${files.length > 5 ? " …" : ""}`
    })
  } else findings.push({ level: "ok", name: text.tree, detail: text.treeClean })
  const hidden = (await git(repo, "ls-files", "-v")).out.split("\n").filter((line) => /^[a-zS] /.test(line))
  if (hidden.length)
    findings.push({
      level: "fail",
      name: text.hidden,
      detail: hidden
        .slice(0, 5)
        .map((l) => l.slice(2))
        .join(", ")
    })
  return findings
}

/** Prints the findings and returns how many of them are failures. */
export async function verify() {
  if (process.env.FREE_DRY_RUN) return 0
  const findings: Finding[] = []
  const command = Bun.which(pm)
  const repo = command ? (await output(official.repository))?.split("\n")[0].trim() : undefined
  if (!command) findings.push({ level: "fail", name: pmName, detail: text.missing })
  else if (!repo || !existsSync(repo) || (await git(repo, "rev-parse", "--git-dir")).code !== 0)
    findings.push({ level: "fail", name: pmName, detail: `${text.noRepo}: ${repo ?? "?"}` })
  else {
    const version = (await output(`${pm} --version`))?.split("\n")[0].trim()
    if (windows) {
      const shims = join(process.env.SCOOP ?? join(homedir(), "scoop"), "shims")
      findings.push(
        same(dirname(command), shims)
          ? { level: "ok", name: text.location, detail: command }
          : { level: "fail", name: text.location, detail: `${text.locationBad}: ${command}` }
      )
    } else {
      const expected = join(repo, "bin", "brew")
      findings.push(
        same(command, expected)
          ? { level: "ok", name: text.location, detail: repo }
          : { level: "fail", name: text.location, detail: `${text.locationBad}: ${command} ≠ ${expected}` }
      )
      findings.push(await shellResolution())
    }
    findings.push(...(await repoFindings(repo, official.remote, text.remote)))

    const config = await git(repo, "config", "--show-origin", "--get-regexp", configPattern)
    for (const line of suspiciousConfig(config.out))
      findings.push({ level: "warn", name: text.gitConfig, detail: line })
    const gitDir = (await git(repo, "rev-parse", "--path-format=absolute", "--git-dir")).out
    const hooks = customHooks(join(gitDir, "hooks"))
    if (hooks.length) findings.push({ level: "fail", name: text.hooks, detail: hooks.join(", ") })

    const head = (await git(repo, "rev-parse", "HEAD")).out
    const describe = await git(repo, "describe", "--tags", "--exact-match", "HEAD")
    const tag = describe.code === 0 ? describe.out : undefined
    const remote = await capture(
      ["git", "ls-remote", "--symref", official.remote, "HEAD", ...(tag ? [`refs/tags/${tag}`] : [])],
      20_000
    )
    const branch = remote.out.match(/^ref: refs\/heads\/(\S+)\tHEAD$/m)?.[1]
    const remoteHead = remote.out.match(/^([0-9a-f]{40})\tHEAD$/m)?.[1]
    const remoteTag =
      remote.out.match(
        new RegExp(String.raw`^([0-9a-f]{40})\trefs/tags/${RegExp.escape(tag ?? "")}\^\{\}$`, "m")
      )?.[1] ??
      remote.out.match(new RegExp(String.raw`^([0-9a-f]{40})\trefs/tags/${RegExp.escape(tag ?? "")}$`, "m"))?.[1]
    const ahead = branch ? await git(repo, "rev-list", "--count", `origin/${branch}..HEAD`) : undefined
    const verdict = classifyHead({
      head,
      tag,
      remoteTag,
      remoteHead,
      branch,
      localAhead: ahead?.code === 0 ? Number(ahead.out) : undefined,
      online: remote.code === 0 && Boolean(remoteHead)
    })
    findings.push({ ...verdict, detail: [version, verdict.detail].filter(Boolean).join(" · ") })

    findings.push(...permissions([repo, join(repo, "bin", "brew"), join(repo, "Library", "Homebrew")]))
    for (const key of envKeys) {
      const value = process.env[key]
      if (value !== undefined) findings.push({ level: "warn", name: text.env, detail: `${key}=${String(value)}` })
    }
    if (!windows) {
      const core = join(repo, "Library", "Taps", "homebrew", "homebrew-core")
      if (existsSync(core))
        findings.push(...(await repoFindings(core, "https://github.com/Homebrew/homebrew-core", text.coreTap)))
    } else {
      const file = join(homedir(), ".config", "scoop", "config.json")
      if (existsSync(file)) {
        const config = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>
        for (const [key, value] of Object.entries(config))
          if (/^scoop_(repo|branch)$/i.test(key))
            findings.push({ level: "warn", name: text.env, detail: `${key}=${String(value)}` })
      }
    }
  }
  return report(findings)
}

function report(findings: Finding[]) {
  const symbol = { ok: styleText("green", "✓"), warn: styleText("yellow", "▲"), fail: styleText("red", "✗") }
  const width = Math.max(...findings.map((f) => Bun.stringWidth(f.name)))
  p.log.message(
    findings
      .map(
        (f) =>
          `${symbol[f.level]} ${f.name}${" ".repeat(width - Bun.stringWidth(f.name) + 2)}${styleText("dim", f.detail ?? "")}`
      )
      .join("\n")
  )
  const fails = findings.filter((f) => f.level === "fail").length
  const warns = findings.filter((f) => f.level === "warn").length
  if (fails) p.log.error(text.fail(fails))
  else if (warns) p.log.warn(text.warn(warns))
  else p.log.success(text.ok)
  return fails
}

/** Runs the check and refuses to go on when the package manager looks tampered with. */
export async function ensureIntact() {
  p.log.step(menuText.check)
  if (await verify()) throw new Error(text.stop)
}
