import { homedir } from "node:os"
import { join } from "node:path"

export const windows = process.platform === "win32"
export const pm = windows ? "scoop" : "brew"
export const pmName = pm === "brew" ? "Homebrew" : "Scoop"

export type Tool = {
  name: string
  url: string
  version: string
  /** Shell commands, or a function that works one out when it is reached. */
  install: (string | (() => Promise<string>))[]
  path?: string
}
const home = homedir()
export const groups = {
  Basics: [
    ...(windows
      ? [
          {
            name: "PowerShell",
            url: "https://learn.microsoft.com/powershell",
            version: "pwsh --version",
            // From the Microsoft Store, which keeps it up to date. Skipped when any PowerShell 7 is already there.
            install: [
              "if (-not (Get-Command pwsh -ErrorAction SilentlyContinue)) { winget install --id 9MZ1SNWT0N5D --source msstore --accept-package-agreements --accept-source-agreements }"
            ],
            path: join(home, "AppData", "Local", "Microsoft", "WindowsApps")
          }
        ]
      : []),
    {
      name: pmName,
      url: windows ? "https://scoop.sh" : "https://brew.sh",
      version: `${pm} --version`,
      install: [
        windows
          ? 'iex "& {$(irm get.scoop.sh)} -RunAsAdmin"'
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
        async () => {
          const { output } = await import("./terminal")
          const list = await output("android sdk list --all", 60_000)
          if (!list) throw new Error("android sdk list --all failed")
          return `android sdk install platform-tools emulator ${latestAndroidPackages(list).join(" ")}`
        }
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
      install: ["uv python install"]
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
      name: "Tauri Hasgard",
      url: "https://github.com/nyssance/tauri-hasgard",
      version: "tauri-hasgard --version",
      install: windows
        ? [
            "if (-not (scoop bucket list | Where-Object Name -eq 'nyssance')) { scoop bucket add nyssance https://github.com/nyssance/scoop-bucket }",
            "scoop install nyssance/tauri-hasgard"
          ]
        : ["brew tap nyssance/tap", "brew trust --formula nyssance/tap/tauri-hasgard", "brew install tauri-hasgard"]
    },
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
export const base = [
  ...(windows ? ["PowerShell"] : []),
  pmName,
  "Git",
  "GitHub CLI",
  "GitLab CLI",
  "Bun",
  "uv",
  "Python",
  "Ruff",
  "ty",
  "Rust",
  "Tauri Hasgard"
]

const versionOrder = (a: string, b: string) => {
  const [x, y] = [a, b].map((version) => version.split(".").map(Number))
  return x.map((n, i) => n - (y[i] ?? 0)).find(Boolean) ?? x.length - y.length
}

/** The newest stable SDK platform, build tools and NDK in the Android CLI's package list. */
export function latestAndroidPackages(list: string) {
  return ["platforms/android-", "build-tools/", "ndk/"].map((prefix) => {
    const pattern = new RegExp(String.raw`^\s*${RegExp.escape(prefix)}(\d+(?:\.\d+)*)\s`, "gm")
    const latest = [...list.matchAll(pattern).map((m) => m[1])].toSorted(versionOrder).at(-1)
    if (!latest) throw new Error(`No ${prefix} package in the Android SDK list`)
    return `${prefix}${latest}`
  })
}
