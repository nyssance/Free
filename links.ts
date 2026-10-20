import { styleText } from "node:util"

import terminalLink from "terminal-link"

export const links: Record<string, string> = {
  Homebrew: "https://brew.sh",
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
  ktlint: "https://github.com/pinterest/ktlint"
}

export function link(text: string) {
  const url = links[text]
  return url ? terminalLink(styleText(["underline", "cyan"], text), url) : text
}
