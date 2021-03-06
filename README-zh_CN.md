# Free

[![macOS](https://img.shields.io/badge/macOS-10.15-blue)](https://www.apple.com/macos/catalina/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](https://opensource.org/licenses/MIT)

井井兮其有理也 [English](https://github.com/nyssance/Free/blob/master/README.md)

---

## 安装

1. 安装 [Homebrew]。

    ```sh
    /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
    ```

2. 安装 [Python], [Pipenv]。

    ```sh
    brew install pipenv
    brew link --overwrite --force python@3.9
    ```

3. 安装 [Fabric], [colorama], [PyInquirer]。

    ```sh
    pip3 install fabric colorama PyInquirer -i https://pypi.douban.com/simple/
    ```

4. 下载 `fabfile.py`, `.fabric.yaml` 并运行安装。

    ```sh
    cd ~
    curl -fsSL -O https://raw.githubusercontent.com/nyssance/Free/master/fabfile.py -o .fabric.yaml https://raw.githubusercontent.com/nyssance/Free/master/fabric.yaml
    fab install
    ```

## Vendor

- [Homebrew]
- [Oh My Zsh]
- [Python]
  - [Pipenv]
- [Fabric]
  - [Invoke](https://www.pyinvoke.org)
- [Colorama]
- [PyInquirer]

## 安装的工具

### 浏览器

- [Google Chrome](https://www.google.com/chrome/)

### 开发

- [GitHub Desktop](https://desktop.github.com)
- [Visual Studio Code](https://code.visualstudio.com)

### 调试

- [Postman](https://www.getpostman.com)

### 部署

- [Docker](https://www.docker.com)

### 分发

- [fastlane](https://fastlane.tools)

### 字体

- [Fira Code](https://github.com/tonsky/FiraCode)

### Android

- [Android Studio](https://developer.android.com/studio/)
- [ktlint](https://github.com/pinterest/ktlint)

### iOS

- [CocoaPods](https://cocoapods.org)
- [SwiftFormat](https://github.com/nicklockwood/SwiftFormat)
- [SwiftLint](https://github.com/realm/SwiftLint)

### 前端

- [Node.js](https://nodejs.org)
- [Angular CLI](https://cli.angular.io)
- [gulp](https://gulpjs.com)

### Java

- [OpenJDK](https://openjdk.java.net)

### Python

- Lint
  - [Flake8](https://gitlab.com/pycqa/flake8)
  - [isort](https://timothycrosley.github.io/isort/)
  - [Pylint](https://www.pylint.org)
  - [YAPF](https://github.com/google/yapf)
- [twine](https://github.com/pypa/twine)

### 数据库

- [MySQL](https://www.mysql.com)
- [MySQL Workbench](https://www.mysql.com/products/workbench/)
- [Redis](https://redis.io)

### 国际化和本地化

- [gettext](https://www.gnu.org/software/gettext/)

Free is released under the MIT license. [See LICENSE](https://github.com/nyssance/Free/blob/master/LICENSE) for details.

[HomeBrew]: https://brew.sh
[Oh My Zsh]: https://ohmyz.sh
[Python]: https://www.python.org
[Pipenv]: https://github.com/pypa/pipenv
[Fabric]: https://www.fabfile.org
[Colorama]: https://github.com/tartley/colorama
[PyInquirer]: https://github.com/CITGuru/PyInquirer
