# Free

[![macOS](https://img.shields.io/badge/macOS-13-blue)](https://www.apple.com/macos/monterey/)
[![python](https://img.shields.io/badge/python-3.12-blue)](https://www.python.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](https://opensource.org/licenses/MIT)

井井兮其有理也 [English](https://github.com/nyssance/Free/blob/main/README.md)

---

## 安装

1. 安装 [Homebrew]。

    ```sh
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    ```

2. 安装 [Python]。

    ```sh
    brew install python@3.12
    ```

3. 安装 [Fabric]，[Colorama], [InquirerPy]。

    ```sh
    pip install fabric colorama InquirerPy -i https://pypi.doubanio.com/simple/
    ```

4. 安装 [Oh My Zsh]，[zsh-autosuggestions]，[zsh-syntax-highlighting]。

    ```sh
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
    ```

    ```sh
    brew install zsh-autosuggestions zsh-syntax-highlighting
    ```

5. 下载 `fabfile.py`，`.fabric.yaml`，`.zshrc` 并运行安装。

    ```sh
    cd ~
    curl -fsSL -O https://raw.githubusercontent.com/nyssance/Free/main/fabfile.py -o .fabric.yaml https://raw.githubusercontent.com/nyssance/Free/main/fabric.yaml -o .zshrc https://raw.githubusercontent.com/nyssance/Free/main/zshrc
    source .zshrc
    fab install
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

## 安装的工具

### 分发

- [fastlane](https://fastlane.tools)

### 文档

- [docsify](https://docsify.js.org/#/zh-cn/)

### 字体

- [Cascadia Code](https://github.com/microsoft/cascadia-code)

### Android

- [Android Studio](https://developer.android.com/studio)
- [ktlint](https://github.com/pinterest/ktlint)

### iOS / macOS

- [CocoaPods](https://cocoapods.org)
- [SwiftFormat](https://github.com/nicklockwood/SwiftFormat)
- [SwiftLint](https://github.com/realm/SwiftLint)

### 前端

- [Node.js](https://nodejs.org/zh-cn/)
- [Angular CLI](https://angular.cn/cli)
- [gulp](https://gulpjs.com)

### Java

- [OpenJDK](https://openjdk.java.net)

### Python

- [Pipenv](https://github.com/pypa/pipenv)
- PyPI
  - [build](https://github.com/pypa/build)
  - [twine](https://github.com/pypa/twine)
- Lint
  - [Black](https://github.com/psf/black)
  - [isort](https://pycqa.github.io/isort/)
  - [Pylint](https://www.pylint.org)
  - [YAPF](https://github.com/google/yapf)

### 数据库

- [MySQL](https://www.mysql.com)
- [Redis](https://redis.io)

Free is released under the MIT license. [See LICENSE](https://github.com/nyssance/Free/blob/main/LICENSE) for details.

[HomeBrew]: https://brew.sh/index_zh-cn
[Oh My Zsh]: https://ohmyz.sh
[zsh-autosuggestions]: https://github.com/zsh-users/zsh-autosuggestions
[zsh-syntax-highlighting]: https://github.com/zsh-users/zsh-syntax-highlighting
[Python]: https://www.python.org
[Fabric]: https://www.fabfile.org
[Colorama]: https://github.com/tartley/colorama
[InquirerPy]: https://github.com/kazhala/InquirerPy
