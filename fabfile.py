import locale
from pathlib import Path

from colorama import Fore, init
from fabric import task
from fabric.util import get_local_user
from PyInquirer import Separator, prompt

HTTP_PROXY = ''
PYPI_MIRROR = 'https://mirrors.aliyun.com/pypi/simple/'
VERSION = '0.1.0'


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
    if not c.config.sudo.password:
        c.run('fab cleanup --prompt-for-sudo-password', echo=False)
        return
    hint('cleanup Homebrew, RubyGems')
    c.run('brew cleanup')
    c.run('brew doctor', warn=True)
    c.sudo('gem cleanup')


@task
def install(c, pypi_mirror=True):
    """安装"""
    if not c.config.sudo.password:
        c.run('fab install --prompt-for-sudo-password', echo=False)
        return
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
            {'name': 'MySQL Workbench', 'value': 'mysqlworkbench'},
            Separator('= Others ='),
            {'name': 'Docker', 'value': 'docker'},
            {'name': 'fastlane'}
        ],
        'validate': lambda roles: 'You must choose at least one topping.' if len(roles) == 0 else True
    }]  # yapf: disable
    answers = prompt(questions)
    proxy = answers['proxy']
    roles = answers['roles']
    if HTTP_PROXY != proxy:
        c.run(f'sed -i "" "s|HTTP_PROXY = \'{HTTP_PROXY}\'|HTTP_PROXY = \'{proxy}\'|g" fabfile.py')
    hint('install Oh My Zsh')
    proxy_run(c,
              'sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"',
              warn=True)
    hint('configure .zshrc')
    download(c, 'https://raw.githubusercontent.com/nyssance/Free/master/zshrc', '.zshrc', proxy)
    c.run('zsh -lc "source .zshrc"')
    hint('configure RubyGems')
    c.run('gem sources --add https://gems.ruby-china.com/ --remove https://rubygems.org/')
    hint('install Fira Code')
    proxy_run(c, 'brew tap homebrew/cask-fonts')
    proxy_run(c, 'brew cask install font-fira-code')
    if 'android' in roles:
        hint('install Android Studio, ktlint')
        proxy_run(c, 'brew cask install android-studio')
        proxy_run(c, 'brew install ktlint')
    if 'ios' in roles:
        hint('install CocoaPods SwiftFormat, SwiftLint')
        proxy_run(c, 'brew install cocoapods swiftformat swiftlint')
    if 'java' in roles:
        hint('install OpenJDK')
        proxy_run(c, 'brew install openjdk')
    if 'python' in roles:
        hint('install Pylint, Flake8, isort, YAPF, twine')  # 上传到pypi需要twine
        c.run(f'pip install pylint flake8 isort yapf twine{f" -i {PYPI_MIRROR}" if pypi_mirror else ""}')
        hint('install gettext')
        proxy_run(c, 'brew install gettext')
    # 数据库
    if 'mysql' in roles:
        hint('install MySQL')
        proxy_run(c, 'brew install mysql')
    if 'redis' in roles:
        hint('install Redis')
        proxy_run(c, 'brew install redis')
    # 前端
    if 'angular' in roles or 'gulp' in roles:
        hint('install Node.js')
        proxy_run(c, 'brew install node')
    if 'angular' in roles:
        hint('install Angular CLI')
        c.run('npm install -g @angular/cli')
    if 'gulp' in roles:
        hint('install gulp-cli')
        c.run('npm install -g gulp-cli')
    # 应用
    if 'apps' in roles:
        hint('install GitHub Desktop, Google Chrome, Postman, Visual Studio Code')
        proxy_run(c, 'brew cask install github google-chrome postman visual-studio-code')
        hint('install MySQL Workbench')
        proxy_run(c, 'brew cask install mysqlworkbench')
    # 其他
    if 'docker' in roles:
        hint('install Docker')
        proxy_run(c, 'brew cask install docker')
    if 'fastlane' in roles:
        hint('install fastlane')
        proxy_run(c, 'brew install fastlane')
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
    if not role:
        return
    if role == 'python':
        hint('uninstall Pipenv, Python')
        c.run('brew uninstall pipenv python@3.8')
        c.sudo('rm -rf /usr/local/lib/python3.8/')


@task(help={'config': '更新 .fabric.yaml, .zshrc 配置文件'})
def update(c, config=False, pypi_mirror=True):
    """更新"""
    if not c.config.sudo.password:
        c.run(f'fab update --prompt-for-sudo-password{" --config" if config else ""}', echo=False)
        return
    hint(f'update 自己 当前版本 {VERSION} 更新在下次执行时生效')
    download(c, 'https://raw.githubusercontent.com/nyssance/Free/master/fabfile.py')
    if HTTP_PROXY:
        c.run(f'sed -i "" "s|HTTP_PROXY = \'\'|HTTP_PROXY = \'{HTTP_PROXY}\'|g" fabfile.py')
    if config:
        hint('configure .fabric.yaml, .zshrc')
        download(c, 'https://raw.githubusercontent.com/nyssance/Free/master/fabric.yaml', '.fabric.yaml')
        download(c, 'https://raw.githubusercontent.com/nyssance/Free/master/zshrc', '.zshrc')
        c.run('zsh -lc "source .zshrc"')
    hint('update Homebrew')
    proxy_run(c, 'brew update')
    proxy_run(c, 'brew upgrade')
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
    hint('update RubyGems')
    c.run('gem sources')
    c.sudo('gem update --system')
    c.sudo('gem update')
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


def proxy_run(c, command, **kwargs):
    proxy = ''
    if HTTP_PROXY:
        proxy = f'export HTTPS_PROXY=http://{HTTP_PROXY} && '
    else:
        print('没有代理，速度较慢。')
    c.run(f'{proxy}{command}', **kwargs)


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
