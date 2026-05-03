# Learnings

Corrections, insights, and knowledge gaps captured during development.

**Categories**: correction | insight | knowledge_gap | best_practice

---

## [LRN-20260503-001] best_practice

**Logged**: 2026-05-03T16:55:00+08:00
**Priority**: high
**Status**: resolved
**Area**: config

### Summary
Tauri 2.0 文件系统权限需要显式配置 scope，否则会出现 "forbidden path" 错误

### Details
在构建博客管理器桌面应用时，使用 `@tauri-apps/plugin-fs` 读写 `_config.yml` 时遇到 `forbidden path: D:\hickercf_blog\blog\_config.yml` 错误。Tauri 2.0 的权限系统比 1.0 更严格，即使声明了 `fs:allow-read-file` 和 `fs:allow-write-file`，也需要在 capabilities 中配置具体的 path scope。

**错误配置：**
```json
{
  "identifier": "fs:allow-read-file",
  "allow": [{"path": "D:\\hickercf_blog\\blog"}]
}
```

**正确配置（使用通配符）：**
```json
{
  "identifier": "fs:scope",
  "allow": [{"path": "**"}]
}
```

或更精确地：
```json
{
  "identifier": "fs:allow-read-file",
  "allow": [{"path": "D:\\hickercf_blog\\blog\\**"}]
}
```

### Suggested Action
- 在 `src-tauri/capabilities/default.json` 中配置 `fs:scope` 权限
- 开发阶段可以使用 `"allow": [{"path": "**"}]` 快速验证
- 生产环境应限制为具体的博客目录

### Metadata
- Source: error
- Related Files: `src-tauri/capabilities/default.json`
- Tags: tauri, fs, permissions, windows

---

## [LRN-20260503-002] best_practice

**Logged**: 2026-05-03T16:55:00+08:00
**Priority**: high
**Status**: resolved
**Area**: infra

### Summary
Tauri 2.0 shell 插件执行命令需要显式配置允许执行的命令，且使用 `cmd /c` 在 Windows 上执行本地脚本更可靠

### Details
在 Windows 上执行 Hexo 命令时，直接调用 `node_modules/.bin/hexo.cmd` 会触发 `program not allowed on the configured shell scope` 错误。即使配置了完整路径，Tauri 的 shell scope 检查仍然可能失败。

**解决方案：**
使用 `cmd.exe` 作为中间层执行命令：
```typescript
Command.create("cmd", ["/c", `node_modules\\.bin\\hexo.cmd ${command}`], { cwd: blogPath })
```

同时在 capabilities 中添加：
```json
{
  "args": true,
  "cmd": "cmd",
  "name": "cmd"
}
```

### Suggested Action
- Windows 环境下优先使用 `cmd /c` 执行本地脚本
- 在 capabilities 中注册 `cmd` 命令权限
- 对 `npx`、`npm` 等常用命令也需要单独注册

### Metadata
- Source: error
- Related Files: `src/utils/blogApi.ts`, `src-tauri/capabilities/default.json`
- Tags: tauri, shell, windows, hexo

---

## [LRN-20260503-003] knowledge_gap

**Logged**: 2026-05-03T16:55:00+08:00
**Priority**: medium
**Status**: resolved
**Area**: config

### Summary
GitHub Fine-grained Token 的 `Contents: Read and write` 权限不足以进行 git push 操作，需要使用 Classic Token 或确保 Token 有 `repo` 权限

### Details
用户创建了 Fine-grained Personal Access Token，赋予了 `Contents: Read and write` 权限，但在执行 `hexo deploy` 时仍然收到 `403 Forbidden` 错误。原因是 Hexo 的 git deployer 使用 HTTPS 方式推送，需要完整的仓库写入权限。

**解决方案：**
1. 使用 GitHub Classic Token（`ghp_xxx` 格式）
2. 勾选 `repo` 权限（包含所有子权限）
3. 或在 Fine-grained Token 中确保选择了正确的仓库并赋予足够权限

### Suggested Action
- 文档中明确说明需要使用 Classic Token
- 在应用中添加 Token 格式验证（检查是否以 `ghp_` 开头）
- 提供更详细的 GitHub Token 创建指引

### Metadata
- Source: error
- Related Files: `src/utils/blogApi.ts`
- Tags: github, token, permissions, deployment

---

## [LRN-20260503-004] best_practice

**Logged**: 2026-05-03T16:55:00+08:00
**Priority**: medium
**Status**: resolved
**Area**: config

### Summary
Tauri 生产构建时，`tauri.conf.json` 中的 `devUrl` 和 `beforeDevCommand` 会导致生产环境仍然尝试连接 localhost

### Details
如果在 `tauri.conf.json` 中配置了 `devUrl` 和 `beforeDevCommand` 用于开发环境，生产构建时如果没有正确配置 `frontendDist` 或构建产物路径，应用会尝试连接开发服务器。

**正确配置：**
```json
{
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:1420",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  }
}
```

确保生产构建时 `frontendDist` 指向正确的静态文件目录。

### Suggested Action
- 开发环境使用 `devUrl` + `beforeDevCommand`
- 生产环境使用 `frontendDist` + `beforeBuildCommand`
- 构建完成后检查 `target/release` 目录下的 exe 是否能独立运行

### Metadata
- Source: insight
- Related Files: `src-tauri/tauri.conf.json`
- Tags: tauri, build, production, config

---

## [LRN-20260503-005] best_practice

**Logged**: 2026-05-03T16:55:00+08:00
**Priority**: medium
**Status**: resolved
**Area**: config

### Summary
Hexo 配置中的 `deploy` 字段需要动态注入，不应直接修改用户的 `_config.yml`

### Details
为了支持一键部署，需要在 `_config.yml` 中添加或更新 `deploy` 配置。但直接修改用户的主配置文件可能导致格式错误或用户自定义配置丢失。

**解决方案：**
使用 YAML 解析库读取配置，修改 deploy 部分后再写回：
```typescript
import { parse, stringify } from "yaml";

async function injectDeployConfig(blogPath: string, token: string) {
  const configPath = `${blogPath}\\_config.yml`;
  const content = await readTextFile(configPath);
  const config = parse(content);
  
  config.deploy = {
    type: "git",
    repo: `https://${token}@github.com/hickercf/hickercf.github.io.git`,
    branch: "main"
  };
  
  await writeTextFile(configPath, stringify(config));
}
```

### Suggested Action
- 使用 YAML 库解析和序列化配置
- 修改前备份原始配置
- 提供配置预览功能让用户确认变更

### Metadata
- Source: best_practice
- Related Files: `src/utils/blogApi.ts`
- Tags: hexo, yaml, config, deployment

---

## [LRN-20260503-006] insight

**Logged**: 2026-05-03T16:55:00+08:00
**Priority**: low
**Status**: resolved
**Area**: ui

### Summary
`0 files generated` 的 Hexo 日志输出具有误导性，实际上文件已成功生成

### Details
执行 `hexo generate` 时，日志显示 `0 files generated`，但实际上 `public/` 目录下的文件已被正确渲染。这是因为 Hexo 的日志统计逻辑在特定配置下计数不准确，不影响实际功能。

### Suggested Action
- 不依赖 `files generated` 计数判断构建是否成功
- 检查 `public/` 目录是否存在且包含预期文件
- 在 UI 中显示更准确的构建状态

### Metadata
- Source: insight
- Related Files: N/A
- Tags: hexo, logging, misleading

---

## [LRN-20260503-007] insight

**Logged**: 2026-05-03T16:55:00+08:00
**Priority**: low
**Status**: resolved
**Area**: ui

### Summary
PowerShell 默认编码可能导致中文文件名显示为乱码，但文件本身编码正常

### Details
在 Windows PowerShell 中列出包含中文文件名的目录时，如果未设置 `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8`，中文会显示为 `���` 乱码。这是终端显示问题，不影响文件系统实际编码。

**解决方案：**
```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Get-ChildItem -Path "D:\hickercf_blog\blog\source\_posts"
```

### Suggested Action
- 在需要显示中文的 PowerShell 会话中预先设置 UTF-8 编码
- 或使用 `cmd /c dir` 等替代命令

### Metadata
- Source: insight
- Related Files: N/A
- Tags: windows, powershell, encoding, chinese