import locale
from pathlib import Path

from colorama import Back, Fore, init
from fabric import task
from fabric.util import get_local_user
from InquirerPy import inquirer
from InquirerPy.base.control import Choice
from InquirerPy.separator import Separator

HTTP_PROXY = ''
PYPI_MIRROR = 'https://mirrors.aliyun.com/pypi/simple/'
VERSION = '0.10'


@task(default=True)
def hello(c):
    """Hello"""
    init(autoreset=True)
    print(Fore.LIGHTMAGENTA_EX + f'Hello ~ {get_local_user()}')
    print(Fore.LIGHTGREEN_EX + f'{gettext('HTTP Proxy')}: http://{HTTP_PROXY}')
    print(Fore.LIGHTYELLOW_EX + f'Version: {VERSION}')
    print('fab task -h 可以查看 task')
    c.run('fab -l', echo=False)


@task
def cleanup(c):
    """清理"""
    hint('cleanup Homebrew')
    c.run('brew cleanup')
    c.run('brew doctor', warn=True)


@task
def install(c, pypi_mirror=True):
    """安装"""
    proxy = inquirer.select(gettext('HTTP Proxy'), ['127.0.0.1:7890', Choice('', 'No proxy')]).execute()
    if HTTP_PROXY != proxy:
        c.run(f"sed -i '' 's|HTTP_PROXY = \"{HTTP_PROXY}\"|HTTP_PROXY = \"{proxy}\"|' fabfile.py")
    roles = inquirer.checkbox(gettext('install'), [
        Separator(),
        Choice('android', 'Android'),
        Choice('ios', 'iOS / macOS'),
        Choice('java', 'Java'),
        Choice('python', 'Python'),
        Choice('typescript', 'TypeScript'),
        Separator('-- Database ---'),
        Choice('mysql', 'MySQL'),
        Choice('redis', 'Redis'),
        Separator('-- Fonts ------'),
        Choice('font-cascadia-code', 'Cascadia Code'),
        Separator('-- Others -----'),
        'docsify',
        'fastlane',
        Separator()
    ],
                              transformer=lambda result: ', '.join(result) if len(result) > 0 else '',
                              instruction='(Space for select)').execute()
    if not roles:
        return
    # if 'zh_CN' in locale.getlocale():
    #     hint('configure RubyGems')
    #     c.run('gem sources --add https://mirrors.aliyun.com/rubygems/ --remove https://rubygems.org/')
    if 'android' in roles:
        hint('install ktlint')
        c.run('brew install ktlint')
    if 'ios' in roles:
        hint('install CocoaPods, SwiftFormat, SwiftLint')
        c.run('brew install cocoapods swiftformat swiftlint')
    if 'java' in roles:
        hint('install OpenJDK')
        c.run('brew install openjdk')
    if 'python' in roles:
        hint('install build')
        c.run(f'pip3 install build{f' -i {PYPI_MIRROR}' if pypi_mirror else ''}')
        hint('install pipx')
        c.run('brew install pipx')
        hint('install Poetry, twine, Black, isort, Pylint, YAPF')
        c.run('pipx install poetry twine black isort pylint yapf')
    if 'typescript' in roles:
        hint('install Node.js')
        c.run('brew install node')
        if 'zh_CN' in locale.getlocale():
            hint('configure npm')
            c.run('npm config set registry https://registry.npmmirror.com')
    # 数据库
    if 'mysql' in roles:
        hint('install MySQL')
        c.run('brew install mysql')
    if 'redis' in roles:
        hint('install Redis')
        c.run('brew install redis')
    # 字体
    if 'font-cascadia-code' in roles:
        hint('install Cascadia Code')
        c.run('brew tap homebrew/cask-fonts')
        c.run('brew install --cask font-cascadia-code')
    # 其他
    if 'docsify' in roles:
        hint('install docsify-cli')
        c.run('npm install -g docsify-cli')
    if 'fastlane' in roles:
        hint('install fastlane')
        c.run('brew install fastlane')
    cleanup(c)


@task
def uninstall(c):
    """卸载"""
    # if not c.config.sudo.password:
    #     c.run('fab uninstall --prompt-for-sudo-password', echo=False)
    #     return
    result = inquirer.select(gettext('uninstall'), ['node', 'python', Choice('', gettext('cancel'))]).execute()
    if result == 'python':
        hint('uninstall Python')
        c.run('brew uninstall python3')
        c.sudo('rm -rf /opt/homebrew/lib/python3.12/')
    if result == 'node':
        hint('uninstall Node.js')
        c.run('brew uninstall node')
        c.sudo('rm -rf /opt/homebrew/lib/node_modules/')


@task(help={'config': '更新 .fabric, .yaml, .zshrc 配置文件'})
def update(c, config=False, pypi_mirror=True):
    """更新"""
    hint(f'update 自己 当前版本 {getcode(VERSION)} 更新在下次执行时生效')
    download(c, 'https://raw.githubusercontent.com/nyssance/Free/main/fabfile.py')
    if HTTP_PROXY:
        c.run(f"sed -i '' 's|HTTP_PROXY = \"\"|HTTP_PROXY = \"{HTTP_PROXY}\"|' fabfile.py")
    if config:
        hint('configure .fabric.yaml')
        download(c, 'https://raw.githubusercontent.com/nyssance/Free/main/fabric.yaml', '.fabric.yaml')
        hint('configure .zshrc')
        download(c, 'https://raw.githubusercontent.com/nyssance/Free/main/zshrc', '.zshrc')
        c.run(f"echo '\n# {gettext("HTTP Proxy")}\nexport HTTPS_PROXY=http://{HTTP_PROXY}' >> .zshrc")
        c.run('zsh -lc "source .zshrc"')
    hint('update Homebrew')
    c.run('brew update')
    c.run('brew upgrade')
    hint('update Oh My Zsh')
    c.run('$ZSH/tools/upgrade.sh')  # https://github.com/ohmyzsh/ohmyzsh/wiki/FAQ#how-do-i-manually-update-oh-my-zsh-from-a-script
    hint('update Fabric, Colorama, InquirerPy, build')
    c.run(f'pip3 install -U fabric colorama InquirerPy build{f' -i {PYPI_MIRROR}' if pypi_mirror else ''} | grep -v already')
    c.run('pipx upgrade-all')
    if Path('/opt/homebrew/bin/node').exists():
        hint('update npm')
        c.run('npm update -g')
    cleanup(c)
    print(f'更新完毕\n如果更新了python, 可能需要重新创建虚拟环境.\n如果遇到yapf无法执行, 可能需要{getcode('`fab uninstall`')}然后重装python.')


@task
def download(c, url, name=None, proxy=HTTP_PROXY):
    """下载"""
    command = f'{url} > {name}' if name else f'-O {url}'
    c.run(f'curl -fsSL{f' -x {proxy}' if proxy else ''} {command}')


@task
def reformat(c):
    """格式化"""
    c.run('isort fabfile.py')
    # c.run('black fabfile.py')
    c.run('yapf -irp fabfile.py')


def getcode(message: str) -> str:
    return Fore.LIGHTGREEN_EX + message + Fore.RESET


def gettext(message: str) -> str:
    return LANG[message] if 'zh_CN' in locale.getlocale() else message.capitalize()


def hint(value: str):
    operation, message = value.split(' ', 1)
    match operation:
        case 'cleanup':
            color = Back.YELLOW
        case 'configure':
            color = Back.CYAN
        case 'install':
            color = Back.GREEN
        case 'uninstall':
            color = Back.LIGHTRED_EX
        case 'update':
            color = Back.LIGHTBLUE_EX
        case _:
            color = Back.LIGHTWHITE_EX
    print(color + gettext(operation) + Back.RESET, message)


LANG = {
    'cleanup': '清理',
    'configure': '配置',
    'install': '安装',
    'uninstall': '卸载',
    'update': '更新',
    'cancel': '取消',
    'HTTP Proxy': 'HTTP 代理'
}
