import { homedir } from "node:os"
import { join } from "node:path"

export const windows = process.platform === "win32"
export const pm = windows ? "scoop" : "brew"
export const pmName = pm === "brew" ? "Homebrew" : "Scoop"

export type Tool = {
  name: string
  version: string
  install: string[]
  path?: string
}
const home = homedir()
export const groups = {
  Basics: [
    {
      name: pmName,
      version: `${pm} --version`,
      install: [
        windows
          ? 'Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force; iex "& {$(irm get.scoop.sh)} -RunAsAdmin"'
          : '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
      ],
      path: windows ? join(home, "scoop", "shims") : "/opt/homebrew/bin:/usr/local/bin"
    }
  ],
  Git: [
    { name: "Git", version: "git --version", install: windows ? ["scoop install git"] : [] },
    { name: "GitHub CLI", version: "gh --version", install: [`${pm} install gh`] },
    { name: "GitLab CLI", version: "glab --version", install: [`${pm} install glab`] }
  ],
  Android: [
    {
      name: "Android CLI",
      version: "android --version",
      install: [
        ...(windows
          ? ["winget install --id Google.AndroidCLI --exact"]
          : ["brew tap android/tap", "brew install android-cli"]),
        "android sdk install platform-tools emulator platforms/android-37.2 build-tools/37.0.0 ndk/30.0.16248370"
      ]
    },
    { name: "ktlint", version: "ktlint --version", install: [`${pm} install ktlint`] }
  ],
  ...(process.platform === "darwin"
    ? {
        "iOS / macOS": [
          { name: "XcodeGen", version: "xcodegen --version", install: ["brew install xcodegen"] },
          { name: "Baguette", version: "baguette --version", install: ["brew install baguette"] },
          { name: "SwiftLint", version: "swiftlint --version", install: ["brew install swiftlint"] }
        ]
      }
    : {}),
  Flutter: [
    {
      name: "Flutter",
      version: "flutter --version",
      install: windows ? ["scoop bucket add extras", "scoop install extras/flutter"] : ["brew install --cask flutter"]
    },
    {
      name: "Maestro",
      version: "maestro --version",
      install: windows
        ? ["scoop bucket add java", "scoop install java/openjdk maestro"]
        : [
            "brew tap mobile-dev-inc/tap",
            "brew trust --formula mobile-dev-inc/tap/maestro",
            "brew install mobile-dev-inc/tap/maestro"
          ]
    }
  ],
  "JavaScript & TypeScript": [{ name: "Bun", version: "bun --version", install: [`${pm} install bun`] }],
  Python: [
    {
      name: "uv",
      version: "uv --version",
      install: [
        windows ? "irm https://astral.sh/uv/install.ps1 | iex" : "curl -LsSf https://astral.sh/uv/install.sh | sh"
      ],
      path: join(home, ".local", "bin")
    },
    {
      name: "Python",
      version: "uv python list --only-installed",
      install: [windows ? "uv python install" : "uv python install 3.15"]
    },
    { name: "Ruff", version: "ruff --version", install: ["uv tool install ruff"] },
    { name: "ty", version: "ty --version", install: ["uv tool install ty"] },
    { name: "Fabric", version: "fab --version", install: ["uv tool install fabric --with InquirerPy --with rich"] }
  ],
  Rust: [
    {
      name: "Rust",
      version: "rustc --version",
      install: [
        windows
          ? String.raw`irm https://win.rustup.rs/x86_64 -OutFile $env:TEMP\rustup-init.exe; & $env:TEMP\rustup-init.exe -y`
          : "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y"
      ],
      path: join(home, ".cargo", "bin")
    }
  ],
  Database: [
    { name: "MySQL", version: "mysql --version", install: [`${pm} install mysql`] },
    { name: "Redis", version: "redis-server --version", install: [`${pm} install redis`] }
  ],
  Others: [
    {
      name: "fastlane",
      version: "fastlane --version",
      install: windows ? ["scoop install ruby", "gem install fastlane"] : ["brew install fastlane"]
    },
    { name: "zoxide", version: "zoxide --version", install: [`${pm} install zoxide fzf`] }
  ],
  AI: [
    { name: "Codex", version: "codex --version", install: [`${pm} install codex`] },
    {
      name: "Claude Code",
      version: "claude --version",
      install: [windows ? "scoop install claude-code" : "brew install --cask claude-code"]
    }
  ]
} satisfies Record<string, Tool[]>
export const tools: Tool[] = Object.values(groups).flat()
export const base = [pmName, "Git", "GitHub CLI", "GitLab CLI", "Bun", "uv", "Python", "Ruff", "ty", "Rust"]
