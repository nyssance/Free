# Homebrew
export PATH="/usr/local/sbin:$PATH"
export HOMEBREW_NO_AUTO_UPDATE=1

# Oh My Zsh
export ZSH=$HOME/.oh-my-zsh
ZSH_THEME="steeef"
plugins=(fabric git osx z)
source $ZSH/oh-my-zsh.sh

# Python
export PATH="/usr/local/opt/python@3.9/bin:$PATH"
