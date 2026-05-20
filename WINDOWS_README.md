# Windows 使用说明

## 运行方式

1. 安装 Node.js LTS: https://nodejs.org/
2. 解压本 ZIP。
3. 双击 `start-windows.bat`。
4. 首次运行会自动执行 `npm install`，之后会打开:

```text
http://127.0.0.1:5173/
```

## 音频说明

本项目已内置 `0-100` 的法语数字离线音频:

```text
public/audio/fr/*.wav
```

因此 Windows 上不依赖系统法语 TTS。网页会优先播放这些本地音频；只有本地音频缺失时才回退到浏览器 TTS。

## 常见问题

- 如果双击后提示找不到 Node.js，请安装 Node.js LTS 并重新打开终端/资源管理器。
- 如果 5173 端口已被旧服务占用，`start-windows.bat` 会自动关闭旧进程并重启。
- 如果浏览器没有声音，请确认系统音量、浏览器标签页没有静音。
