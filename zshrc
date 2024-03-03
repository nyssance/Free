# Homebrew
export HOMEBREW_NO_AUTO_UPDATE=1

# Oh My Zsh
export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME=steeef
plugins=(fabric git history macos z)
source $ZSH/oh-my-zsh.sh

# Zsh
source /opt/homebrew/share/zsh-autosuggestions/zsh-autosuggestions.zsh
source /opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

# HTTP代理
export HTTPS_PROXY=http://127.0.0.1:7890
