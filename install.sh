#!/bin/sh
set -eu

case "$(uname -s)" in
  Darwin) os=darwin ;;
  *) echo "install.sh 仅支持 macOS，Windows 请运行 install.ps1" >&2; exit 1 ;;
esac
case "$(uname -m)" in
  arm64 | aarch64) arch=arm64 ;;
  *) echo "仅支持 Apple Silicon，当前架构: $(uname -m)" >&2; exit 1 ;;
esac

dir="${FREE_INSTALL_DIR:-$HOME/.local/bin}"
mkdir -p "$dir"
curl -fsSL "https://github.com/nyssance/Free/releases/latest/download/free-$os-$arch" -o "$dir/free"
chmod +x "$dir/free"
echo "已安装 $dir/free"

case ":$PATH:" in
  *":$dir:"*) ;;
  *) echo "请把 $dir 加入 PATH，例如在 ~/.zshrc 中添加: export PATH=\"$dir:\$PATH\"" ;;
esac
echo "运行 free 开始"
