import { chmodSync, mkdtempSync, renameSync, rmSync, statSync } from "node:fs"
import { dirname, join } from "node:path"

import * as p from "@clack/prompts"

import { banner, CommandError, hint, menuText } from "./terminal"
import { windows } from "./tools"

const compiled = Bun.main.startsWith("/$bunfs/") || Bun.main.includes("~BUN")

export let version = "0.1.17"

export function cleanupUpdate() {
  if (compiled && windows) rmSync(`${process.execPath}.old`, { force: true })
}

export async function selfUpdate() {
  const repo = "nyssance/Free"
  hint("upgrade", "free")
  if (process.env.FREE_DRY_RUN) return
  const latestUrl = `https://github.com/${repo}/releases/latest`
  const release = await fetch(latestUrl, { redirect: "manual", signal: AbortSignal.timeout(15_000) })
  const tag = release.headers.get("location")?.split("/tag/")[1]
  if (![301, 302, 303, 307, 308].includes(release.status) || !tag || !/^v?\d+\.\d+\.\d+$/.test(tag))
    throw new Error(`${latestUrl} ${release.status} ${release.statusText}`)
  const latest = tag.replace(/^v/, "")
  if (Bun.semver.order(latest, version) <= 0) {
    p.log.success(`free ${version} ${menuText.latest}`)
    return
  }
  if (!compiled) {
    p.log.warn(`${version} → ${latest} · ${menuText.sourceRun}`)
    return
  }
  const asset = releaseAsset()
  const url = `https://github.com/${repo}/releases/download/${tag}/${asset}.gz`
  const controller = new AbortController()
  const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(300_000)])
  const download = await fetch(url, { signal })
  if (!download.ok || !download.body) throw new Error(`${url} ${download.status} ${download.statusText}`)
  const total = Number(download.headers.get("content-length"))
  const mb = (bytes: number) => (bytes / 1048576).toFixed(1)
  const onCancel = () => controller.abort()
  const progress = total > 0 ? p.progress({ style: "block", max: total, size: 30, onCancel }) : undefined
  const bar = progress ?? p.spinner({ onCancel })
  bar.start(total > 0 ? `${tag} · ${mb(total)} MB` : tag)
  let received = 0
  const counted = new TransformStream({
    transform(chunk: Uint8Array, controller) {
      received += chunk.byteLength
      const message = total > 0 ? `${tag} · ${mb(received)} / ${mb(total)} MB` : `${tag} · ${mb(received)} MB`
      if (progress) progress.advance(chunk.byteLength, message)
      else bar.message(message)
      controller.enqueue(chunk)
    }
  })
  try {
    await installUpdate(process.execPath, download.body.pipeThrough(counted))
  } catch (error) {
    bar.error(tag)
    if (controller.signal.aborted) throw new CommandError("self-update", 130)
    throw error
  }
  bar.stop(`${tag} · ${mb(received)} MB`)
  p.log.success(`free ${version} → ${latest}`)
  version = latest
  console.log(banner(version))
}

export function releaseAsset(platform: string = process.platform, arch: string = process.arch) {
  if (platform === "darwin" && arch === "arm64") return "free-darwin-arm64"
  if (platform === "win32" && arch === "x64") return "free-windows-x64.exe"
  throw new Error(`No release available for ${platform}-${arch}`)
}

export async function installUpdate(exe: string, body: ReadableStream<Uint8Array<ArrayBuffer>>) {
  const directory = mkdtempSync(join(dirname(exe), ".free-update-"))
  const staged = join(directory, "free")
  try {
    await Bun.write(staged, new Response(body.pipeThrough(new DecompressionStream("gzip"))))
    if (statSync(staged).size === 0) throw new Error("Downloaded executable is empty")
    replaceExecutable(exe, staged)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

export function replaceExecutable(exe: string, staged: string) {
  if (!windows) {
    chmodSync(staged, 0o755)
    renameSync(staged, exe)
    return
  }
  const backup = `${exe}.old`
  renameSync(exe, backup)
  try {
    renameSync(staged, exe)
  } catch (error) {
    renameSync(backup, exe)
    throw error
  }
}
