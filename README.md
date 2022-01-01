# Free

[![macOS](https://img.shields.io/badge/macOS-10.15-blue)](https://www.apple.com/macos/catalina/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](https://opensource.org/licenses/MIT)

井井兮其有理也 [中文](https://github.com/nyssance/Free/blob/master/README-zh_CN.md)

---

## Installation

1. Install [Homebrew].

    ```sh
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    ```

2. Install [Python].

    ```sh
    brew install python@3.10
    brew link --overwrite --force python@3.10
    ```

3. Install [Fabric], [colorama], [InquirerPy].

    ```sh
    pip install fabric colorama InquirerPy
    ```

4. Download `fabfile.py`, `.fabric.yaml` and run install.

    ```sh
    cd ~
    curl -fsSL -O https://raw.githubusercontent.com/nyssance/Free/master/fabfile.py -o .fabric.yaml https://raw.githubusercontent.com/nyssance/Free/master/fabric.yaml
    fab install
    ```

## Vendor

- [Homebrew]
- Zsh
  - [Oh My Zsh]
  - [autoupdate-zsh-plugin](https://github.com/TamCore/autoupdate-oh-my-zsh-plugins)
  - [zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions)
  - [zsh-syntax-highlighting](https://github.com/zsh-users/zsh-syntax-highlighting)
- [Python]
  - [Fabric]
    - [Invoke](https://www.pyinvoke.org)
  - [Colorama]
  - [InquirerPy]

## Tools

### Browser

- [Google Chrome](https://www.google.com/chrome/)

### Develop

- [GitHub Desktop](https://desktop.github.com)
- [Visual Studio Code](https://code.visualstudio.com)

### Debug

- [Postman](https://www.getpostman.com)

### Deploy

- [Docker](https://www.docker.com)

### Distribute

- [fastlane](https://fastlane.tools)

### Font

- [Fira Code](https://github.com/tonsky/FiraCode)

### Android

- [Android Studio](https://developer.android.com/studio/)
- [ktlint](https://github.com/pinterest/ktlint)

### iOS

- [CocoaPods](https://cocoapods.org)
- [SwiftFormat](https://github.com/nicklockwood/SwiftFormat)
- [SwiftLint](https://github.com/realm/SwiftLint)

### Front-end

- [Node.js](https://nodejs.org)
- [Angular CLI](https://cli.angular.io)
- [gulp](https://gulpjs.com)

### Java

- [OpenJDK](https://openjdk.java.net)

### Python

- [Pipenv](https://github.com/pypa/pipenv)
- [twine](https://github.com/pypa/twine)
- Lint
  - [Flake8](https://gitlab.com/pycqa/flake8)
  - [isort](https://timothycrosley.github.io/isort/)
  - [Pylint](https://www.pylint.org)
  - [YAPF](https://github.com/google/yapf)

### Database

- [MySQL](https://www.mysql.com)
- [MySQL Workbench](https://www.mysql.com/products/workbench/)
- [Redis](https://redis.io)

Free is released under the MIT license. [See LICENSE](https://github.com/nyssance/Free/blob/master/LICENSE) for details.

[HomeBrew]: https://brew.sh
[Oh My Zsh]: https://ohmyz.sh
[Python]: https://www.python.org
[Fabric]: https://www.fabfile.org
[Colorama]: https://github.com/tartley/colorama
[InquirerPy]: https://github.com/kazhala/InquirerPy
