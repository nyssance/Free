import { afterEach, describe, expect, test } from "bun:test"

import { CommandError, output, run } from "../src/terminal"
import { windows } from "../src/tools"

const dryRun = process.env.FREE_DRY_RUN
afterEach(() => {
  if (dryRun === undefined) delete process.env.FREE_DRY_RUN
  else process.env.FREE_DRY_RUN = dryRun
})

describe("command execution", () => {
  test("captures stdout and successful stderr version output", async () => {
    expect(await output("echo 1.2.3")).toBe("1.2.3")
    expect(await output(windows ? "[Console]::Error.WriteLine('2.3.4')" : "echo 2.3.4 >&2")).toBe("2.3.4")
  })
  test("does not report errors as version output", async () => {
    expect(await output("echo 1.2.3; exit 7")).toBeUndefined()
  })
  test("terminates an unresponsive version command", async () => {
    const start = Date.now()
    expect(
      await output(windows ? "while ($true) { Start-Sleep -Milliseconds 100 }" : "while :; do :; done", 250)
    ).toBeUndefined()
    expect(Date.now() - start).toBeLessThan(5_000)
  })
  test("preserves failure exit codes without exiting the caller", () => {
    delete process.env.FREE_DRY_RUN
    try {
      run("exit 7")
      throw new Error("Expected command failure")
    } catch (error) {
      expect(error).toBeInstanceOf(CommandError)
      if (!(error instanceof CommandError)) throw error
      expect(error.exitCode).toBe(7)
    }
  })
  test("can tolerate failure but never an interrupt", () => {
    delete process.env.FREE_DRY_RUN
    expect(() => run("exit 7", true)).not.toThrow()
    expect(() => run("exit 130", true)).toThrow(CommandError)
  })
  test("dry run does not execute the command", () => {
    process.env.FREE_DRY_RUN = "1"
    expect(() => run("exit 7")).not.toThrow()
  })
})
