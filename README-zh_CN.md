# Free

[![Ruff](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json)](https://github.com/astral-sh/ruff)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](https://opensource.org/licenses/MIT)
[![python](https://img.shields.io/badge/python-3.12-blue)](https://www.python.org)
[![macOS](https://img.shields.io/badge/macOS-14-blue)](https://www.apple.com/macos/monterey/)

井井兮其有理也 [English](https://github.com/nyssance/Free/blob/main/README.md)

---

## 安装

### macOS

1. 安装 [Homebrew]。

    ```shell
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    ```

2. 安装 [Oh My Zsh]，[zsh-autosuggestions]，[zsh-syntax-highlighting]。

    ```shell
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
    ```

    ```shell
    brew install zsh-autosuggestions zsh-syntax-highlighting
    ```

### Windows

1. 安装 [Scoop]

    ```shell
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
    ```

    ```shell
    irm get.scoop.sh -Proxy 'http://<ip:port>' | iex
    ```

### Python

1. 安装 [Python]，[pipx]。

    ```shell
    brew install pipx
    ```

2. 安装 [Fabric]，[InquirerPy]，[Rich]。

    ```shell
    pipx install fabric && pipx inject fabric InquirerPy rich
    ```

3. 下载 `fabfile.py`，`.fabric.yaml`，`.zshrc` 到用户主目录并运行安装。

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

## 升级

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

## 安装的工具

### 分发

- [fastlane](https://fastlane.tools)

### 字体

- [Cascadia Code](https://github.com/microsoft/cascadia-code)

### Android

- [ktlint](https://github.com/pinterest/ktlint)

### iOS / macOS

- [CocoaPods](https://cocoapods.org)
- [SwiftFormat](https://github.com/nicklockwood/SwiftFormat)
- [SwiftLint](https://github.com/realm/SwiftLint)

### Java

- [OpenJDK](https://openjdk.java.net)

### JavaScript / TypeScript

- [Node.js](https://nodejs.org)
  - [corepack](https://github.com/nodejs/corepack)
  - [Yarn](https://yarnpkg.com)

### Python

- [Poetry](https://python-poetry.org)
- pypa
  - [pipx]
  - [build](https://github.com/pypa/build)
  - [twine](https://github.com/pypa/twine)
- 其他
  - [Ruff](https://github.com/astral-sh/ruff)
  - [tqdm](https://github.com/tqdm/tqdm)

### 数据库

- [MySQL](https://www.mysql.com)
- [Redis](https://redis.io)

Free is released under the MIT license. [See LICENSE](https://github.com/nyssance/Free/blob/main/LICENSE) for details.

[HomeBrew]: https://brew.sh/index_zh-cn
[Scoop]: https://scoop.sh
[Oh My Zsh]: https://ohmyz.sh
[zsh-autosuggestions]: https://github.com/zsh-users/zsh-autosuggestions
[zsh-syntax-highlighting]: https://github.com/zsh-users/zsh-syntax-highlighting
[Python]: https://www.python.org
[pipx]: https://pipx.pypa.io
[Fabric]: https://www.fabfile.org
[InquirerPy]: https://github.com/kazhala/InquirerPy
[Rich]: https://github.com/Textualize/rich
