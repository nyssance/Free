import { Command } from 'commander'
import * as p from '@clack/prompts'

const version = '0.1.0'
const isWindows = process.platform === 'win32'
const pm = isWindows ? 'scoop' : 'brew'
const menus = {
  zh: {
    choose: '选择操作',
    install: '安装',
    development: '开发',
    database: '数据库',
    others: '其他',
    upgrade: '更新',
    diagnose: '检查环境',
    exit: '退出',
  },
  en: {
    choose: 'Choose an action',
    install: 'Install',
    development: 'Development',
    database: 'Database',
    others: 'Others',
    upgrade: 'Update',
    diagnose: 'Check environment',
    exit: 'Exit',
  },
}
const locale = process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || Intl.DateTimeFormat().resolvedOptions().locale
const menuText = menus[/^zh(?:[-_]|$)/i.test(locale) ? 'zh' : 'en']

function run(command: string, allowFailure = false) {
  console.log(`\x1b[1m${command}\x1b[0m`)
  const shell = isWindows
    ? ['powershell.exe', '-NoProfile', '-Command',
        `$ErrorActionPreference = 'Stop'; $env:Path += ';' + [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User'); ${command}; if ($LASTEXITCODE) { exit $LASTEXITCODE }`]
    : ['sh', '-c', command]
  const child = Bun.spawnSync(shell, {
    stdin: 'inherit', stdout: 'inherit', stderr: 'inherit',
  })
  if (child.signalCode === 'SIGINT' || child.exitCode === 130) {
    process.exit(130)
  }
  if (child.exitCode !== 0 && !allowFailure) {
    throw new Error(`${command}：退出码 ${child.exitCode}`)
  }
}

function checkTools() {
  const tools = [pm, 'uv', 'rustup']
  const missing = tools.filter(tool => !Bun.which(tool))
  if (missing.length) throw new Error(`缺少命令：${missing.join('、')}`)
}

async function install() {
  const roles = await p.groupMultiselect({
    message: menuText.install,
    withGuide: false,
    required: false,
    selectableGroups: false,
    showInstructions: false,
    options: {
      [menuText.development]: [
        { value: 'android', label: 'Android' },
        ...(process.platform === 'darwin' ? [{ value: 'ios', label: 'iOS / macOS' }] : []),
        { value: 'flutter', label: 'Flutter' },
        { value: 'js', label: 'JavaScript & TypeScript' },
        { value: 'python', label: 'Python' },
        { value: 'rust', label: 'Rust' },
      ],
      [menuText.database]: [
        { value: 'mysql', label: 'MySQL' },
        { value: 'redis', label: 'Redis' },
      ],
      [menuText.others]: [
        { value: 'fastlane', label: 'fastlane' },
        { value: 'zoxide', label: 'zoxide' },
      ],
    },
  })
  if (p.isCancel(roles) || roles.length === 0) return
  if (roles.includes('android') || roles.includes('flutter')) {
    hint('install', 'Android CLI, SDK, Emulator, ktlint')
    if (isWindows) {
      run('winget install --id Google.AndroidCLI --exact')
      run('scoop install ktlint')
    } else {
      run('brew tap android/tap')
      run('brew install android-cli ktlint')
    }
    run('android sdk install platform-tools emulator platforms/android-37.2 build-tools/37.0.0 ndk/30.0.16248370')
  }
  if (roles.includes('ios') || (roles.includes('flutter') && process.platform === 'darwin')) {
    hint('install', 'XcodeGen, Baguette, SwiftLint')
    run('brew install xcodegen baguette swiftlint')
  }
  if (roles.includes('flutter')) {
    hint('install', 'Flutter')
    if (isWindows) {
      run('scoop bucket add extras')
      run('scoop install extras/flutter')
    } else {
      run('brew install --cask flutter')
    }
  }
  if (roles.some(role => ['android', 'ios', 'flutter'].includes(role))) {
    hint('install', 'Maestro')
    if (isWindows) {
      run('scoop bucket add java')
      run('scoop install java/openjdk maestro')
    } else {
      run('brew tap mobile-dev-inc/tap')
      run('brew trust --formula mobile-dev-inc/tap/maestro')
      run('brew install mobile-dev-inc/tap/maestro')
    }
  }
  if (roles.includes('js')) {
    hint('install', 'Bun')
    run(`${pm} install bun`)
  }
  if (roles.includes('python')) {
    hint('install', 'uv, Python, Fabric, Ruff, ty')
    run(isWindows
      ? 'powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"'
      : 'curl -LsSf https://astral.sh/uv/install.sh | sh')
    run('uv python install')
    run('uv tool install fabric --with InquirerPy --with rich')
    run('uv tool install ruff')
    run('uv tool install ty')
  }
  if (roles.includes('rust')) {
    hint('install', 'Rust')
    run(isWindows
      ? 'Start-Process https://rust-lang.org/tools/install/'
      : "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh")
  }
  if (roles.includes('mysql')) {
    hint('install', 'MySQL')
    run(`${pm} install mysql`)
  }
  if (roles.includes('redis')) {
    hint('install', 'Redis')
    run(`${pm} install redis`)
  }
  if (roles.includes('fastlane')) {
    hint('install', 'fastlane')
    if (isWindows) {
      run('scoop install ruby')
      run('gem install fastlane')
    } else {
      run('brew install fastlane')
    }
  }
  if (roles.includes('zoxide')) {
    hint('install', 'zoxide fzf')
    run(`${pm} install zoxide fzf`)
  }
  cleanup()
}

function diagnose() {
  p.intro(`Free ${version} · 环境检查`)
  checkTools()
  for (const tool of [pm, 'uv', 'rustup']) {
    p.log.step(`${tool} · ${Bun.which(tool)}`)
    run(`${tool} --version`)
  }
  if (isWindows) {
    run('scoop checkup', true)
  } else {
    run('brew vulns', true)
    run('brew doctor', true)
  }
  p.outro('检查完成，没有执行更新')
}

function upgrade() {
  if (!isWindows || Bun.which('scoop')) {
    hint('upgrade', isWindows ? 'Scoop' : 'Homebrew')
    run(isWindows ? 'scoop update --all' : 'brew upgrade')
  }
  if (isWindows && Bun.which('winget')) {
    run('winget upgrade --all')
  }
  if (Bun.which('android')) {
    hint('upgrade', 'Android SDK')
    run('android sdk update')
  }
  if (Bun.which('uv')) {
    hint('upgrade', 'uv/python/tool')
    run('uv self update')
    run('uv python upgrade')
    run('uv tool upgrade --all')
  }
  if (Bun.which('rustup')) {
    hint('upgrade', 'Rust')
    run('rustup update')
  }
  cleanup()
  hint('upgrade', '完成')
}

function cleanup() {
  if (!isWindows || Bun.which('scoop')) {
    hint('clean', isWindows ? 'Scoop' : 'Homebrew')
    run(isWindows ? 'scoop cleanup --all' : 'brew cleanup')
  }
  if (Bun.which('uv')) {
    hint('clean', 'uv')
    run('uv cache prune')
  }
}

function hint(operation: 'upgrade' | 'clean' | 'install', message: string) {
  const { label, color } = {
    upgrade: { label: '升级', color: 44 },
    clean: { label: '清理', color: 43 },
    install: { label: '安装', color: 42 },
  }[operation]
  console.log(`\x1b[${color}m${label}\x1b[0m ${message}`)
}

async function menu() {
  const action = await p.select({
    message: menuText.choose,
    withGuide: false,
    showInstructions: false,
    options: [
      { value: 'install', label: menuText.install },
      { value: 'upgrade', label: menuText.upgrade },
      { value: 'diagnose', label: menuText.diagnose },
      { value: 'exit', label: menuText.exit },
    ],
  })
  if (p.isCancel(action) || action === 'exit') {
    return
  }
  if (action === 'install') await install()
  else if (action === 'upgrade') upgrade()
  else diagnose()
}

const app = new Command()
  .name('free')
  .description('Free')
  .version(version)
  .action(menu)
app.command('upgrade').alias('u').description('更新已安装软件并清理缓存').action(upgrade)
app.command('install').description('选择安装工具').action(install)
app.command('doctor').description('只检查工具路径和版本').action(diagnose)
try {
  await app.parseAsync()
} catch (error) {
  p.log.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
