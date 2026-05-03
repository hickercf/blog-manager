# Blog Manager

一个基于 **Tauri v2 + React + TypeScript** 构建的桌面端博客管理工具，专为 [MuZZZFeng's Blog](https://hickercf.fun/) 设计。

**纯ai生成**，90%kimi k2.6 + 8%deepseekv4pro +  2%gpt5.5

## 功能特性

### 文章管理

- **创建文章** - 支持 Markdown 格式，实时预览
- **编辑文章** - 内置 Markdown 编辑器，支持语法高亮
- **删除文章** - 安全删除，操作前确认
- **文章列表** - 按时间排序，快速浏览所有文章

### 分类管理

- **创建/删除分类** - 灵活管理文章分类
- **分类统计** - 实时显示各分类文章数量
- **分类选择** - 发布文章时快速选择分类

### 便捷功能

- **导入 Markdown** - 一键导入外部 Markdown 文件
- **更新日志** - 自动记录博客更新历史
- **GitHub 部署** - 一键部署到 GitHub Pages
- **文件监控** - 实时同步文件系统变化

## 技术栈

- **前端框架**: React 19 + TypeScript
- **桌面框架**: Tauri v2 (Rust)
- **构建工具**: Vite 7
- **UI 组件**: Lucide React 图标库
- **Markdown**: React Markdown + Remark GFM
- **系统 API**: Tauri FS / Shell / Dialog 插件

## 快速开始

### 环境要求

- Node.js 18+
- Rust 1.70+
- Git

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run tauri dev
```

### 构建应用

```bash
npm run tauri build
```

构建完成后，安装包位于 `src-tauri/target/release/bundle/` 目录。

## 项目结构

```
blog-manager/
├── src/                    # React 前端源码
│   ├── components/         # UI 组件
│   ├── utils/             # 工具函数
│   └── types/             # TypeScript 类型定义
├── src-tauri/             # Tauri 后端 (Rust)
│   ├── src/               # Rust 源码
│   └── Cargo.toml         # Rust 依赖
├── dist/                  # 构建输出
└── public/                # 静态资源
```

## 配置说明

首次使用前，请在应用内配置博客路径：

- **博客路径**: 你的 Hexo 博客根目录（如 `D:\hickercf_blog\blog`）

## 与博客的协作流程

1. 在 Blog Manager 中撰写/编辑文章
2. 保存后自动生成 Hexo 文章文件
3. 点击"部署"按钮推送到 GitHub
4. GitHub Actions 自动构建并发布到 Pages

## 许可证

MIT

## 作者

[MuZZZFeng](https://github.com/hickercf)

## 相关链接

- 🍂 [我的博客](https://hickercf.fun/)
- 📝 [Hexo](https://hexo.io/)
- 🎨 [NexT 主题](https://theme-next.js.org/)
- ⚡ [Tauri](https://tauri.app/)
