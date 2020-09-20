import locale
from pathlib import Path

from colorama import Fore, init
from fabric import task
from fabric.util import get_local_user
from PyInquirer import Separator, prompt

HTTP_PROXY = ''
PYPI_MIRROR = 'https://mirrors.aliyun.com/pypi/simple/'
VERSION = '0.3.0'


@task(default=True)
def hello(c, path='参数值'):
    """Hello"""
    init(autoreset=True)
    print(Fore.LIGHTMAGENTA_EX + f'Hello ~ {get_local_user()}')
    print(Fore.LIGHTGREEN_EX + f'{get_text("HTTP Proxy")}: http://{HTTP_PROXY}')
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
        'message': get_text('HTTP Proxy'),
        'choices': ['127.0.0.1:7890', {'name': 'None', 'value': ''}]
    }, {
        'type': 'checkbox',
        'name': 'roles',
        'message': get_text('install'),
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
    if HTTP_PROXY != proxy:
        c.run(f'sed -i "" "s|HTTP_PROXY = \'{HTTP_PROXY}\'|HTTP_PROXY = \'{proxy}\'|g" fabfile.py')
    hint('install Oh My Zsh')
    c.run('sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"', warn=True)
    hint('configure .zshrc')
    download(c, 'https://raw.githubusercontent.com/nyssance/Free/master/zshrc', '.zshrc', proxy)
    c.run(f'echo $"\nexport HTTPS_PROXY=http://{HTTP_PROXY}" >> .zshrc')
    c.run('zsh -lc "source .zshrc"')
    hint('configure RubyGems')
    c.run('gem sources --add https://gems.ruby-china.com/ --remove https://rubygems.org/')
    c.run('echo $HTTPS_PROXY')
    hint('install Fira Code')
    c.run('brew tap homebrew/cask-fonts')
    c.run('brew cask install font-fira-code')
    if 'android' in roles:
        hint('install Android Studio, ktlint')
        c.run('brew cask install android-studio')
        c.run('brew install ktlint')
    if 'ios' in roles:
        hint('install CocoaPods SwiftFormat, SwiftLint')
        c.run('brew install cocoapods swiftformat swiftlint')
    if 'java' in roles:
        hint('install OpenJDK')
        c.run('brew install openjdk')
    if 'python' in roles:
        hint('install Pylint, Flake8, isort, YAPF, twine')  # 上传到pypi需要twine
        c.run(f'pip install pylint flake8 isort yapf twine{f" -i {PYPI_MIRROR}" if pypi_mirror else ""}')
        hint('install gettext')
        c.run('brew install gettext')
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
    if 'angular' in roles:
        hint('install Angular CLI')
        c.run('npm install -g @angular/cli')
    if 'gulp' in roles:
        hint('install gulp-cli')
        c.run('npm install -g gulp-cli')
    # 应用
    if 'apps' in roles:
        hint('install GitHub Desktop, Google Chrome, Postman, Visual Studio Code')
        c.run('brew cask install github google-chrome postman visual-studio-code')
    # 其他
    if 'docker' in roles:
        hint('install Docker')
        c.run('brew cask install docker')
    if 'fastlane' in roles:
        hint('install fastlane')
        c.run('brew install fastlane')
    if 'mysqlworkbench' in roles:
        hint('install MySQL Workbench')
        c.run('brew cask install mysqlworkbench')
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
        'message': get_text('uninstall'),
        'choices': ['python', {
            'name': get_text('cancel'),
            'value': ''
        }]
    }])['role']
    if role == 'python':
        hint('uninstall Pipenv, Python')
        c.run('brew uninstall pipenv python@3.8')
        c.sudo('rm -rf /usr/local/lib/python3.8/')


@task(help={'config': '更新 .fabric.yaml, .zshrc 配置文件'})
def update(c, config=False, pypi_mirror=True):
    """更新"""
    hint(f'update 自己 当前版本 {VERSION} 更新在下次执行时生效')
    download(c, 'https://raw.githubusercontent.com/nyssance/Free/master/fabfile.py')
    if HTTP_PROXY:
        c.run(f'sed -i "" "s|HTTP_PROXY = \'\'|HTTP_PROXY = \'{HTTP_PROXY}\'|g" fabfile.py')
    if config:
        hint('configure .fabric.yaml, .zshrc')
        download(c, 'https://raw.githubusercontent.com/nyssance/Free/master/fabric.yaml', '.fabric.yaml')
        download(c, 'https://raw.githubusercontent.com/nyssance/Free/master/zshrc', '.zshrc')
        c.run(f'echo $"\nexport HTTPS_PROXY=http://{HTTP_PROXY}" >> .zshrc')
        c.run('zsh -lc "source .zshrc"')
    c.run('echo $HTTPS_PROXY')
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
    hint('update Pylint, Flake8, isort, YAPF, twine')
    c.run(f'pip install -U pylint flake8 isort yapf twine{mirror} | grep -v already')
    cleanup(c)
    print(Fore.LIGHTCYAN_EX + '''
更新完毕
如果更新了python, 可能需要重新创建虚拟环境.
如果遇到yapf无法执行, 可能需要`fab uninstall`然后重装python.
''' + Fore.RESET)


@task
def format(c):
    """格式化"""
    c.run('isort fabfile.py')
    c.run('yapf -irp fabfile.py')


def download(c, url, name=None, proxy=HTTP_PROXY):
    command = f'{url} > {name}' if name else f'-O {url}'
    c.run(f'curl -fsSL{f" -x {proxy}" if proxy else ""} {command}')


def get_text(str: str):
    return LANG[str] if locale.getdefaultlocale()[0] in ['zh_CN'] else str.capitalize()


def hint(value):
    operation, str = value.split(' ', 1)
    color = Fore.LIGHTWHITE_EX
    if operation == 'cleanup':
        color = Fore.LIGHTYELLOW_EX
    elif operation == 'configure':
        color = Fore.LIGHTCYAN_EX
    elif operation == 'install':
        color = Fore.LIGHTGREEN_EX
    elif operation == 'uninstall':
        color = Fore.LIGHTRED_EX
    elif operation == 'update':
        color = Fore.LIGHTBLUE_EX
    print(color + get_text(operation) + Fore.RESET, str)


LANG = {
    'cleanup': '清理',
    'configure': '配置',
    'install': '安装',
    'uninstall': '卸载',
    'update': '更新',
    'cancel': '取消',
    'HTTP Proxy': 'HTTP 代理'
}
