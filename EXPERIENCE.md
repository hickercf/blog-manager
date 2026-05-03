# Blog Manager 项目开发经验记录

## 项目概述

**项目名**: Blog Manager
**定位**: 桌面端 Hexo 博客管理工具
**技术栈**: Tauri v2 + React 19 + TypeScript + Vite 7
**开发时间**: 2026年4月-5月
**代码生成方式**: 纯 AI 生成 (90% Kimi K2.6 + 8% DeepSeek V4 Pro + 2% GPT-5.5)

---

## 一、项目背景与动机

### 1.1 为什么做这个项目？

我（MuZZZFeng）维护着一个基于 Hexo + NexT 主题的个人博客。每次写博客都需要：
- 手动创建 Markdown 文件
- 编写 Front-matter（标题、日期、分类、标签等）
- 管理图片资源
- 本地预览效果
- 手动 `hexo deploy` 推送

这些重复性工作很繁琐，于是萌生了做一个桌面端管理工具的想法。

### 1.2 技术选型思路

**为什么选择 Tauri？**
- 轻量：相比 Electron，Tauri 打包体积小（最终 exe 仅 13MB）
- 安全：Rust 后端，内存安全
- 现代：基于 Web 技术栈（React + Vite），开发体验好
- 跨平台：一套代码可以打包 Windows/macOS/Linux

**为什么选择 React + TypeScript？**
- 组件化开发，维护性强
- 类型安全，减少运行时错误
- 生态丰富，有各种 UI 库可用

---

## 二、开发历程

### Phase 1: 基础框架搭建（第 1 天）

**目标**: 让 Tauri 能读写博客目录的文件

**关键步骤**:
1. 初始化 Tauri v2 项目
2. 配置 `tauri.conf.json` 的文件系统权限
3. 实现基础的文件读写 API (`blogApi.ts`)

**第一个坑: Windows 路径权限问题**
```
Tauri v2 的权限配置和 v1 不同，需要用 capabilities 文件配置
Windows 路径分隔符是 `\`，但 Tauri 的 fs:scope 需要统一用 `/`
```

**解决方案**:
```json
// src-tauri/capabilities/default.json
"permissions": [
  "fs:allow-read-file",
  "fs:allow-write-file",
  "fs:allow-read-dir",
  "fs:allow-create-dir",
  "fs:allow-remove-file",
  "fs:allow-copy-file",
  "fs:scope": ["**"]
]
```

### Phase 2: 文章 CRUD（第 1-2 天）

**目标**: 实现文章的增删改查

**设计决策**:
- 文章统一放在 `source/_posts/` 目录
- 使用 Hexo 标准的 Front-matter 格式
- 编辑器采用左右分栏（编辑 + 实时预览）

**核心 API 设计**:
```typescript
// blogApi.ts
export async function readPost(filename: string): Promise<BlogPost> 
export async function writePost(post: BlogPost): Promise<void>
export async function deletePost(filename: string): Promise<void>
export async function listPosts(): Promise<BlogPost[]>
```

**第二个坑: Front-matter 解析**
Hexo 使用 YAML 格式的 Front-matter，需要正确解析和生成。使用了简单的正则表达式处理：
```typescript
const frontMatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
```

### Phase 3: UI 界面搭建（第 2-3 天）

**目标**: 设计一个简洁好用的界面

**布局设计**:
- 左侧导航栏（文章、分类、导入、日志、设置）
- 中间主内容区
- 底部状态栏

**技术选型**:
- 图标库: Lucide React（轻量、美观）
- 样式: 纯 CSS，没有引入 Tailwind（保持简洁）
- Markdown 渲染: React Markdown + Remark GFM

**设计原则**:
- 少即是多：不要太多按钮和功能，聚焦核心需求
- 即时反馈：操作后有 toast 提示
- 防误操作：删除前确认

### Phase 4: 分类管理（第 3 天）

**目标**: 管理博客分类

**实现思路**:
- Hexo 的分类就是 `source/_posts/` 下的子目录
- 列出所有子目录即为分类列表
- 新建分类 = 创建新目录
- 删除分类 = 删除目录（如果为空）

### Phase 5: GitHub 部署（第 3-4 天）

**目标**: 一键推送到 GitHub Pages

**实现方案**:
1. 调用 `git add .`
2. 调用 `git commit -m "update blog"`
3. 调用 `git push origin main`

**第三个坑: Git 命令执行**
```
Tauri 的 Shell API 在 Windows 下执行 Git 命令会有路径问题
需要用 cmd /c 包装命令
```

**解决方案**:
```typescript
const command = `cd "${blogPath}" && git add . && git commit -m "update" && git push origin main`
await execute(command)
```

**第四个坑: GitHub Token 权限**
```
第一次推送报错 403，原因是 Token 权限不足
```

**解决方案**: 使用 GitHub Classic Token，赋予 `repo` 完全权限

### Phase 6: 博客主题改造（第 4-7 天）

**目标**: 把默认的 NexT 主题改造成秋天风格

**改造内容**:
1. **配色方案**: 暖黄色背景 `#faf5eb`，枫叶红强调色
2. **动态背景**: Canvas 绘制飘落的枫叶动画
3. **毛玻璃效果**: 卡片使用 `backdrop-filter: blur()`
4. **字体**: Google Fonts 引入思源宋体
5. **标题**: 渐变色动态效果

**第五个坑: CSS 优先级问题**
```
NexT 主题的样式权重很高，自定义样式容易被覆盖
```

**解决方案**: 使用 `!important` 或者在 `source/_data/styles.styl` 中定义，并确保选择器优先级足够高

**第六个坑: `body::before` 白色遮罩**
```
主题默认在 body 前加一个白色伪元素，导致自定义背景被遮住
```

**解决方案**: 直接移除 `body::before` 样式

### Phase 7: 功能增强（第 7-10 天）

**新增功能清单**:

#### 7.1 搜索功能
- 支持按标题、内容搜索
- 实时过滤，无需回车
- 高亮显示匹配结果

#### 7.2 文章状态
- 已发布（`source/_posts/`）
- 草稿（`source/_drafts/`）
- 状态切换功能

#### 7.3 图片粘贴上传
- 监听 `Ctrl+V` 事件
- 读取剪贴板图片数据
- 保存到博客 `source/img/` 目录
- 自动生成 Markdown 图片链接

**第七个坑: 剪贴板图片处理**
```
浏览器的 Clipboard API 限制很多，Tauri 提供了原生支持
```

**解决方案**: 使用 Tauri 的 Dialog + FS API，配合前端事件监听

#### 7.4 自动保存
- 每 30 秒自动保存草稿
- 防抖处理，避免频繁写入
- 保存状态指示器（正在保存... / 已保存）

#### 7.5 仪表盘
- 统计文章总数、草稿数、分类数
- 最近文章列表
- 快捷操作入口

#### 7.6 回收站
- 删除的文章移动到回收站
- 支持一键恢复
- 支持永久删除
- 清空回收站功能

#### 7.7 本地预览
- 调用 `hexo server` 启动本地服务器
- 在应用内打开浏览器窗口预览
- 支持停止服务器

**第八个坑: Hexo 服务器进程管理**
```
hexo server 是常驻进程，需要正确管理生命周期
```

**解决方案**: 使用 Tauri 的 Process API，记录进程 PID，关闭时 kill 进程

#### 7.8 快捷键
- `Ctrl+S`: 保存
- `Ctrl+P`: 预览
- `Ctrl+V`: 粘贴图片

### Phase 8: 文档与构建（第 10 天）

**目标**: 完善 README，构建 exe

**README 编写要点**:
- 项目简介
- 功能列表
- 技术栈
- 快速开始
- 项目结构
- 配置说明
- 使用流程

**构建过程**:
```bash
npm run tauri build
```

**第九个坑: MSI 打包超时**
```
默认构建会生成 MSI 安装包，需要下载 WiX 工具，网络超时
```

**解决方案**: exe 文件本身已经生成在 `target/release/` 目录，MSI 不是必须的

---

## 三、核心代码片段

### 3.1 文件读写核心逻辑
```typescript
// blogApi.ts
import { readTextFile, writeTextFile, readDir, remove } from '@tauri-apps/plugin-fs'

export async function readPost(filename: string): Promise<BlogPost> {
  const content = await readTextFile(`${POSTS_PATH}/${filename}`)
  const { frontMatter, body } = parseFrontMatter(content)
  return {
    title: frontMatter.title || '',
    date: frontMatter.date || new Date().toISOString(),
    category: frontMatter.category || '',
    tags: frontMatter.tags || [],
    content: body,
    filename
  }
}
```

### 3.2 图片粘贴上传
```typescript
// ArticleEditor.tsx
const handlePaste = async (e: ClipboardEvent) => {
  const items = e.clipboardData?.items
  if (!items) return

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        const reader = new FileReader()
        reader.onload = async () => {
          const base64 = reader.result as string
          const filename = `img-${Date.now()}.png`
          await saveImage(base64, filename)
          insertImageMarkdown(filename)
        }
        reader.readAsDataURL(file)
      }
    }
  }
}
```

### 3.3 自动保存
```typescript
// 使用 useEffect + setInterval
useEffect(() => {
  const timer = setInterval(() => {
    if (hasUnsavedChanges) {
      autoSave()
    }
  }, 30000)
  return () => clearInterval(timer)
}, [hasUnsavedChanges])
```

### 3.4 Hexo 命令执行
```typescript
export async function executeHexoCommand(blogPath: string, command: string): Promise<string> {
  const fullCommand = `cd "${blogPath}" && hexo ${command}`
  // Windows 下需要用 cmd /c
  const result = await execute(`cmd /c "${fullCommand}"`)
  return result.stdout
}
```

---

## 四、遇到的坑与解决方案汇总

| 坑 | 原因 | 解决方案 |
|---|---|---|
| Windows 路径权限 | Tauri v2 权限配置方式变化 | capabilities 文件配置 fs:scope |
| Git 命令执行失败 | Windows shell 差异 | 使用 cmd /c 包装 |
| GitHub 403 | Token 权限不足 | 使用 Classic Token + repo 权限 |
| CSS 被覆盖 | NexT 权重高 | 提高选择器优先级 / !important |
| 白色遮罩 | body::before 伪元素 | 移除伪元素样式 |
| 剪贴板限制 | 浏览器安全策略 | Tauri 原生 API |
| Hexo 进程管理 | 常驻进程 | Process API + PID 管理 |
| MSI 打包超时 | 下载 WiX 工具网络问题 | 直接使用 exe |

---

## 五、设计心得

### 5.1 关于 AI 编程

**优势**:
- 快速原型：几天内从零到有完整应用
- 代码质量：AI 生成的代码结构清晰，注释完善
- 学习工具：通过 AI 解释学习新技术

**局限**:
- 上下文限制：长对话会丢失早期细节
- 调试困难：AI 不擅长处理复杂的环境问题
- 架构设计：需要人类把控整体架构

**最佳实践**:
- 分阶段开发，每阶段验证后再继续
- 遇到报错先搜索，再让 AI 分析
- 保持代码整洁，方便 AI 理解上下文

### 5.2 关于功能设计

**Less is More**:
- 刚开始列了 13 个功能，后来砍到 8 个
- 用户（我自己）真正需要的：写文章、传图片、分类、发布
- 不要为炫技而加功能

**用户反馈循环**:
- 自己就是用户，用起来不顺手就改
- 快捷键、自动保存都是"用起来发现需要"才加的

### 5.3 关于博客主题

**一致性很重要**:
- 颜色、字体、间距要统一
- 动画不要太多，会分散注意力
- 移动端适配不能忘

**性能考虑**:
- Canvas 动画要控制粒子数量
- 图片懒加载
- CSS 动画使用 transform 而不是改变布局属性

---

## 六、未来展望

### 可能的改进方向

1. **AI 辅助写作**
   - 接入大模型 API，帮助润色文章
   - 自动生成摘要和标签

2. **多博客支持**
   - 管理多个 Hexo 博客
   - 切换配置文件

3. **主题市场**
   - 内置多种主题模板
   - 一键切换风格

4. **插件系统**
   - 支持第三方插件
   - 扩展功能

5. **协作功能**
   - 多用户编辑
   - 评论管理

### 技术债务

- [ ] 错误处理可以更完善（现在有很多 `any` 类型）
- [ ] 单元测试覆盖率低
- [ ] 国际化支持（目前是中文界面）
- [ ] 自动更新机制

---

## 七、总结

### 项目数据

- **总开发时间**: 约 10 天
- **代码行数**: ~5000 行（前端 + Rust 后端）
- **功能数量**: 20+ 个
- **打包体积**: 13.3 MB
- **GitHub Stars**: 0（还没推广😅）

### 最大收获

1. **Tauri 很实用**: 比 Electron 轻量很多，适合个人开发者
2. **AI 是加速器**: 不是替代品，善用 AI 可以 10x 效率
3. **自己当用户**: 做工具给自己用，能做出真正好用的产品
4. **文档很重要**: README 写清楚，未来自己看都方便

### 一句话总结

> 用最简单的技术栈，解决最实际的问题，做给自己用的工具，往往能做到最好。

---

*记录时间: 2026年5月3日*
*作者: MuZZZFeng*
*项目地址: https://github.com/hickercf/blog-manager*
