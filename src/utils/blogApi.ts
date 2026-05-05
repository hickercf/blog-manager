import { readDir, readTextFile, writeTextFile, writeFile, mkdir, remove } from "@tauri-apps/plugin-fs";
import { Command } from "@tauri-apps/plugin-shell";
import { open } from "@tauri-apps/plugin-dialog";

export interface Post {
  filename: string;
  title: string;
  date: string;
  categories: string[];
  tags: string[];
  content: string;
  status: "draft" | "published";
}

export interface Category {
  name: string;
  count: number;
  posts: Post[];
}

export interface GitHubConfig {
  repo: string;
  branch: string;
  token: string;
  username: string;
}

function parseFrontmatter(content: string): { frontmatter: Record<string, any>; body: string } {
  const normalized = content.replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }
  const fm: Record<string, any> = {};
  const lines = match[1].split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith(" ") || line.startsWith("\t")) {
      i++;
      continue;
    }
    const colonIndex = line.indexOf(":");
    if (colonIndex <= 0) {
      i++;
      continue;
    }
    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value.slice(1, -1);
      fm[key] = value.split(",").map((v) => v.trim().replace(/['"]/g, "")).filter(Boolean);
    } else if (value === "") {
      const items: string[] = [];
      let j = i + 1;
      while (j < lines.length) {
        const listMatch = lines[j].match(/^\s+-\s+(.*)/);
        if (listMatch) {
          items.push(listMatch[1].trim().replace(/['"]/g, ""));
          j++;
        } else {
          break;
        }
      }
      if (items.length > 0) {
        fm[key] = items;
        i = j;
        continue;
      }
      fm[key] = "";
    } else {
      fm[key] = value.replace(/^['"]|['"]$/g, "");
    }
    i++;
  }
  return { frontmatter: fm, body: match[2] };
}

function buildFrontmatter(data: Record<string, any>): string {
  const lines = ["---"];
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map((v) => `"${v}"`).join(", ")}]`);
    } else if (typeof value === "string") {
      lines.push(`${key}: "${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  lines.push("---", "");
  return lines.join("\n");
}

export function sanitizeFilename(title: string): string {
  return (title || "untitled")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "untitled";
}

export async function getPosts(blogPath: string): Promise<Post[]> {
  try {
    const entries = await readDir(`${blogPath}/source/_posts`);
    const posts: Post[] = [];
    for (const entry of entries) {
      if (entry.name && entry.name.endsWith(".md")) {
        const content = await readTextFile(`${blogPath}/source/_posts/${entry.name}`);
        const { frontmatter } = parseFrontmatter(content);
        posts.push({
          filename: entry.name,
          title: frontmatter.title || entry.name,
          date: frontmatter.date || "",
          categories: frontmatter.categories || [],
          tags: frontmatter.tags || [],
          content,
          status: "published",
        });
      }
    }
    return posts.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  } catch (e) {
    console.error("Failed to read posts:", e);
    return [];
  }
}

export async function getDrafts(blogPath: string): Promise<Post[]> {
  try {
    const entries = await readDir(`${blogPath}/source/_drafts`);
    const posts: Post[] = [];
    for (const entry of entries) {
      if (entry.name && entry.name.endsWith(".md")) {
        const content = await readTextFile(`${blogPath}/source/_drafts/${entry.name}`);
        const { frontmatter } = parseFrontmatter(content);
        posts.push({
          filename: entry.name,
          title: frontmatter.title || entry.name,
          date: frontmatter.date || "",
          categories: frontmatter.categories || [],
          tags: frontmatter.tags || [],
          content,
          status: "draft",
        });
      }
    }
    return posts.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  } catch {
    return [];
  }
}

export async function getAllPosts(blogPath: string): Promise<Post[]> {
  const published = await getPosts(blogPath);
  const drafts = await getDrafts(blogPath);
  return [...published, ...drafts].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

export async function getPost(blogPath: string, filename: string): Promise<Post | null> {
  try {
    // Try posts first, then drafts
    let content = "";
    let status: "draft" | "published" = "published";
    try {
      content = await readTextFile(`${blogPath}/source/_posts/${filename}`);
    } catch {
      try {
        content = await readTextFile(`${blogPath}/source/_drafts/${filename}`);
        status = "draft";
      } catch {
        return null;
      }
    }
    const { frontmatter, body } = parseFrontmatter(content);
    return {
      filename,
      title: frontmatter.title || filename,
      date: frontmatter.date || "",
      categories: frontmatter.categories || [],
      tags: frontmatter.tags || [],
      content: body,
      status,
    };
  } catch (e) {
    console.error("Failed to read post:", e);
    return null;
  }
}

export async function savePost(
  blogPath: string,
  filename: string,
  post: { title: string; date: string; categories: string[]; tags: string[]; content: string }
): Promise<void> {
  const fm = buildFrontmatter({
    title: post.title,
    date: post.date,
    categories: post.categories,
    tags: post.tags,
  });
  const fullContent = fm + post.content;
  await writeTextFile(`${blogPath}/source/_posts/${filename}`, fullContent);
}

export async function saveDraft(
  blogPath: string,
  filename: string,
  post: { title: string; date: string; categories: string[]; tags: string[]; content: string }
): Promise<void> {
  const fm = buildFrontmatter({
    title: post.title,
    date: post.date,
    categories: post.categories,
    tags: post.tags,
  });
  const fullContent = fm + post.content;
  await mkdir(`${blogPath}/source/_drafts`, { recursive: true });
  await writeTextFile(`${blogPath}/source/_drafts/${filename}`, fullContent);
}

export async function publishDraft(blogPath: string, filename: string): Promise<void> {
  const content = await readTextFile(`${blogPath}/source/_drafts/${filename}`);
  await writeTextFile(`${blogPath}/source/_posts/${filename}`, content);
  await remove(`${blogPath}/source/_drafts/${filename}`);
}

export async function deletePost(blogPath: string, filename: string): Promise<void> {
  await remove(`${blogPath}/source/_posts/${filename}`);
}

export async function moveToTrash(blogPath: string, filename: string): Promise<void> {
  const trashDir = `${blogPath}/.trash`;
  await mkdir(trashDir, { recursive: true });
  const content = await readTextFile(`${blogPath}/source/_posts/${filename}`);
  const timestamp = new Date().toISOString().slice(0, 10);
  const trashFilename = `${timestamp}_${filename}`;
  await writeTextFile(`${trashDir}/${trashFilename}`, content);
  await remove(`${blogPath}/source/_posts/${filename}`);
}

export async function getTrashItems(blogPath: string): Promise<{ filename: string; title: string; deletedDate: string }[]> {
  try {
    const entries = await readDir(`${blogPath}/.trash`);
    const items: { filename: string; title: string; deletedDate: string }[] = [];
    for (const entry of entries) {
      if (entry.name && entry.name.endsWith(".md")) {
        const content = await readTextFile(`${blogPath}/.trash/${entry.name}`);
        const { frontmatter } = parseFrontmatter(content);
        const parts = entry.name.split("_");
        const deletedDate = parts[0] || "";
        items.push({
          filename: entry.name,
          title: frontmatter.title || entry.name,
          deletedDate,
        });
      }
    }
    return items.sort((a, b) => b.deletedDate.localeCompare(a.deletedDate));
  } catch {
    return [];
  }
}

export async function restoreFromTrash(blogPath: string, trashFilename: string): Promise<void> {
  const content = await readTextFile(`${blogPath}/.trash/${trashFilename}`);
  const originalFilename = trashFilename.replace(/^\d{4}-\d{2}-\d{2}_/, "");
  await writeTextFile(`${blogPath}/source/_posts/${originalFilename}`, content);
  await remove(`${blogPath}/.trash/${trashFilename}`);
}

export async function permanentlyDelete(blogPath: string, trashFilename: string): Promise<void> {
  await remove(`${blogPath}/.trash/${trashFilename}`);
}

export async function saveImage(blogPath: string, filename: string, base64Data: string): Promise<string> {
  const imagesDir = `${blogPath}/source/images`;
  await mkdir(imagesDir, { recursive: true });

  const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
  const binaryString = atob(base64Content);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  await writeFile(`${imagesDir}/${filename}`, bytes);
  return `/images/${filename}`;
}

export async function importMarkdownFile(blogPath: string): Promise<{ success: boolean; message: string }> {
  try {
    const selected = await open({
      multiple: true,
      filters: [
        {
          name: "Markdown",
          extensions: ["md", "markdown"],
        },
      ],
    });

    if (!selected || selected.length === 0) {
      return { success: false, message: "未选择文件" };
    }

    const files = Array.isArray(selected) ? selected : [selected];
    let importedCount = 0;
    const errors: string[] = [];

    for (const filePath of files) {
      try {
        const content = await readTextFile(filePath);
        // 如果文件没有 frontmatter，添加默认的
        let finalContent = content;
        if (!content.startsWith("---")) {
          const filename = filePath.split(/[\\/]/).pop() || "imported.md";
          const title = filename.replace(/\.md$/, "");
          const fm = buildFrontmatter({
            title,
            date: new Date().toISOString().slice(0, 16).replace("T", " "),
            categories: [],
            tags: [],
          });
          finalContent = fm + content;
        }

        const filename = filePath.split(/[\\/]/).pop() || `imported-${Date.now()}.md`;
        await writeTextFile(`${blogPath}/source/_posts/${filename}`, finalContent);
        importedCount++;
      } catch (e: any) {
        errors.push(`导入失败 ${filePath}: ${e.message || e}`);
      }
    }

    if (errors.length > 0) {
      return {
        success: importedCount > 0,
        message: `成功导入 ${importedCount} 个文件，失败 ${errors.length} 个\n${errors.join("\n")}`,
      };
    }

    return { success: true, message: `成功导入 ${importedCount} 个文件` };
  } catch (e: any) {
    return { success: false, message: `导入失败: ${e.message || e}` };
  }
}

export async function getCategories(blogPath: string): Promise<Category[]> {
  const posts = await getPosts(blogPath);
  const categoryMap = new Map<string, Post[]>();
  
  for (const post of posts) {
    for (const category of post.categories) {
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(post);
    }
  }
  
  return Array.from(categoryMap.entries())
    .map(([name, posts]) => ({
      name,
      count: posts.length,
      posts: posts.sort((a, b) => (b.date || "").localeCompare(a.date || "")),
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function getAllCategoryNames(blogPath: string): Promise<string[]> {
  const categories = await getCategories(blogPath);
  return categories.map((c) => c.name);
}

export async function getUpdateLog(blogPath: string): Promise<string> {
  try {
    return await readTextFile(`${blogPath}/source/index.md`);
  } catch (e) {
    return "";
  }
}

export async function saveUpdateLog(blogPath: string, content: string): Promise<void> {
  await writeTextFile(`${blogPath}/source/index.md`, content);
}

export async function runHexoCommand(blogPath: string, command: string): Promise<string> {
  try {
    const cmd = Command.create("cmd", ["/c", `node_modules\\.bin\\hexo.cmd ${command}`], { cwd: blogPath });
    const output = await cmd.execute();
    return output.stdout + output.stderr;
  } catch (e: any) {
    try {
      const cmd = Command.create("cmd", ["/c", `npx hexo ${command}`], { cwd: blogPath });
      const output = await cmd.execute();
      return output.stdout + output.stderr;
    } catch (e2: any) {
      return `执行失败: 找不到 Hexo 命令\n\n请确保博客目录已安装 Hexo: cd ${blogPath} && npm install\n错误信息: ${e2.message || e2}\n`;
    }
  }
}

async function injectDeployToken(blogPath: string, config: GitHubConfig): Promise<void> {
  const configPath = `${blogPath}\\_config.yml`;
  const content = await readTextFile(configPath);

  const repoWithToken = `https://${config.token}@github.com/${config.username}/${config.repo}.git`;

  const updated = content.replace(
    /repo:\s*.*/g,
    `repo: ${repoWithToken}`
  );

  if (updated === content) {
    const deploySection = `deploy:\n  type: git\n  repo: ${repoWithToken}\n  branch: ${config.branch}`;
    const deployRegex = /deploy:\s*\n[\s\S]*?(?=\n\w|$)/;
    if (deployRegex.test(updated)) {
      await writeTextFile(configPath, updated.replace(deployRegex, deploySection));
      return;
    }
    await writeTextFile(configPath, updated.trimEnd() + "\n\n" + deploySection + "\n");
    return;
  }

  await writeTextFile(configPath, updated);
}

async function removeDeployToken(blogPath: string): Promise<void> {
  const configPath = `${blogPath}\\_config.yml`;
  try {
    const content = await readTextFile(configPath);
    const cleaned = content.replace(
      /repo:\s*https:\/\/[^@]+@github\.com\/(.*)/g,
      "repo: https://github.com/$1"
    );
    if (cleaned !== content) {
      await writeTextFile(configPath, cleaned);
    }
  } catch {
    // ignore cleanup errors
  }
}

export async function deployToGitHub(blogPath: string, config: GitHubConfig): Promise<string> {
  let output = "";

  output += "正在注入部署凭证...\n";
  await injectDeployToken(blogPath, config);
  output += "✓ 凭证已临时注入\n\n";

  try {
    output += "正在清理缓存...\n";
    output += await runHexoCommand(blogPath, "clean") + "\n";

    output += "正在生成静态文件...\n";
    output += await runHexoCommand(blogPath, "generate") + "\n";

    output += "正在部署到 GitHub...\n";
    output += await runHexoCommand(blogPath, "deploy") + "\n";

    output += "✓ 部署完成！\n";
    output += `访问地址：https://${config.username}.github.io/${config.repo === `${config.username}.github.io` ? "" : config.repo}\n`;
  } finally {
    await removeDeployToken(blogPath);
    output += "\n✓ 部署凭证已自动清除\n";
  }

  return output;
}
