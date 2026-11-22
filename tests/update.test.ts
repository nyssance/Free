import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test"
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { windows } from "../src/tools"
import { installUpdate, releaseAsset, releaseChecksum, replaceExecutable, selfUpdate, version } from "../src/update"

describe("update installation", () => {
  let directory: string
  let exe: string

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "free-update-test-"))
    exe = join(directory, "free")
    writeFileSync(exe, "original")
  })
  afterEach(() => rmSync(directory, { recursive: true, force: true }))

  function body(content: string) {
    return new Response(new Uint8Array(Bun.gzipSync(content))).body!
  }
  function checksum(content: string) {
    return new Bun.CryptoHasher("sha256").update(Bun.gzipSync(content)).digest("hex")
  }

  test("installs the decompressed executable and removes staging files", async () => {
    await installUpdate(exe, body("replacement"), checksum("replacement"))
    expect(readFileSync(exe, "utf8")).toBe("replacement")
    expect(readdirSync(directory).toSorted()).toEqual(windows ? ["free", "free.old"] : ["free"])
    if (windows) expect(readFileSync(`${exe}.old`, "utf8")).toBe("original")
    else expect(statSync(exe).mode & 0o777).toBe(0o755)
  })

  test("preserves the original when the download does not match its checksum", async () => {
    await expect(installUpdate(exe, body("tampered"), checksum("replacement"))).rejects.toThrow("checksum")
    expect(readFileSync(exe, "utf8")).toBe("original")
    expect(readdirSync(directory)).toEqual(["free"])
  })

  test.each(["invalid gzip", "empty executable", "interrupted stream"])(
    "preserves the original after %s",
    async (failure) => {
      const stream =
        failure === "invalid gzip"
          ? new Response("not a gzip file").body!
          : failure === "empty executable"
            ? body("")
            : new ReadableStream<Uint8Array<ArrayBuffer>>({
                start(controller) {
                  controller.error(new Error("Connection lost"))
                }
              })
      await expect(installUpdate(exe, stream, checksum(""))).rejects.toThrow()
      expect(readFileSync(exe, "utf8")).toBe("original")
      expect(readdirSync(directory)).toEqual(["free"])
    }
  )

  test("restores the original path when replacement fails", () => {
    expect(() => replaceExecutable(exe, join(directory, "missing"))).toThrow()
    expect(readFileSync(exe, "utf8")).toBe("original")
    expect(readdirSync(directory)).toEqual(["free"])
  })
})

describe("release selection", () => {
  test("matches the assets published by the release workflow", () => {
    expect(releaseAsset("darwin", "arm64")).toBe("free-darwin-arm64")
    expect(releaseAsset("win32", "x64")).toBe("free-windows-x64.exe")
  })
  test("reads the checksum published for a file", () => {
    const sums = `${"a".repeat(64)}  free-darwin-arm64.gz\n${"b".repeat(64)}  free-windows-x64.exe.gz\n`
    expect(releaseChecksum(sums, "free-windows-x64.exe.gz")).toBe("b".repeat(64))
    expect(() => releaseChecksum(sums, "free-windows-x64.exe")).toThrow("No checksum published")
  })
  test.each([
    ["linux", "x64"],
    ["darwin", "x64"],
    ["win32", "arm64"]
  ])("rejects unsupported %s-%s", (platform, arch) => {
    expect(() => releaseAsset(platform, arch)).toThrow("No release available")
  })
})

describe("update checks", () => {
  let dryRun: string | undefined

  beforeEach(() => {
    dryRun = process.env.FREE_DRY_RUN
    delete process.env.FREE_DRY_RUN
  })
  afterEach(() => {
    if (dryRun === undefined) delete process.env.FREE_DRY_RUN
    else process.env.FREE_DRY_RUN = dryRun
  })

  test("dry run does not access the network", async () => {
    using fetch = spyOn(globalThis, "fetch")
    process.env.FREE_DRY_RUN = "1"
    await selfUpdate()
    expect(fetch).not.toHaveBeenCalled()
  })
  test.each([version, "0.0.1"])("does not install equal or older release %s", async (latest) => {
    using fetch = spyOn(globalThis, "fetch")
    fetch.mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: { location: `https://github.com/nyssance/Free/releases/tag/v${latest}` }
      })
    )
    await selfUpdate()
    expect(fetch).toHaveBeenCalledTimes(1)
  })
  test("source execution never downloads or replaces the runtime", async () => {
    using fetch = spyOn(globalThis, "fetch")
    fetch.mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: { location: "https://github.com/nyssance/Free/releases/tag/v999.0.0" }
      })
    )
    await selfUpdate()
    expect(fetch).toHaveBeenCalledTimes(1)
  })
  test.each([
    new Response(null, { status: 500 }),
    new Response(null, { status: 302, headers: { location: "/login" } })
  ])("rejects an invalid release response", async (response) => {
    using fetch = spyOn(globalThis, "fetch")
    fetch.mockResolvedValueOnce(response)
    await expect(selfUpdate()).rejects.toThrow()
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
