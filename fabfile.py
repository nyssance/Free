import locale
from pathlib import Path

from colorama import Back, Fore, init
from fabric import task
from fabric.util import get_local_user
from PyInquirer import Separator, prompt

HTTP_PROXY = ''
PYPI_MIRROR = 'https://mirrors.aliyun.com/pypi/simple/'
VERSION = '0.4.9'


@task(default=True)
def hello(c, path='参数值'):
    """Hello"""
    init(autoreset=True)
    print(Fore.LIGHTMAGENTA_EX + f'Hello ~ {get_local_user()}')
    print(Fore.LIGHTGREEN_EX + f'{gettext("HTTP Proxy")}: http://{HTTP_PROXY}')
    print(Fore.LIGHTBLUE_EX + f'Version: {VERSION}')
    print('fab task -h 可以查看 task')
    c.run('fab -l', echo=False)


@task
def cleanup(c):
    """清理"""
    hint('cleanup Homebrew')
    c.run('brew cleanup')
    c.run('brew doctor', warn=True)


@task
def install(c, pypi_mirror=True):
    """安装"""
    questions = [{
        'type': 'list',
        'name': 'proxy',
        'message': gettext('HTTP Proxy'),
        'choices': ['127.0.0.1:7890', {'name': 'None', 'value': ''}]
    }, {
        'type': 'checkbox',
        'name': 'roles',
        'message': gettext('install'),
        # 'qmark': '🦄',
        'choices': [
            {'name': 'Android', 'value': 'android'},
            {'name': 'iOS / macOS', 'value': 'ios'},
            {'name': 'Java', 'value': 'java'},
            {'name': 'Python', 'value': 'python'},
            Separator('= Database ='),
            {'name': 'MySQL', 'value': 'mysql'},
            {'name': 'Redis', 'value': 'redis'},
            Separator('= Front-end ='),
            {'name': 'Angular', 'value': 'angular'},
            {'name': 'gulp'},
            Separator('= Apps ='),
            {'name': 'GitHub Desktop, Google Chrome, Postman, Visual Studio Code', 'value': 'apps'},
            Separator('= Fonts ='),
            {'name': 'Fira Code', 'value': 'font-fira-code'},
            Separator('= Others ='),
            {'name': 'Docker', 'value': 'docker'},
            {'name': 'fastlane'},
            {'name': 'MySQL Workbench', 'value': 'mysqlworkbench'}
        ],
        'validate': lambda roles: 'You must choose at least one topping.' if len(roles) == 0 else True
    }]  # yapf: disable
    answers = prompt(questions)
    proxy = answers['proxy']
    roles = answers['roles']
    if not roles:
        return
    if HTTP_PROXY != proxy:
        c.run(f'sed -i "" "s|HTTP_PROXY = \'{HTTP_PROXY}\'|HTTP_PROXY = \'{proxy}\'|g" fabfile.py')
    hint('install Oh My Zsh, autoupdate-zsh-plugin, zsh-autosuggestions, zsh-syntax-highlighting')
    c.run('sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"', warn=True)
    c.run('git clone https://github.com/TamCore/autoupdate-oh-my-zsh-plugins $ZSH_CUSTOM/plugins/autoupdate', warn=True)
    c.run(
        'git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions',
        warn=True)
    c.run(
        'git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting',
        warn=True)
    configure_zsh(c, proxy)
    if locale.getdefaultlocale()[0] in ['zh_CN']:
        hint('configure RubyGems')
        c.run('gem sources --add https://mirrors.aliyun.com/rubygems/ --remove https://rubygems.org/')
    if 'android' in roles:
        hint('install Android Studio, ktlint')
        c.run('brew install --cask android-studio')
        c.run('brew install ktlint')
    if 'ios' in roles:
        hint('install CocoaPods, SwiftFormat, SwiftLint')
        c.run('brew install cocoapods swiftformat swiftlint')
    if 'java' in roles:
        hint('install OpenJDK')
        c.run('brew install openjdk')
    if 'python' in roles:
        hint('install Flake8, isort, Pylint, YAPF, twine')  # 上传到pypi需要twine
        c.run(f'pip install flake8 isort pylint yapf twine{f" -i {PYPI_MIRROR}" if pypi_mirror else ""}')
    # 数据库
    if 'mysql' in roles:
        hint('install MySQL')
        c.run('brew install mysql')
    if 'redis' in roles:
        hint('install Redis')
        c.run('brew install redis')
    # 前端
    if 'angular' in roles or 'gulp' in roles:
        hint('install Node.js')
        c.run('brew install node')
        hint('configure npm')
        c.run('npm config set registry https://registry.npm.taobao.org')
    if 'angular' in roles:
        hint('install Angular CLI')
        c.run('npm install -g @angular/cli')
    if 'gulp' in roles:
        hint('install gulp-cli')
        c.run('npm install -g gulp-cli')
    # 应用
    if 'apps' in roles:
        hint('install GitHub Desktop, Google Chrome, Postman, Visual Studio Code')
        c.run('brew install --cask github google-chrome postman visual-studio-code')
    # 字体
    if 'font-fira-code' in roles:
        hint('install Fira Code')
        c.run('brew tap homebrew/cask-fonts')
        c.run('brew install --cask font-fira-code')
    # 其他
    if 'docker' in roles:
        hint('install Docker')
        c.run('brew install --cask docker')
    if 'fastlane' in roles:
        hint('install fastlane')
        c.run('brew install fastlane')
    if 'mysqlworkbench' in roles:
        hint('install MySQL Workbench')
        c.run('brew install --cask mysqlworkbench')
    cleanup(c)


@task
def uninstall(c):
    """卸载"""
    if not c.config.sudo.password:
        c.run('fab uninstall --prompt-for-sudo-password', echo=False)
        return
    role = prompt([{
        'type': 'list',
        'name': 'role',
        'message': gettext('uninstall'),
        'choices': ['python', {
            'name': gettext('cancel'),
            'value': ''
        }]
    }])['role']
    if role == 'python':
        hint('uninstall Pipenv, Python')
        c.run('brew uninstall pipenv python@3.10')
        c.sudo('rm -rf /usr/local/lib/python3.10/')


@task(help={'config': '更新 .fabric.yaml, .zshrc 配置文件'})
def update(c, config=False, pypi_mirror=True):
    """更新"""
    hint(f'update 自己 当前版本 {VERSION} 更新在下次执行时生效')
    download(c, 'https://raw.githubusercontent.com/nyssance/Free/master/fabfile.py')
    if HTTP_PROXY:
        c.run(f'sed -i "" "s|HTTP_PROXY = \'\'|HTTP_PROXY = \'{HTTP_PROXY}\'|g" fabfile.py')
    if config:
        hint('configure .fabric.yaml')
        download(c, 'https://raw.githubusercontent.com/nyssance/Free/master/fabric.yaml', '.fabric.yaml')
        configure_zsh(c)
    hint('update Homebrew')
    c.run('brew update')
    c.run('brew upgrade')
    if Path('/usr/local/bin/node').exists():
        hint('update npm')
        c.run('npm update -g')
    mirror = f' -i {PYPI_MIRROR}' if pypi_mirror else ''
    hint('update pip, setuptools, wheel')
    c.run(f'pip install -U pip setuptools wheel{mirror} | grep -v already')
    hint('update Fabric, colorama, PyInquirer')
    c.run(f'pip install -U fabric colorama PyInquirer{mirror} | grep -v already')
    hint('update Flake8, isort, Pylint, YAPF, twine')
    c.run(f'pip install -U flake8 isort pylint yapf twine{mirror} | grep -v already')
    cleanup(c)
    print(f'''
更新完毕
如果更新了python, 可能需要重新创建虚拟环境.
如果遇到yapf无法执行, 可能需要{getcode('`fab uninstall`')}然后重装python.
''')


@task
def format(c):
    """格式化"""
    c.run('isort fabfile.py')
    c.run('yapf -irp fabfile.py')


def configure_zsh(c, proxy=None):
    hint('configure .zshrc')
    download(c, 'https://raw.githubusercontent.com/nyssance/Free/master/zshrc', '.zshrc', proxy)
    c.run(f'echo "\n# {gettext("HTTP Proxy")}\nexport HTTPS_PROXY=http://{HTTP_PROXY}" >> .zshrc')
    c.run('zsh -lc "source .zshrc"')


def download(c, url, name=None, proxy=HTTP_PROXY):
    command = f'{url} > {name}' if name else f'-O {url}'
    c.run(f'curl -fsSL{f" -x {proxy}" if proxy else ""} {command}')


def getcode(message: str) -> str:
    return Fore.LIGHTGREEN_EX + message + Fore.RESET


def gettext(message: str) -> str:
    return LANG[message] if locale.getdefaultlocale()[0] in ['zh_CN'] else message.capitalize()


def hint(value: str):
    operation, message = value.split(' ', 1)
    color = Back.LIGHTWHITE_EX
    if operation == 'cleanup':
        color = Back.LIGHTYELLOW_EX
    elif operation == 'configure':
        color = Back.LIGHTCYAN_EX
    elif operation == 'install':
        color = Back.LIGHTGREEN_EX
    elif operation == 'uninstall':
        color = Back.LIGHTRED_EX
    elif operation == 'update':
        color = Back.LIGHTBLUE_EX
    print(color + gettext(operation) + Back.RESET, message)


LANG = {
    'cleanup': '清理',
    'configure': '配置',
    'install': '安装',
    'uninstall': '卸载',
    'update': '更新',
    'cancel': '取消',
    'HTTP Proxy': 'HTTP 代理'
}
