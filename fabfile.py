import locale

from colorama import Back, Fore, init
from fabric import task
from fabric.util import get_local_user
from InquirerPy import inquirer
from InquirerPy.base.control import Choice
from InquirerPy.separator import Separator

HTTP_PROXY = ""
VERSION = "0.12"


@task(default=True)
def hello(c):
    """Hello"""
    init(autoreset=True)
    print(Fore.LIGHTMAGENTA_EX + f"Hello ~ {get_local_user()}")
    print(Fore.LIGHTGREEN_EX + f"{gettext("HTTP Proxy")}: http://{HTTP_PROXY}")
    print(Fore.LIGHTYELLOW_EX + f"Version: {VERSION}")
    print("fab task -h 可以查看 task")
    c.run("fab -l", echo=False)


@task
def cleanup(c):
    """清理"""
    hint("cleanup Homebrew")
    c.run("brew cleanup")
    c.run("brew doctor", warn=True)


@task
def interpreter(c):
    """解释器"""
    print("~/.local/pipx/venvs/fabric/bin/python3.12")
    # "~/pipx/venvs/fabric/Scripts/python.exe"


@task
def install(c):
    """安装"""
    proxy = inquirer.select(gettext("HTTP Proxy"), ["127.0.0.1:7890", Choice("", "No proxy")]).execute()
    if HTTP_PROXY != proxy:
        c.run(f"sed -i '' 's|HTTP_PROXY = \"{HTTP_PROXY}\"|HTTP_PROXY = \"{proxy}\"|' fabfile.py")
    roles = inquirer.checkbox(gettext("install"), [
        Separator(),
        Choice("android", "Android"),
        Choice("ios", "iOS / macOS"),
        Choice("java", "Java"),
        Choice("js", "JavaScript"),
        Choice("python", "Python"),
        Separator("-- Database ---"),
        Choice("mysql", "MySQL"),
        Choice("redis", "Redis"),
        Separator("-- Fonts ------"),
        Choice("font-cascadia-code", "Cascadia Code"),
        Separator("-- Others -----"),
        "fastlane",
        Separator()
    ],
                              transformer=lambda result: ", ".join(result) if len(result) > 0 else "",
                              instruction="(Space for select)").execute()
    if not roles:
        return
    # if "zh_CN" in locale.getlocale():
    #     hint("configure RubyGems")
    #     c.run("gem sources --add https://mirrors.aliyun.com/rubygems/ --remove https://rubygems.org/")
    if "android" in roles:
        hint("install ktlint")
        c.run("brew install ktlint")
    if "ios" in roles:
        hint("install CocoaPods, SwiftFormat, SwiftLint")
        c.run("brew install cocoapods swiftformat swiftlint")
    if "java" in roles:
        hint("install OpenJDK")
        c.run("brew install openjdk")
    if "js" in roles:
        hint("install Node.js, corepack")
        c.run("brew install node")
        c.run("npm install corepack -g")
        c.run("corepack enable pnpm")
    if "python" in roles:
        hint("install pipx")
        c.run("brew install pipx")
        hint("install Poetry, build, twine, Black, isort, Pylint, YAPF")
        c.run("pipx install poetry build twine black isort pylint yapf")
    # 数据库
    if "mysql" in roles:
        hint("install MySQL")
        c.run("brew install mysql")
    if "redis" in roles:
        hint("install Redis")
        c.run("brew install redis")
    # 字体
    if "font-cascadia-code" in roles:
        hint("install Cascadia Code")
        c.run("brew install --cask font-cascadia-code")
    # 其他
    if "fastlane" in roles:
        hint("install fastlane")
        c.run("brew install fastlane")
    cleanup(c)


@task
def reinstall(c):
    """重装"""
    hint("pipx reinstall")
    c.run("pipx reinstall-all")


@task
def remove(c):
    """删除"""
    # if not c.config.sudo.password:
    #     c.run("fab remove --prompt-for-sudo-password", echo=False)
    #     return
    result = inquirer.select(gettext("remove"), ["node", "python", Choice("", gettext("cancel"))]).execute()
    if result == "python":
        hint("remove Python")
        c.run("brew uninstall pipx python3")
    if result == "node":
        hint("remove Node.js")
        c.run("brew uninstall node")
        c.sudo("rm -rf /opt/homebrew/lib/node_modules/")


@task(help={"config": "更新 .fabric, .yaml, .zshrc 配置文件"})
def update(c, config=False):
    """更新"""
    hint(f"update 自己 当前版本 {getcode(VERSION)} 更新在下次执行时生效")
    download(c, "https://raw.githubusercontent.com/nyssance/Free/main/fabfile.py")
    if HTTP_PROXY:
        c.run(f"sed -i '' 's|HTTP_PROXY = \"\"|HTTP_PROXY = \"{HTTP_PROXY}\"|' fabfile.py")
    if config:
        hint("configure .fabric.yaml")
        download(c, "https://raw.githubusercontent.com/nyssance/Free/main/fabric.yaml", ".fabric.yaml")
        hint("configure .zshrc")
        download(c, "https://raw.githubusercontent.com/nyssance/Free/main/zshrc", ".zshrc")
        c.run(f"echo '\n# {gettext("HTTP Proxy")}\nexport HTTPS_PROXY=http://{HTTP_PROXY}' >> .zshrc")
        c.run("zsh -lc 'source .zshrc'")
    hint("update Homebrew")
    c.run("brew update")
    c.run("brew upgrade")
    hint("update Oh My Zsh")
    c.run("$ZSH/tools/upgrade.sh")  # https://github.com/ohmyzsh/ohmyzsh/wiki/FAQ#how-do-i-manually-update-oh-my-zsh-from-a-script
    hint("update pipx")
    c.run("pipx upgrade-all --include-injected")
    cleanup(c)
    print("更新完成。")


@task
def download(c, url, name=None, proxy=HTTP_PROXY):
    """下载"""
    command = f"{url} > {name}" if name else f"-O {url}"
    c.run(f"curl -fsSL{f" -x {proxy}" if proxy else ""} {command}")


@task
def format_code(c):
    """格式化代码"""
    c.run("isort fabfile.py")
    # c.run("black fabfile.py")
    c.run("yapf -irp fabfile.py")


def getcode(message: str) -> str:
    return Fore.LIGHTGREEN_EX + message + Fore.RESET


def gettext(message: str) -> str:
    return LANG[message] if "zh_CN" in locale.getlocale() else message.capitalize()


def hint(value: str):
    operation, message = value.split(" ", 1)
    match operation:
        case "cleanup":
            color = Back.YELLOW
        case "configure":
            color = Back.CYAN
        case "install":
            color = Back.GREEN
        case "remove":
            color = Back.LIGHTRED_EX
        case "update":
            color = Back.LIGHTBLUE_EX
        case _:
            color = Back.LIGHTWHITE_EX
    print(color + gettext(operation) + Back.RESET, message)


LANG = {
    "cleanup": "清理",
    "configure": "配置",
    "install": "安装",
    "reinstall": "重装",
    "remove": "删除",
    "update": "更新",
    "cancel": "取消",
    "HTTP Proxy": "HTTP 代理"
}
