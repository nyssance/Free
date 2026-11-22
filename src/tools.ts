import { homedir } from "node:os"
import { join } from "node:path"

export const windows = process.platform === "win32"
export const pm = windows ? "scoop" : "brew"
export const pmName = pm === "brew" ? "Homebrew" : "Scoop"

export type Tool = {
  name: string
  url: string
  version: string
  install: string[]
  path?: string
}
const home = homedir()
export const groups = {
  Basics: [
    {
      name: pmName,
      url: windows ? "https://scoop.sh" : "https://brew.sh",
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
    {
      name: "Git",
      url: "https://git-scm.com",
      version: "git --version",
      install: windows ? ["scoop install git"] : []
    },
    { name: "GitHub CLI", url: "https://cli.github.com", version: "gh --version", install: [`${pm} install gh`] },
    {
      name: "GitLab CLI",
      url: "https://gitlab.com/gitlab-org/cli",
      version: "glab --version",
      install: [`${pm} install glab`]
    }
  ],
  Android: [
    {
      name: "Android CLI",
      url: "https://developer.android.com/tools/agents/android-cli",
      version: "android --version",
      install: [
        ...(windows
          ? ["winget install --id Google.AndroidCLI --exact"]
          : ["brew tap android/tap", "brew install android-cli"]),
        "android sdk install platform-tools emulator platforms/android-37.2 build-tools/37.0.0 ndk/30.0.16248370"
      ]
    },
    {
      name: "ktlint",
      url: "https://github.com/pinterest/ktlint",
      version: "ktlint --version",
      install: [`${pm} install ktlint`]
    }
  ],
  ...(process.platform === "darwin"
    ? {
        "iOS / macOS": [
          {
            name: "XcodeGen",
            url: "https://github.com/yonaskolb/XcodeGen",
            version: "xcodegen --version",
            install: ["brew install xcodegen"]
          },
          {
            name: "Baguette",
            url: "https://github.com/tddworks/baguette",
            version: "baguette --version",
            install: ["brew install baguette"]
          },
          {
            name: "SwiftLint",
            url: "https://github.com/realm/SwiftLint",
            version: "swiftlint --version",
            install: ["brew install swiftlint"]
          }
        ]
      }
    : {}),
  Flutter: [
    {
      name: "Flutter",
      url: "https://flutter.dev",
      version: "flutter --version",
      install: windows ? ["scoop bucket add extras", "scoop install extras/flutter"] : ["brew install --cask flutter"]
    },
    {
      name: "Maestro",
      url: "https://maestro.dev",
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
  "JavaScript & TypeScript": [
    { name: "Bun", url: "https://bun.sh", version: "bun --version", install: [`${pm} install bun`] }
  ],
  Python: [
    {
      name: "uv",
      url: "https://astral.sh/uv",
      version: "uv --version",
      install: [
        windows ? "irm https://astral.sh/uv/install.ps1 | iex" : "curl -LsSf https://astral.sh/uv/install.sh | sh"
      ],
      path: join(home, ".local", "bin")
    },
    {
      name: "Python",
      url: "https://www.python.org",
      version: "uv python list --only-installed",
      install: [windows ? "uv python install" : "uv python install 3.15"]
    },
    { name: "Ruff", url: "https://astral.sh/ruff", version: "ruff --version", install: ["uv tool install ruff"] },
    { name: "ty", url: "https://github.com/astral-sh/ty", version: "ty --version", install: ["uv tool install ty"] },
    {
      name: "Fabric",
      url: "https://www.fabfile.org",
      version: "fab --version",
      install: ["uv tool install fabric --with InquirerPy --with rich"]
    }
  ],
  Rust: [
    {
      name: "Rust",
      url: "https://www.rust-lang.org",
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
    { name: "MySQL", url: "https://www.mysql.com", version: "mysql --version", install: [`${pm} install mysql`] },
    { name: "Redis", url: "https://redis.io", version: "redis-server --version", install: [`${pm} install redis`] }
  ],
  Others: [
    {
      name: "fastlane",
      url: "https://fastlane.tools",
      version: "fastlane --version",
      install: windows ? ["scoop install ruby", "gem install fastlane"] : ["brew install fastlane"]
    },
    {
      name: "zoxide",
      url: "https://github.com/ajeetdsouza/zoxide",
      version: "zoxide --version",
      install: [`${pm} install zoxide fzf`]
    }
  ],
  AI: [
    {
      name: "Codex",
      url: "https://github.com/openai/codex",
      version: "codex --version",
      install: [`${pm} install codex`]
    },
    {
      name: "Claude Code",
      url: "https://claude.com/claude-code",
      version: "claude --version",
      install: [windows ? "scoop install claude-code" : "brew install --cask claude-code"]
    }
  ]
} satisfies Record<string, Tool[]>
export const tools: Tool[] = Object.values(groups).flat()
export const base = [pmName, "Git", "GitHub CLI", "GitLab CLI", "Bun", "uv", "Python", "Ruff", "ty", "Rust"]
