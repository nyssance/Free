import locale
import platform
from pathlib import Path
from typing import Literal, NoReturn

import rich
from fabric import task
from fabric.util import get_local_user
from InquirerPy import inquirer
from InquirerPy.base.control import Choice
from InquirerPy.separator import Separator
from invoke import Context

VERSION = "0.31"
PM: Literal["brew", "scoop"] = "scoop" if platform.system() == "Windows" else "brew"


def check() -> NoReturn:
    if Path.cwd() != Path.home():
        msg = "Please `cd ~`."
        raise OSError(msg)


check()


@task(default=True)
def hello(c: Context) -> None:
    """Hello"""
    rich.print(f"Hello ~ {get_local_user()}")
    rich.print(f"Version: {VERSION}")
    uv_tools = "~\\AppData\\Roaming\\uv\\tools\\" if platform.system() == "Windows" else "~/.local/share/uv/tools/"
    rich.print(f"Interpreter: {uv_tools}fabric")
    rich.print("fab task -h 可以查看 task\n")
    c.run("fab -l", echo=False)


@task
def profile(c: Context) -> None:
    """配置"""
    match platform.system():
        case "Darwin":
            c.run("open ~/.zshrc")
        case "Windows":
            c.run("notepad $PROFILE")


@task(aliases=["clean"])
def cleanup(c: Context) -> None:
    """清理"""
    match PM:
        case "brew":
            hint("clean Homebrew")
            c.run(f"{PM} cleanup")
            c.run(f"{PM} doctor", warn=True)
        case "scoop":
            hint("clean Scoop")
            c.run(f"{PM} cleanup --all")
            c.run(f"{PM} checkup")
    # hint("clean uv")
    # c.run("uv cache clean")


@task
def install(c: Context) -> None:  # noqa: C901, PLR0912
    """安装"""
    roles = inquirer.checkbox(
        gettext("install"),
        [
            Separator(),
            Choice("android", "Android"),
            Choice("ios", "iOS / macOS"),
            Choice("java", "Java"),
            Choice("js", "JavaScript & TypeScript"),
            Choice("python", "Python"),
            Choice("rust", "Rust"),
            Separator("-- Database ---"),
            Choice("mysql", "MySQL"),
            Choice("redis", "Redis"),
            Separator("-- Others -----"),
            "fastlane",
            Choice("fonts", f"{gettext("fonts")}: Cascadia Code NF"),
            "zoxide",
            Separator()
        ],
        transformer=lambda result: ", ".join(result) if len(result) > 0 else "",
        instruction="(Space for select)"
    ).execute()
    if not roles:
        return
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
        c.run(f"{PM} install {"oven-sh/bun/" if PM == "brew" else ""}bun")
    if "python" in roles:
        hint("install Ruff")
        c.run("uv tool install ruff")
    if "rust" in roles:
        hint("install Rust")
        if platform.system() == "Windows":
            c.run("start https://www.rust-lang.org/learn/get-started")
        else:
            c.run("curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh")
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
        hint(f"install {gettext("fonts")}: Cascadia Code NF")
        match PM:
            case "brew":
                c.run(f"{PM} install font-cascadia-code-nf")
            case "scoop":
                c.run(f"{PM} bucket add nerd-fonts")
                c.run(f"{PM} install CascadiaCode-NF")
    if "zoxide" in roles:
        hint("install zoxide fzf")
        c.run(f"{PM} install zoxide fzf")
    cleanup(c)


@task
def remove(c: Context) -> None:
    """删除"""
    # if not c.config.sudo.password:
    #     c.run("fab remove --prompt-for-sudo-password", echo=False)
    #     return
    result = inquirer.select(gettext("remove"), ["python", Choice("", gettext("cancel"))]).execute()
    if result == "python":
        hint("remove Python")
        c.run(f"{PM} uninstall python")


@task(aliases=["up"], help={"config": "更新 .fabric.yaml, .zshrc 配置文件"})
def upgrade(c: Context, *, config: bool = False) -> None:
    """升级"""
    hint(f"upgrade 自己 当前版本 {VERSION} 变化在下次执行时生效")
    remote = "https://raw.githubusercontent.com/nyssance/Free/main/"
    download(c, f"{remote}fabfile.py")
    if config:
        hint("configure .fabric.yaml")
        download(c, f"{remote}fabric.yaml", ".fabric.yaml")
        if platform.system() != "Windows":
            hint("configure .zshrc")
            download(c, f"{remote}zshrc", ".zshrc")
            c.run("zsh -lc 'source .zshrc'")
    match PM:
        case "brew":
            hint("upgrade Homebrew")
            c.run(f"{PM} update")
            c.run(f"{PM} upgrade")
        case "scoop":
            hint("upgrade Scoop")
            c.run(f"{PM} update --all")
    hint("upgrade uv")
    c.run("uv self update")
    c.run("uv tool upgrade --all")
    hint("upgrade rust")
    c.run("rustup update")
    cleanup(c)
    if platform.system() == "Windows":
        c.run("winget upgrade")
    hint(f"upgrade {gettext("completed")}")


def download(c: Context, url: str, name: str | None = None) -> None:
    command = f"{url} > {name}" if name else f"-O {url}"
    c.run(f"curl -fsSL {command}")


def gettext(message: str) -> str:
    chinese = "zh_CN" in locale.getlocale() or "Chinese (Simplified)_China" in locale.getlocale()
    return ZH_CN[message] if chinese else message.capitalize()


def hint(value: str) -> None:
    color_map = {"clean": "yellow", "configure": "cyan", "install": "green", "remove": "red", "upgrade": "blue"}
    operation, message = value.split(" ", 1)
    rich.print(f"[on {color_map.get(operation, "white")}]{gettext(operation)}", message)


ZH_CN = {
    "clean": "清理",
    "configure": "配置",
    "install": "安装",
    "remove": "移除",
    "upgrade": "升级",
    "cancel": "取消",
    "completed": "完成",
    "fonts": "字体"
}
