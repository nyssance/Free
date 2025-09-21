<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://readme-typing-svg.demolab.com?Line+all+my+ducks+up+in+a+row~;%E4%BA%95%E4%BA%95%E5%85%AE%E5%85%B6%E6%9C%89%E7%90%86%E4%B9%9F~&font=Noto+Sans&size=24&color=FFFFFF" />
  <img src="https://readme-typing-svg.demolab.com?lines=Line+all+my+ducks+up+in+a+row~;%E4%BA%95%E4%BA%95%E5%85%AE%E5%85%B6%E6%9C%89%E7%90%86%E4%B9%9F~&font=Noto+Sans&size=24&color=000000" />
</picture>

---

[![macOS](https://img.shields.io/badge/macOS_26-4f4f4f?style=for-the-badge&logo=apple)](https://www.apple.com.cn/macos/macos-sequoia/)
[![Homebrew](https://img.shields.io/badge/Homebrew-2d2a25?style=for-the-badge&logo=homebrew)](https://brew.sh)

[![Windows](https://img.shields.io/badge/Windows_11-0078d4?style=for-the-badge&logo=windows11)](https://www.microsoft.com/windows/)
[![Scoop](https://img.shields.io/badge/Scoop-white?style=for-the-badge)](https://scoop.sh)

[![Ruff](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json)](https://github.com/astral-sh/ruff)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](https://opensource.org/licenses/MIT)
[![python](https://img.shields.io/badge/python-3.13-3776AB)](https://www.python.org)

Free [English](https://github.com/nyssance/Free/blob/main/README.md)

## 安装

### macOS

1. 安装 [Homebrew]。

    ```shell
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    ```

2. 安装 [Oh My Zsh]，[zsh-autosuggestions]，[zsh-syntax-highlighting]，[Powerlevel10k] 可选。

    ```shell
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
    ```

    ```shell
    brew install zsh-autosuggestions zsh-syntax-highlighting
    ```

3. 安装 [uv]。

    ```shell
    curl -LsSf https://astral.sh/uv/install.sh | sh
    ```

> Powerlevel10k
>
> - [安装](https://github.com/romkatv/powerlevel10k?tab=readme-ov-file#installation)
> - [字体](https://github.com/romkatv/powerlevel10k/tree/master?tab=readme-ov-file#fonts)

### Windows

1. 安装 [Scoop]。

    ```powershell
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
    ```

    ```powershell
    irm get.scoop.sh | iex
    ```

2. 安装 [uv]。

    ```powershell
    'powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"'
    ```

3. 安装 [Oh My Posh] 可选。

    ```powershell
    winget install JanDeDobbeleer.OhMyPosh -s winget
    ```

4. 安装 [Terminal-Icons] 可选。

    ```powershell
    Install-Module -Name Terminal-Icons -Repository PSGallery
    ```

    ```powershell
    Import-Module -Name Terminal-Icons
    ```

### Python

1. 安装 [Python]。

    ```shell
    uv install python
    ```

2. 安装 [Fabric]，[InquirerPy]，[Rich]。

    ```shell
    uv tool install fabric --with InquirerPy --with rich
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

    > macOS - 配置[plugins:vscode](https://github.com/ohmyzsh/ohmyzsh/tree/master/plugins/vscode)

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
- [Nerd Fonts](https://www.nerdfonts.com)

### Android

- [ktlint](https://github.com/pinterest/ktlint)

### iOS / macOS

- [CocoaPods](https://cocoapods.org)
- [SwiftFormat](https://github.com/nicklockwood/SwiftFormat)
- [SwiftLint](https://github.com/realm/SwiftLint)

### JavaScript & TypeScript

- [Bun](https://bun.sh)

### Python

- [Astral](https://astral.sh)
  - [uv]
  - [Ruff](https://astral.sh/ruff)
  - [ty](https://github.com/astral-sh/ty)

### 数据库

- [MySQL](https://www.mysql.com)
- [Redis](https://redis.io)

Free is released under the MIT license. [See LICENSE](https://github.com/nyssance/Free/blob/main/LICENSE) for details.

[HomeBrew]: https://brew.sh/zh-cn/
[Oh My Zsh]: https://ohmyz.sh
[zsh-autosuggestions]: https://github.com/zsh-users/zsh-autosuggestions
[zsh-syntax-highlighting]: https://github.com/zsh-users/zsh-syntax-highlighting
[Powerlevel10k]: https://github.com/romkatv/powerlevel10k

[Scoop]: https://scoop.sh
[Oh My Posh]: https://ohmyposh.dev
[Terminal-Icons]: https://github.com/devblackops/Terminal-Icons

[Python]: https://www.python.org
[uv]: https://astral.sh/uv
[Fabric]: https://www.fabfile.org
[InquirerPy]: https://github.com/kazhala/InquirerPy
[Rich]: https://github.com/Textualize/rich
