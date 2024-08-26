# Homebrew
export HOMEBREW_NO_AUTO_UPDATE=1

# Zsh
source /opt/homebrew/share/zsh-autosuggestions/zsh-autosuggestions.zsh
source /opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

# zoxide
eval "$(zoxide init zsh)"

# Oh My Zsh
export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME=steeef
plugins=(fabric git history macos poetry)
source $ZSH/oh-my-zsh.sh
