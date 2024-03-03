# Homebrew
export HOMEBREW_NO_AUTO_UPDATE=1

# Oh My Zsh
export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME=steeef
plugins=(fabric git history macos poetry z)
source $ZSH/oh-my-zsh.sh

# pipx
export PATH="$PATH:~/.local/bin"

# Zsh
source /opt/homebrew/share/zsh-autosuggestions/zsh-autosuggestions.zsh
source /opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
