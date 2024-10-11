import locale
import platform
from pathlib import Path
from typing import Literal

from fabric import task
from fabric.util import get_local_user
from InquirerPy import inquirer
from InquirerPy.base.control import Choice
from InquirerPy.separator import Separator
from rich import print

HTTP_PROXY = ""
VERSION = "0.19"
PM: Literal["brew", "scoop"] = "scoop" if platform.system() == "Windows" else "brew"

if Path.cwd() != Path.home():
    raise Exception("Please `cd ~`.")


@task(default=True)
def hello(c):
    """Hello"""
    print(f"Hello ~ {get_local_user()}")
    print(f"{gettext("HTTP Proxy")}: http://{HTTP_PROXY}")
    print(f"Version: {VERSION}")
    interpreter = (
        "~\\pipx\\venvs\\fabric\\Scripts\\python.exe"
        if platform.system() == "Windows"
        else "~/.local/pipx/venvs/fabric/bin/python3.13"
    )
    print(f"Interpreter: {interpreter}")
    print("Venv: ~/Library/Caches/pypoetry/virtualenvs")
    print("fab task -h 可以查看 task")
    c.run("fab -l", echo=False)


@task(aliases=["clean"])
def cleanup(c):
    """清理"""
    match PM:
        case "brew":
            hint("cleanup Homebrew")
            c.run(f"{PM} cleanup")
            c.run(f"{PM} doctor", warn=True)
        case "scoop":
            hint("cleanup Scoop")
            c.run(f"{PM} cleanup --all")
            c.run(f"{PM} checkup")


@task
def install(c):
    """安装"""
    proxy = inquirer.select(gettext("HTTP Proxy"), ["127.0.0.1:7890", Choice("", "No proxy")]).execute()
    if HTTP_PROXY != proxy:
        if platform.system() == "Windows":
            print("请手动配置代理")
        else:
            c.run(f"sed -i '' 's|HTTP_PROXY = \"{HTTP_PROXY}\"|HTTP_PROXY = \"{proxy}\"|' fabfile.py")
    roles = inquirer.checkbox(
        gettext("install"),
        [
            Separator(),
            Choice("android", "Android"),
            Choice("ios", "iOS / macOS"),
            Choice("java", "Java"),
            Choice("js", "JavaScript & TypeScript"),
            Choice("python", "Python"),
            Separator("-- Database ---"),
            Choice("mysql", "MySQL"),
            Choice("redis", "Redis"),
            Separator("-- Others -----"),
            "fastlane",
            Choice("fonts", f"{gettext("fonts")}: Cascadia Code NF, JetBrainsMono Nerd Font"),
            "zoxide",
            Separator()
        ],
        transformer=lambda result: ", ".join(result) if len(result) > 0 else "",
        instruction="(Space for select)"
    ).execute()
    if not roles:
        return
    # if "zh_CN" in locale.getlocale():
    #     hint("configure RubyGems")
    #     c.run("gem sources --add https://mirrors.aliyun.com/rubygems/ --remove https://rubygems.org/")
    if "oh-my-posh" in roles:
        c.run("scoop install https://github.com/JanDeDobbeleer/oh-my-posh/releases/latest/download/oh-my-posh.json")
        c.run("oh-my-posh font install meslo")
    if "zoxide" in roles:
        hint("install zoxide fzf")
        c.run(f"{PM} install zoxide fzf")
    if "android" in roles:
        hint("install ktlint")
        c.run(f"{PM} install ktlint")
    if "ios" in roles:
        hint("install CocoaPods, SwiftFormat, SwiftLint")
        c.run(f"{PM} install cocoapods swiftformat swiftlint")
    if "java" in roles:
        hint("install OpenJDK")
        if PM == "scoop":
            c.run(f"{PM} add bucket java")
        c.run(f"{PM} install openjdk")
    if "js" in roles:
        hint("install Bun")
        match PM:
            case "brew":
                c.run(f"{PM} install oven-sh/bun/bun")
            case "scoop":
                c.run(f"{PM} install bun")
    if "python" in roles:
        hint("install pipx")
        hint("install Poetry, build, twine, Ruff")
        c.run("pipx install poetry build twine ruff")
    # 数据库
    if "mysql" in roles:
        hint("install MySQL")
        c.run(f"{PM} install mysql")
    if "redis" in roles:
        hint("install Redis")
        c.run(f"{PM} install redis")
    # 其他
    if "fastlane" in roles:
        hint("install fastlane")
        c.run(f"{PM} install fastlane")
    if "fonts" in roles:
        hint(f"install {gettext("fonts")}: Cascadia Code NF, JetBrainsMono Nerd Font")
        match PM:
            case "brew":
                c.run(f"{PM} install font-cascadia-code-nf font-jetbrains-mono-nerd-font")
            case "scoop":
                c.run(f"{PM} bucket add nerd-fonts")
                c.run(f"{PM} install CascadiaCode-NF JetBrainsMono-NF")
    cleanup(c)


@task
def reinstall(c):
    """重装"""
    hint("reinstall pipx")
    c.run("pipx reinstall-all")


@task
def remove(c):
    """删除"""
    # if not c.config.sudo.password:
    #     c.run("fab remove --prompt-for-sudo-password", echo=False)
    #     return
    result = inquirer.select(gettext("remove"), ["python", Choice("", gettext("cancel"))]).execute()
    if result == "python":
        hint("remove Python")
        c.run(f"{PM} uninstall pipx python3")
        c.run("rm -rfv ~/.local/pipx/shared")


@task(help={"config": "更新 .fabric, .yaml, .zshrc 配置文件"})
def upgrade(c, config=False):
    """升级"""
    hint(f"upgrade 自己 当前版本 {VERSION} 变化在下次执行时生效")
    remote = "https://raw.githubusercontent.com/nyssance/Free/main/"
    download(c, f"{remote}fabfile.py")
    if HTTP_PROXY:
        c.run(f"sed -i '' 's|HTTP_PROXY = \"\"|HTTP_PROXY = \"{HTTP_PROXY}\"|' fabfile.py")
    if config:
        hint("configure .fabric.yaml")
        download(c, f"{remote}fabric.yaml", ".fabric.yaml")
        hint("configure .zshrc")
        download(c, f"{remote}zshrc", ".zshrc")
        c.run(f"echo '\n# {gettext("HTTP Proxy")}\nexport HTTPS_PROXY=http://{HTTP_PROXY}' >> .zshrc")
        c.run("zsh -lc 'source .zshrc'")
    match PM:
        case "brew":
            hint("upgrade Homebrew")
            c.run(f"{PM} update")
            c.run(f"{PM} upgrade")
        case "scoop":
            hint("upgrade Scoop")
            c.run(f"{PM} update --all")
            c.run("winget upgrade")
    hint("upgrade pipx")
    c.run("pipx upgrade-all --include-injected")
    cleanup(c)
    hint(f"upgrade {gettext("complete")}")


@task
def download(c, url, name=None, proxy=HTTP_PROXY):
    """下载"""
    command = f"{url} > {name}" if name else f"-O {url}"
    c.run(f"curl -fsSL {f"-x {proxy} " if proxy else ""}{command}")


@task(aliases=["format"])
def format_code(c):
    """格式化代码"""
    c.run("isort fabfile.py")


def gettext(message: str) -> str:
    chinese = "zh_CN" in locale.getlocale() or "Chinese (Simplified)_China" in locale.getlocale()
    return ZH_CN[message] if chinese else message.capitalize()


def hint(value: str):
    operation, message = value.split(" ", 1)
    match operation:
        case "cleanup":
            color = "yellow"
        case "configure":
            color = "cyan"
        case "install":
            color = "green"
        case "remove":
            color = "red"
        case "upgrade":
            color = "blue"
        case _:
            color = "white"
    print(f"[on {color}]{gettext(operation)}", message)


ZH_CN = {
    "cleanup": "清理",
    "configure": "配置",
    "install": "安装",
    "reinstall": "重装",
    "remove": "删除",
    "upgrade": "升级",
    "cancel": "取消",
    "complete": "完成",
    "fonts": "字体",
    "HTTP Proxy": "HTTP 代理"
}
