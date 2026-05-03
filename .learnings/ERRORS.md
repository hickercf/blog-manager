# Errors

Command failures and integration errors.

---

## [ERR-20260503-001] tauri-fs-forbidden-path

**Logged**: 2026-05-03T16:55:00+08:00
**Priority**: high
**Status**: resolved
**Area**: config

### Summary
Tauri 2.0 文件系统插件拒绝访问博客目录下的 `_config.yml` 文件

### Error
```
forbidden path: D:\hickercf_blog\blog\_config.yml
```

### Context
- 操作：尝试读取 `_config.yml` 以配置 GitHub 部署信息
- 文件存在且路径正确
- 已配置 `fs:allow-read-file` 权限
- Tauri 版本：2.11.0

### Suggested Fix
在 `capabilities/default.json` 中添加 `fs:scope` 权限，允许访问博客目录：
```json
{
  "identifier": "fs:scope",
  "allow": [{"path": "**"}]
}
```

### Metadata
- Reproducible: yes
- Related Files: `src-tauri/capabilities/default.json`

---

## [ERR-20260503-002] tauri-shell-scope-denied

**Logged**: 2026-05-03T16:55:00+08:00
**Priority**: high
**Status**: resolved
**Area**: config

### Summary
Tauri shell 插件拒绝执行 `node_modules/.bin/hexo.cmd`

### Error
```
program not allowed on the configured shell scope: D:\hickercf_blog\blog/node_modules/.bin/hexo.cmd
```

### Context
- 操作：执行 Hexo 生成命令
- 已配置完整的文件路径在 shell scope 中
- 问题：Tauri 对完整路径的执行权限检查过于严格

### Suggested Fix
使用 `cmd /c` 间接执行：
```typescript
Command.create("cmd", ["/c", "node_modules\\.bin\\hexo.cmd generate"], { cwd })
```

### Metadata
- Reproducible: yes
- Related Files: `src/utils/blogApi.ts`, `src-tauri/capabilities/default.json`

---

## [ERR-20260503-003] github-token-403

**Logged**: 2026-05-03T16:55:00+08:00
**Priority**: high
**Status**: resolved
**Area**: infra

### Summary
GitHub Fine-grained Token 权限不足，部署时返回 403 错误

### Error
```
remote: Permission to hickercf/hickercf.github.io.git denied to hickercf.
fatal: unable to access 'https://github.com/hickercf/hickercf.github.io.git/': The requested URL returned error: 403
```

### Context
- 使用 Fine-grained Personal Access Token
- 已授予 `Contents: Read and write` 权限
- 问题：Fine-grained Token 的权限模型与 Classic Token 不同

### Suggested Fix
使用 GitHub Classic Token（`ghp_xxx` 格式）并确保勾选 `repo` 权限。

### Metadata
- Reproducible: yes
- Related Files: `src/utils/blogApi.ts`

---

## [ERR-20260503-004] tauri-build-linker-missing

**Logged**: 2026-05-03T16:55:00+08:00
**Priority**: high
**Status**: resolved
**Area**: infra

### Summary
Windows 上编译 Tauri 应用时缺少 Visual C++ 链接器

### Error
```
error: linker `link.exe` not found
note: please ensure that Visual Studio 2017 or later, or Build Tools for Visual Studio were installed with the Visual C++ option
```

### Context
- 操作系统：Windows 10/11
- 已安装 Rust
- 缺少 MSVC 构建工具

### Suggested Fix
安装 Visual Studio Build Tools：
```powershell
winget install Microsoft.VisualStudio.2022.BuildTools --override "--wait --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

### Metadata
- Reproducible: yes (首次在 Windows 安装 Rust 时)
- Related Files: N/A

---

## [ERR-20260503-005] tauri-build-timeout

**Logged**: 2026-05-03T16:55:00+08:00
**Priority**: medium
**Status**: resolved
**Area**: infra

### Summary
Rust 工具链和 Tauri 依赖下载/编译时间过长导致超时

### Error
```
command terminated after exceeding timeout 600000 ms
```

### Context
- 在国内网络环境下下载 Rust 依赖较慢
- 首次编译需要下载大量 crates
- Visual Studio Build Tools 安装也需要较长时间

### Suggested Fix
1. 使用国内镜像加速 Rust 下载：
   ```powershell
   $env:RUSTUP_DIST_SERVER="https://rsproxy.cn"
   $env:RUSTUP_UPDATE_ROOT="https://rsproxy.cn/rustup"
   ```
2. 提前告知用户编译需要 5-10 分钟
3. 考虑提供预编译的二进制文件

### Metadata
- Reproducible: yes (首次编译时)
- Related Files: N/A
