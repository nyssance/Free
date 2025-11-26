from __future__ import annotations

import locale
from pathlib import Path
from platform import system
from typing import TYPE_CHECKING, Final, Literal

import rich
from fabric import task
from fabric.util import get_local_user
from InquirerPy import inquirer
from InquirerPy.base.control import Choice
from InquirerPy.separator import Separator

if TYPE_CHECKING:
    from invoke import Context

VERSION: Final[str] = "0.50"
PM: Literal["brew", "scoop"] = "scoop" if system() == "Windows" else "brew"


def check() -> None:
    if Path.cwd() != Path.home():
        msg = "Please `cd ~`."
        raise OSError(msg)


check()


@task(default=True)
def hello(c: Context) -> None:
    """Hello"""
    rich.print(f"Hello ~ {get_local_user()}")
    rich.print(f"Version: {VERSION}")
    fabric_python = Path(
        "~/AppData/Roaming/uv/tools/fabric/Scripts/python.exe"
        if system() == "Windows"
        else "~/.local/share/uv/tools/fabric/bin/python"
    ).expanduser()
    rich.print(f"Interpreter: {fabric_python}")
    rich.print("fab task -h 可以查看 task\n")
    c.run("fab -l", encoding=locale.getdefaultlocale()[1], echo=False)


@task
def profile(c: Context) -> None:
    """配置"""
    match system():
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
    hint("clean uv")
    c.run("uv cache prune")


@task
def install(c: Context) -> None:  # noqa: C901, PLR0912
    """安装"""
    roles = inquirer.checkbox(
        gettext("install"),
        [
            Separator(),
            Choice("android", "Android"),
            Choice("ios", "iOS / macOS"),
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
            Separator(),
        ],
        transformer=lambda result: ", ".join(result) if len(result) > 0 else "",
        instruction="(Space for select)",
    ).execute()
    if not roles:
        return
    if "android" in roles:
        hint("install ktlint")
        c.run(f"{PM} install ktlint")
    if "ios" in roles:
        hint("install CocoaPods, SwiftFormat, SwiftLint")
        c.run(f"{PM} install cocoapods swiftformat swiftlint")
    if "js" in roles:
        hint("install Bun")
        if PM == "brew":
            c.run("brew tap oven-sh/bun")
        c.run(f"{PM} install bun")
    if "python" in roles:
        hint("install Ruff, ty")
        c.run("uv tool install ruff")
        c.run("uv tool install ty")
    if "rust" in roles:
        hint("install Rust")
        if system() == "Windows":
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
    #     uv_run("fab remove --prompt-for-sudo-password", echo=False)
    #     return


@task(aliases=["u"], help={"config": "更新 .fabric.yaml, .zshrc 配置文件"})
def upgrade(c: Context, *, config: bool = False) -> None:
    """升级"""
    hint(f"upgrade 自己 当前版本 {VERSION} 变化在下次执行时生效")
    remote = "https://raw.githubusercontent.com/nyssance/Free/main/"
    download(c, f"{remote}fabfile.py")
    if config:
        hint("configure .fabric.yaml")
        if system() == "Windows":
            download(c, f"{remote}fabric.windows.yaml", ".fabric.yaml")
        else:
            download(c, f"{remote}fabric.yaml", ".fabric.yaml")
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
    hint("upgrade uv/python/tool")
    c.run("uv self update")
    c.run("uv python upgrade")
    c.run("uv tool upgrade --all")
    hint("upgrade rust")
    c.run("rustup update")
    cleanup(c)
    if system() == "Windows":
        c.run("winget upgrade")
    hint(f"upgrade {gettext("completed")}")


def download(c: Context, url: str, name: str | None = None) -> None:
    command = f"{url} > {name}" if name else f"-O {url}"
    c.run(f"curl -fsSL {command}")


def gettext(message: str) -> str:
    chinese = ("Chinese (Simplified)_China" if system() == "Windows" else "zh_CN") in locale.getdefaultlocale()
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
    "fonts": "字体",
}
