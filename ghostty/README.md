# Ghostty 默认配色主题

把 cmux(及任何基于 libghostty 的终端)的配色还原成 **Ghostty 的内置默认调色板**。

## 文件

- `ghostty-default` — Ghostty 默认配色主题文件,Ghostty config 语法,含 `background` / `foreground` + 完整 256 色 `palette`。

## 为什么需要它

Ghostty 的「默认配色」不是一个具名主题,而是编译进 Ghostty 里的内置回落值,所以**没有 `theme = default` 这种一行写法**。
cmux 在不设主题时回落到的是 **cmux 自己的默认主题**(还跟随 app Light/Dark),并不是 Ghostty 的默认调色板 —— 这就是两者观感不同的原因。

本文件把 Ghostty 的默认值显式导出成一个可引用的主题,让 cmux 等终端能"完全用 Ghostty 默认配色"。

## 怎么生成 / 更新

```sh
/Applications/Ghostty.app/Contents/MacOS/ghostty +show-config --default --docs=false \
  | grep -Ei '^(background|foreground|palette) ' \
  > ghostty-default
```

Ghostty 升级后想同步默认色,重跑这条命令覆盖即可。

## 怎么用

### cmux

编辑 cmux 的 Ghostty 配置(cmux 内 Settings → 打开 config,或文件位于
`~/Library/Application Support/com.cmuxterm.app/config.ghostty`),加一行:

```
theme = /路径/到/ghostty/ghostty-default
```

用**绝对路径**最稳,因为 cmux 的主题搜索目录不一定包含 `~/.config/ghostty/themes`,而 Ghostty 的 `theme` 支持直接给绝对路径。

改完**重启 cmux**(或触发 reload-config)生效。

### 普通 Ghostty

放到 `~/.config/ghostty/themes/ghostty-default`,在 `~/.config/ghostty/config` 里写 `theme = ghostty-default`。

## 已知坑(cmux issue #3523)

cmux 把「app 外观 Light/Dark」和「终端配色」搅在一起,自定义配色可能被 app 外观静默覆盖。
若不生效,改成双模式钉死:

```
theme = dark:/路径/到/ghostty-default,light:/路径/到/ghostty-default
```

## 还原

删掉 cmux config 里那一行 `theme = ...`,即回到 cmux 默认。
