# Homebrew
export PATH="/usr/local/sbin:$PATH"
export HOMEBREW_NO_AUTO_UPDATE=1

# Oh My Zsh
export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME=steeef
plugins=(fabric git macos z)

# Python
export PATH="/usr/local/opt/python@3.10/Frameworks/Python.framework/Versions/3.10/bin:$PATH"

# Zsh
source $ZSH/oh-my-zsh.sh
source /opt/homebrew/share/zsh-autosuggestions/zsh-autosuggestions.zsh
source /opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

# HTTP代理
export HTTPS_PROXY=http://127.0.0.1:7890
