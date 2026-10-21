#!/bin/sh
set -eu

case "${LC_ALL:-${LC_MESSAGES:-${LANG:-$(defaults read -g AppleLocale 2>/dev/null || true)}}}" in
  zh*) zh=1 ;;
  *) zh= ;;
esac
say() { if [ -n "$zh" ]; then echo "$1"; else echo "$2"; fi }

[ "$(uname -s)" = Darwin ] || { say "install.sh 仅支持 macOS，Windows 请运行 install.ps1" "install.sh supports macOS only, run install.ps1 on Windows" >&2; exit 1; }
[ "$(uname -m)" = arm64 ] || { say "仅支持 Apple Silicon，当前架构: $(uname -m)" "Apple Silicon only, current architecture: $(uname -m)" >&2; exit 1; }

dir="${FREE_INSTALL_DIR:-$HOME/.local/bin}"
mkdir -p "$dir"
curl -fsSL "https://github.com/nyssance/Free/releases/latest/download/free-darwin-arm64.gz" -o "$dir/free.gz"
gunzip -f "$dir/free.gz"
chmod +x "$dir/free"
say "已安装 $dir/free" "Installed $dir/free"

case ":$PATH:" in
  *":$dir:"*) ;;
  *) say "请把 $dir 加入 PATH，例如在 ~/.zshrc 中添加: export PATH=\"$dir:\$PATH\"" "Add $dir to PATH, e.g. in ~/.zshrc: export PATH=\"$dir:\$PATH\"" ;;
esac
say "运行 free 开始" "Run free to start"
