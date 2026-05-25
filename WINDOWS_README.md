# Windows 使用说明

## App 版本

1. 安装 Node.js LTS: https://nodejs.org/
2. 在项目目录运行:

```bash
npm install
npm run build:win
```

3. 启动生成的 Windows App:

```text
release/win-unpacked/FrenchHelper.exe
```

## 开发模式

```bash
npm run dev:electron
```

## 语音说明

Windows App 使用 Electron/Chromium 的 Web Speech API 播放法语语音。请确认 Windows 已安装可用的法语语音包，或在系统设置中添加法语语音。

macOS App 会优先使用系统 `say` 命令。

## 常见问题

- 如果提示找不到 Node.js，请安装 Node.js LTS，并重新打开终端。
- 如果语音没有声音，请检查系统音量、应用音量混音器，以及 Windows 的语音包设置。
- 如果打包失败，请先运行 `npm install`，确保 Windows 下的依赖入口脚本已生成。
