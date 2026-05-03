import { readDir, readTextFile, writeTextFile, remove } from "@tauri-apps/plugin-fs";
import { Command } from "@tauri-apps/plugin-shell";
import { open } from "@tauri-apps/plugin-dialog";

export interface Post {
  filename: string;
  title: string;
  date: string;
  categories: string[];
  tags: string[];
  content: string;
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
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }
  const fm: Record<string, any> = {};
  const lines = match[1].split("\n");
  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      if (value.startsWith("[") && value.endsWith("]")) {
        value = value.slice(1, -1);
        fm[key] = value.split(",").map((v) => v.trim().replace(/['"]/g, ""));
      } else {
        fm[key] = value.replace(/['"]/g, "");
      }
    }
  }
  return { frontmatter: fm, body: match[2] };
}

function buildFrontmatter(data: Record<string, any>): string {
  const lines = ["---"];
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map((v) => `"${v}"`).join(", ")}]`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  lines.push("---", "");
  return lines.join("\n");
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
        });
      }
    }
    return posts.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  } catch (e) {
    console.error("Failed to read posts:", e);
    return [];
  }
}

export async function getPost(blogPath: string, filename: string): Promise<Post | null> {
  try {
    const content = await readTextFile(`${blogPath}/source/_posts/${filename}`);
    const { frontmatter, body } = parseFrontmatter(content);
    return {
      filename,
      title: frontmatter.title || filename,
      date: frontmatter.date || "",
      categories: frontmatter.categories || [],
      tags: frontmatter.tags || [],
      content: body,
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

export async function deletePost(blogPath: string, filename: string): Promise<void> {
  await remove(`${blogPath}/source/_posts/${filename}`);
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
  let cmd;
  
  try {
    // Method 1: Use cmd.exe to run local hexo
    cmd = Command.create("cmd", ["/c", `node_modules\\.bin\\hexo.cmd ${command}`], { cwd: blogPath });
    const output = await cmd.execute();
    return output.stdout + output.stderr;
  } catch (e: any) {
    try {
      // Method 2: Use cmd.exe to run npx hexo
      cmd = Command.create("cmd", ["/c", `npx hexo ${command}`], { cwd: blogPath });
      const output = await cmd.execute();
      return output.stdout + output.stderr;
    } catch (e2: any) {
      return `执行失败: 找不到 Hexo 命令\n\n请确保博客目录已安装 Hexo: cd ${blogPath} && npm install\n错误信息: ${e2.message || e2}\n`;
    }
  }
}

export async function configureGitHubDeploy(blogPath: string, config: GitHubConfig): Promise<void> {
  const configPath = `${blogPath}\\_config.yml`;
  let content = "";
  try {
    content = await readTextFile(configPath);
  } catch (e: any) {
    throw new Error(`无法读取 _config.yml\n路径: ${configPath}\n错误: ${e.message || e}`);
  }

  const deployConfig = `deploy:
  type: git
  repo: https://${config.token}@github.com/${config.username}/${config.repo}.git
  branch: ${config.branch}`;

  const deployRegex = /deploy:\s*\n[\s\S]*?(?=\n\w|$)/;
  if (deployRegex.test(content)) {
    content = content.replace(deployRegex, deployConfig);
  } else {
    content = content.trim() + "\n\n" + deployConfig;
  }

  await writeTextFile(configPath, content);
}

export async function deployToGitHub(blogPath: string, config: GitHubConfig): Promise<string> {
  let output = "";
  
  // Step 1: Configure GitHub deploy
  output += "正在配置 GitHub 部署...\n";
  await configureGitHubDeploy(blogPath, config);
  output += "✓ GitHub 配置已更新\n\n";
  
  // Step 2: Generate static files
  output += "正在生成静态文件...\n";
  const generateOutput = await runHexoCommand(blogPath, "generate");
  output += generateOutput + "\n";
  
  // Step 3: Deploy
  output += "正在部署到 GitHub...\n";
  const deployOutput = await runHexoCommand(blogPath, "deploy");
  output += deployOutput + "\n";
  
  output += "✓ 部署完成！\n";
  output += `访问地址：https://${config.username}.github.io/${config.repo === `${config.username}.github.io` ? "" : config.repo}\n`;
  
  return output;
}
