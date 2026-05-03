# Blog Manager

一个基于 **Tauri v2 + React + TypeScript** 构建的桌面端博客管理工具，专为 [MuZZZFeng's Blog](https://hickercf.fun/) 设计。

**纯AI生成**，90% Kimi K2.6 + 8% DeepSeek V4 Pro + 2% GPT-5.5

---

## 功能特性

### 文章管理

- **创建文章** - 支持 Markdown 格式，实时预览，附带标题和摘要自动生成
- **编辑文章** - 内置 Markdown 编辑器，支持语法高亮与实时渲染
- **文章状态** - 支持「已发布」和「草稿」两种状态，灵活切换
- **删除与恢复** - 删除的文章进入回收站，支持一键恢复或永久删除
- **文章列表** - 按时间排序，支持分类筛选与状态筛选

### 搜索与筛选

- **全局搜索** - 支持按标题、内容关键词实时搜索文章
- **分类筛选** - 按分类快速过滤文章
- **状态筛选** - 一键切换查看「全部」「已发布」「草稿」文章

### 编辑器增强

- **图片粘贴上传** - 截图或复制图片后 `Ctrl+V` 直接粘贴到文章中，自动保存到博客目录
- **自动保存草稿** - 每 30 秒自动保存编辑内容，防止意外丢失
- **字数统计** - 实时显示文章字数、预估阅读时间
- **快捷键支持**:
  - `Ctrl + S` — 快速保存文章
  - `Ctrl + P` — 全屏预览模式
  - `Ctrl + V` — 粘贴上传图片

### 仪表盘

- **统计面板** - 一目了然展示总文章数、草稿数、分类数
- **最近文章** - 快速查看最新编辑的 5 篇文章
- **快捷入口** - 快速跳转到新建、编辑、部署等功能

### 分类管理

- **创建/删除分类** - 灵活管理文章分类
- **分类统计** - 实时显示各分类文章数量
- **分类选择** - 发布文章时快速选择分类

### 便捷功能

- **导入 Markdown** - 一键导入外部 Markdown 文件
- **更新日志** - 自动记录博客更新历史
- **本地预览** - 一键启动 Hexo 本地服务器，实时预览博客效果
- **GitHub 部署** - 一键部署到 GitHub Pages
- **文件监控** - 实时同步文件系统变化

---

## 技术栈

- **前端框架**: React 19 + TypeScript
- **桌面框架**: Tauri v2 (Rust)
- **构建工具**: Vite 7
- **UI 组件**: Lucide React 图标库
- **Markdown**: React Markdown + Remark GFM
- **系统 API**: Tauri FS / Shell / Dialog / Process 插件

---

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

构建完成后，可执行文件位于 `src-tauri/target/release/blog-manager.exe`。

---

## 项目结构

```
blog-manager/
├── src/                    # React 前端源码
│   ├── components/         # UI 组件
│   │   ├── Dashboard.tsx   # 仪表盘
│   │   ├── ArticleList.tsx # 文章列表（含搜索/筛选）
│   │   ├── ArticleEditor.tsx # 文章编辑器（含自动保存/粘贴上传）
│   │   ├── TrashManager.tsx  # 回收站
│   │   ├── CategoryManager.tsx # 分类管理
│   │   ├── UpdateLog.tsx   # 更新日志
│   │   └── ImportMarkdown.tsx # Markdown 导入
│   ├── utils/             # 工具函数
│   │   └── blogApi.ts     # 核心 API（文件操作/部署/预览）
│   ├── types/             # TypeScript 类型定义
│   └── App.tsx            # 主应用（含导航/预览窗口）
├── src-tauri/             # Tauri 后端 (Rust)
│   ├── src/               # Rust 源码
│   ├── Cargo.toml         # Rust 依赖
│   └── capabilities/      # Tauri 权限配置
├── dist/                  # 前端构建输出
└── public/                # 静态资源
```

---

## 配置说明

首次使用前，请在应用内配置博客路径：

- **博客路径**: 你的 Hexo 博客根目录（如 `D:\hickercf_blog\blog`）

---

## 与博客的协作流程

1. 在 Blog Manager 中撰写/编辑文章
2. 自动保存草稿，防止内容丢失
3. 粘贴图片自动上传到博客目录
4. 完成后点击「发布」，生成 Hexo 文章文件
5. 点击「本地预览」检查效果
6. 确认无误后点击「部署」推送到 GitHub
7. GitHub Actions 自动构建并发布到 Pages

---

## 快捷键速查

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + S` | 保存当前文章 |
| `Ctrl + P` | 全屏预览文章 |
| `Ctrl + V` | 粘贴上传图片 |
| `Ctrl + R` | 刷新文章列表 |

---

## 许可证

MIT

## 作者

[MuZZZFeng](https://github.com/hickercf)

## 相关链接

- 🍂 [我的博客](https://hickercf.fun/)
- 📝 [Hexo](https://hexo.io/)
- 🎨 [NexT 主题](https://theme-next.js.org/)
- ⚡ [Tauri](https://tauri.app/)
