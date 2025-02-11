# Homebrew
export HOMEBREW_NO_AUTO_UPDATE=1

# Zsh
source /opt/homebrew/share/zsh-autosuggestions/zsh-autosuggestions.zsh
source /opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

# zoxide
eval "$(zoxide init zsh)"

# Oh My Zsh <https://github.com/ohmyzsh/ohmyzsh/wiki/Settings#main-settings>
export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME=steeef
plugins=(fabric git history macos vscode)
source $ZSH/oh-my-zsh.sh

# uv
. "$HOME/.local/bin/env"
# eval "$(uv generate-shell-completion zsh)"
# eval "$(uvx --generate-shell-completion zsh)"
export UV_PUBLISH_TOKEN=pypi-xxx
