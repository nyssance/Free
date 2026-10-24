#!/usr/bin/env bun
import { delimiter } from "node:path"
import { styleText } from "node:util"

import * as p from "@clack/prompts"
import { Command } from "commander"

import { banner, CommandError, groupName, hint, link, menuText, output, pick, run } from "./src/terminal"
import { base, groups, pm, pmName, type Tool, tools, windows } from "./src/tools"
import { cleanupUpdate, selfUpdate, version } from "./src/update"

async function setup() {
  console.log(banner(version))
  installTools(base)
  await list(base)
}

function cleanup() {
  hint("clean", pmName)
  run(pm === "brew" ? "brew cleanup" : "scoop cleanup --all")
  hint("clean", "uv")
  run("uv cache prune")
}

async function install() {
  const versions = await versionsOf(tools)
  const names = await pick(
    menuText.install,
    Object.fromEntries(
      Object.entries(groups).map(([group, tools]) => [
        groupName(group),
        tools.map((tool) => ({ name: tool.name, version: versions.get(tool) }))
      ])
    )
  )
  if (p.isCancel(names) || !names) return
  installTools(names)
  if (names.some((name) => !base.includes(name))) cleanup()
}

function installTools(names: string[]) {
  for (const tool of tools.filter((tool) => names.includes(tool.name))) {
    hint("install", tool.name)
    for (const command of tool.install) run(command)
    if (tool.path) process.env.PATH = `${tool.path}${delimiter}${process.env.PATH ?? ""}`
  }
}

async function upgrade() {
  await selfUpdate().catch((error) => {
    if (error instanceof CommandError && error.exitCode === 130) throw error
    p.log.warn(Bun.inspect(error))
  })
  hint("upgrade", pmName)
  if (pm === "brew") run("brew update", true)
  run(pm === "brew" ? "brew upgrade" : "scoop update --all")
  if (Bun.which("android")) {
    hint("upgrade", "Android SDK")
    run("android sdk update")
  }
  hint("upgrade", "uv/python/tool")
  run("uv self update")
  run("uv python upgrade")
  run("uv python uninstall '<3.15.1'")
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

async function versionOf(tool: Tool) {
  if (!Bun.which(tool.version.split(" ")[0])) return
  const out = await output(tool.version)
  if (!out) return
  const versions =
    tool.name === "Python"
      ? [...out.matchAll(/cpython-(\d+\.\d+\.\d+)/g)].map((m) => m[1])
      : [out.match(/\d+(\.\d+)+/)?.[0] ?? out.split("\n")[0]]
  return [...new Set(versions)].join(", ") || undefined
}

async function versionsOf(tools: Tool[]) {
  return new Map(await Promise.all(tools.map(async (tool) => [tool, await versionOf(tool)] as const)))
}

async function list(names?: string[]) {
  p.intro(`Free ${version} · ${menuText.list}`)
  const selected = Object.entries(groups)
    .map(([group, tools]) => [group, tools.filter((tool) => !names || names.includes(tool.name))] as const)
    .filter(([, tools]) => tools.length > 0)
  const versions = await versionsOf(selected.flatMap(([, tools]) => tools))
  const width = Math.max(...tools.map((tool) => tool.name.length))
  const pad = (name: string) => " ".repeat(width - name.length + 2)
  const lines = selected.flatMap(([group, tools]) => [
    styleText("bold", groupName(group)),
    ...tools.map(
      (tool) => `  ${link(tool.name)}${pad(tool.name)}${versions.get(tool) ?? styleText("dim", menuText.missing)}`
    )
  ])
  p.log.message(lines.join("\n"))
  p.outro()
}

type Action = {
  name: string
  label: string
  run: () => void | Promise<void>
  alias?: string
  menu?: boolean
}
const actions: Action[] = [
  { name: "setup", label: menuText.setup, run: setup },
  { name: "cleanup", label: menuText.cleanup, run: cleanup, alias: "clean" },
  { name: "install", label: menuText.install, run: install },
  { name: "upgrade", label: menuText.upgrade, run: upgrade, alias: "u" },
  ...(windows ? [{ name: "winget", label: menuText.winget, run: winget }] : []),
  { name: "list", label: menuText.list, run: () => list(), alias: "ls" },
  { name: "self-update", label: menuText.selfUpdate, run: selfUpdate, menu: false }
]

async function menu() {
  console.log(banner(version))
  const action = await p.select<Action | "exit">({
    message: menuText.choose,
    withGuide: false,
    showInstructions: false,
    options: [
      ...actions.filter((action) => action.menu !== false).map((action) => ({ value: action, label: action.label })),
      { value: "exit", label: menuText.exit }
    ]
  })
  if (p.isCancel(action) || action === "exit") return
  await action.run()
}

const app = new Command()
  .name("free")
  .description(menuText.description)
  .version(version, "-v, --version", menuText.version)
  .helpOption("-h, --help", menuText.help)
  .addHelpText("beforeAll", () => banner(version))
  .configureOutput({
    getOutHasColors: () => Boolean(process.stdout.isTTY || process.env.FORCE_COLOR) && !process.env.NO_COLOR,
    getErrHasColors: () => Boolean(process.stderr.isTTY || process.env.FORCE_COLOR) && !process.env.NO_COLOR
  })
  .action(menu)
for (const action of actions) {
  const command = app
    .command(action.name)
    .description(action.label)
    .action(() => action.run())
  if (action.alias) command.alias(action.alias)
}
try {
  cleanupUpdate()
  await app.parseAsync()
} catch (error) {
  p.log.error(Bun.inspect(error))
  process.exitCode = error instanceof CommandError ? error.exitCode : 1
}
