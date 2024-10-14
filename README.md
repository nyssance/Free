# Free

[![Ruff](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json)](https://github.com/astral-sh/ruff)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](https://opensource.org/licenses/MIT)
[![python](https://img.shields.io/badge/python-3.13-blue)](https://www.python.org)
[![macOS](https://img.shields.io/badge/macOS-15-blue)](https://www.apple.com/macos/macos-sequoia/)

井井兮其有理也 [简体中文](https://github.com/nyssance/Free/blob/main/README-zh_CN.md)

---

## Installation

### macOS

1. Install [Homebrew].

    ```shell
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    ```

2. Install [Oh My Zsh], [zsh-autosuggestions], [zsh-syntax-highlighting], [Powerlevel10k] Optional.

    ```shell
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
    ```

    ```shell
    brew install zsh-autosuggestions zsh-syntax-highlighting
    ```

    [Powerlevel10k installation](https://github.com/romkatv/powerlevel10k?tab=readme-ov-file#installation)

### Windows

1. Install [Scoop].

    ```shell
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
    ```

    ```shell
    irm get.scoop.sh | iex

2. Install [Oh My Posh] Optional.

    ```shell
    winget upgrade JanDeDobbeleer.OhMyPosh -s winget
    ```

3. Install [Terminal-Icons] Optional.

    ```shell
    Install-Module -Name Terminal-Icons -Repository PSGallery
    ```

    ```shell
    Import-Module -Name Terminal-Icons
    ```

### Python

1. Install [Python], [pipx].

    ```shell
    brew install pipx
    ```

2. Install [Fabric], [InquirerPy], [Rich].

    ```shell
    pipx install fabric && pipx inject fabric InquirerPy rich
    ```

3. Download `fabfile.py`, `.fabric.yaml`, `.zshrc` to home directory and run install.

    ```shell
    cd ~
    ```

    ```shell
    curl -fsSL -O https://raw.githubusercontent.com/nyssance/Free/main/fabfile.py -o .fabric.yaml https://raw.githubusercontent.com/nyssance/Free/main/fabric.yaml -o .zshrc https://raw.githubusercontent.com/nyssance/Free/main/zshrc
    ```

    ```shell
    source .zshrc
    ```

    ```shell
    fab install
    ```

## Upgrade

```shell
cd ~ && fab upgrade
```

## Vendor

- [Homebrew]
- [Zsh](https://www.zsh.org)
  - [Oh My Zsh]
  - [zsh-autosuggestions]
  - [zsh-syntax-highlighting]
- [Python]
  - [Fabric]
    - [Invoke](https://www.pyinvoke.org)
  - [InquirerPy]
  - [Rich]

## Tools

### Distribute

- [fastlane](https://fastlane.tools)

### Font

- [Cascadia Code](https://github.com/microsoft/cascadia-code)
- [Nerd Fonts](https://www.nerdfonts.com)

### Android

- [ktlint](https://github.com/pinterest/ktlint)

### iOS / macOS

- [CocoaPods](https://cocoapods.org)
- [SwiftFormat](https://github.com/nicklockwood/SwiftFormat)
- [SwiftLint](https://github.com/realm/SwiftLint)

### Java

- [OpenJDK](https://openjdk.java.net)

### JavaScript & TypeScript

- [Bun](https://bun.sh)

### Python

- pypa
  - [pipx]
- [Astral](https://astral.sh)
  - [uv](https://astral.sh/uv)
  - [Ruff](https://astral.sh/ruff)

### Database

- [MySQL](https://www.mysql.com)
- [Redis](https://redis.io)

Free is released under the MIT license. [See LICENSE](https://github.com/nyssance/Free/blob/main/LICENSE) for details.

[HomeBrew]: https://brew.sh/index_zh-cn
[Oh My Zsh]: https://ohmyz.sh
[zsh-autosuggestions]: https://github.com/zsh-users/zsh-autosuggestions
[zsh-syntax-highlighting]: https://github.com/zsh-users/zsh-syntax-highlighting
[Powerlevel10k]: https://github.com/romkatv/powerlevel10k

[Scoop]: https://scoop.sh
[Oh My Posh]: https://ohmyposh.dev
[Terminal-Icons]: https://github.com/devblackops/Terminal-Icons

[Python]: https://www.python.org
[pipx]: https://pipx.pypa.io
[Fabric]: https://www.fabfile.org
[InquirerPy]: https://github.com/kazhala/InquirerPy
[Rich]: https://github.com/Textualize/rich
