# FLOWTEXT ✦

一款 **Typora 风格**的 Markdown 编辑器，主打**可视化浮动格式工具栏**与 **Apple 风格**清爽界面。

> 最新版下载：Releases 页面 → [FLOWTEXT-v1.1.0-portable.exe](https://github.com/HXiudi/FLOWTEXT/releases)

## 功能特性

| 功能 | 说明 |
|------|------|
| 📝 **富文本编辑** | WYSIWYG 所见即所得，无需记忆语法 |
| 🎨 **浮动格式栏** | 选中文字即弹出，粗体/斜体/颜色/标题一键修改 |
| 🖼 **图片支持** | 拖拽、粘贴、文件对话框插入，自动内嵌到文件 |
| 📂 **文件管理** | 新建 / 打开 / 保存 `.md` 文件（Ctrl+N/O/S） |
| 📤 **导出** | 导出为 HTML（Ctrl+E）或 PDF（Ctrl+P） |
| 🌙 **深色模式** | 一键切换浅色/深色主题 |
| 🔢 **状态栏** | 实时显示字数与行数 |

## 快速开始

```bash
# 克隆仓库
git clone git@github.com:HXiudi/FLOWTEXT.git
cd FLOWTEXT

# 安装依赖
npm install

# 启动应用
npm start
```

## 技术栈

- **Electron** — 跨平台桌面应用框架
- **marked** — Markdown → HTML 解析
- **Turndown** — HTML → Markdown 转换
- 纯 CSS 实现的 Apple 风格 UI（无框架依赖）

## 快捷键一览

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+N` | 新建文件 |
| `Ctrl+O` | 打开文件 |
| `Ctrl+S` | 保存文件 |
| `Ctrl+Shift+S` | 另存为 |
| `Ctrl+E` | 导出 HTML |
| `Ctrl+P` | 导出 PDF |

## 项目结构

```
FLOWTEXT/
├── src/                  ★ 源代码
│   ├── main.js           Electron 主进程
│   ├── preload.js        IPC 安全桥接
│   ├── index.html        主页面
│   ├── styles/           CSS 样式
│   ├── scripts/          渲染进程逻辑
│   ├── lib/              第三方库
│   └── assets/           LOGO 图标文件
├── docs/                 项目文档（需求/方案/规范/步骤/提交/版本）
├── logs/                 开发日志
├── release/              构建输出（.exe 安装包）
├── package.json          依赖配置
├── .gitignore
├── README.md             本文件
└── AGENTS.md             AI 工作说明书
```

## 版本

| 版本 | 说明 |
|------|------|
| v1.1.0 | 📦 便携版 .exe、🎨 LOGO、图片内嵌、目录精简 |
| v1.0.0 | 🎉 初版发布，完整编辑功能 |

## 许可

MIT
