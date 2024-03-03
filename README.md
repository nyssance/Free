# Free

[![macOS](https://img.shields.io/badge/macOS-14-blue)](https://www.apple.com/macos/monterey/)
[![python](https://img.shields.io/badge/python-3.12-blue)](https://www.python.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](https://opensource.org/licenses/MIT)

井井兮其有理也 [中文](https://github.com/nyssance/Free/blob/main/README-zh_CN.md)

---

## Installation

1. Install [Homebrew].

    ```sh
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    ```

2. Install [Python].

    ```sh
    brew install python3
    ```

3. Install [Fabric], [Colorama], [InquirerPy]. [PEP668](https://github.com/pypa/pip/issues/11776#issuecomment-1434892689)

    ```sh
    pip3 install fabric colorama InquirerPy -break-system-packages
    ```

4. Install [Oh My Zsh], [zsh-autosuggestions], [zsh-syntax-highlighting].

    ```sh
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
    ```

    ```sh
    brew install zsh-autosuggestions zsh-syntax-highlighting
    ```

5. Download `fabfile.py`, `.fabric.yaml`, `.zshrc` and run install.

    ```sh
    cd ~
    ```

    ```sh
    curl -fsSL -O https://raw.githubusercontent.com/nyssance/Free/main/fabfile.py -o .fabric.yaml https://raw.githubusercontent.com/nyssance/Free/main/fabric.yaml -o .zshrc https://raw.githubusercontent.com/nyssance/Free/main/zshrc
    ```

    ```sh
    source .zshrc
    ```

    ```sh
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
  - [Colorama]
  - [InquirerPy]

## Tools

### Distribute

- [fastlane](https://fastlane.tools)

### Document

- [docsify](https://docsify.js.org)

### Font

- [Cascadia Code](https://github.com/microsoft/cascadia-code)

### Android

- [ktlint](https://github.com/pinterest/ktlint)

### iOS / macOS

- [CocoaPods](https://cocoapods.org)
- [SwiftFormat](https://github.com/nicklockwood/SwiftFormat)
- [SwiftLint](https://github.com/realm/SwiftLint)

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

### TypeScript

- [Node.js](https://nodejs.org/en/)

### Database

- [MySQL](https://www.mysql.com)
- [Redis](https://redis.io)

Free is released under the MIT license. [See LICENSE](https://github.com/nyssance/Free/blob/main/LICENSE) for details.

[HomeBrew]: https://brew.sh
[Oh My Zsh]: https://ohmyz.sh
[zsh-autosuggestions]: https://github.com/zsh-users/zsh-autosuggestions
[zsh-syntax-highlighting]: https://github.com/zsh-users/zsh-syntax-highlighting
[Python]: https://www.python.org
[Fabric]: https://www.fabfile.org
[Colorama]: https://github.com/tartley/colorama
[InquirerPy]: https://github.com/kazhala/InquirerPy
