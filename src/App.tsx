import { useState, useEffect } from "react";
import {
  FileText,
  Settings as SettingsIcon,
  ClipboardList,
  Play,
  Upload,
  Globe,
  Moon,
  Sun,
  Folder,
} from "lucide-react";
import { runHexoCommand, deployToGitHub, GitHubConfig } from "./utils/blogApi";
import ArticleList from "./components/ArticleList";
import ArticleEditor from "./components/ArticleEditor";
import UpdateLog from "./components/UpdateLog";
import Settings from "./components/Settings";
import CategoryManager from "./components/CategoryManager";
import "./App.css";

type View = "articles" | "editor" | "update-log" | "settings" | "categories";

function App() {
  const [view, setView] = useState<View>("articles");
  const [editFilename, setEditFilename] = useState<string | null>(null);
  const [blogPath, setBlogPath] = useState("D:\\hickercf_blog\\blog");
  const [darkMode, setDarkMode] = useState(true);
  const [commandOutput, setCommandOutput] = useState("");
  const [runningCommand, setRunningCommand] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("blogPath");
    if (saved) setBlogPath(saved);
    const savedDark = localStorage.getItem("darkMode");
    if (savedDark) {
      setDarkMode(savedDark === "true");
    } else {
      // Default to dark mode
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", String(darkMode));
    if (!darkMode) {
      document.body.classList.add("light");
    } else {
      document.body.classList.remove("light");
    }
  }, [darkMode]);

  function handleChangePath(newPath: string) {
    setBlogPath(newPath);
    localStorage.setItem("blogPath", newPath);
  }

  function handleEdit(filename: string) {
    setEditFilename(filename);
    setView("editor");
  }

  function handleCreate() {
    setEditFilename(null);
    setView("editor");
  }

  function handleBackToArticles() {
    setEditFilename(null);
    setView("articles");
  }

  function handleViewPostFromCategory(filename: string) {
    setEditFilename(filename);
    setView("editor");
  }

  async function runCommand(command: string) {
    setRunningCommand(command);
    
    if (command === "deploy") {
      // Check if GitHub config exists
      const savedConfig = localStorage.getItem("githubConfig");
      if (!savedConfig) {
        setCommandOutput("错误：未配置 GitHub 仓库信息\n\n请在【设置】页面配置 GitHub 仓库后再部署。\n");
        setRunningCommand(null);
        return;
      }
      
      const config: GitHubConfig = JSON.parse(savedConfig);
      if (!config.username || !config.repo || !config.token) {
        setCommandOutput("错误：GitHub 配置不完整\n\n请填写完整的用户名、仓库名和 Token。\n");
        setRunningCommand(null);
        return;
      }
      
      setCommandOutput("开始一键部署...\n\n");
      try {
        const output = await deployToGitHub(blogPath, config);
        setCommandOutput((prev) => prev + output);
      } catch (e: any) {
        setCommandOutput((prev) => prev + `部署失败: ${e.message || e}\n`);
      }
    } else {
      setCommandOutput(`执行 hexo ${command}...\n`);
      try {
        const output = await runHexoCommand(blogPath, command);
        setCommandOutput((prev) => prev + output);
      } catch (e: any) {
        setCommandOutput((prev) => prev + `错误: ${e.message || e}\n`);
      }
    }
    
    setRunningCommand(null);
  }

  const navItems = [
    { id: "articles" as View, label: "文章管理", icon: FileText },
    { id: "categories" as View, label: "分类管理", icon: Folder },
    { id: "update-log" as View, label: "更新日志", icon: ClipboardList },
    { id: "settings" as View, label: "设置", icon: SettingsIcon },
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>博客管理器</h1>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${view === item.id ? "active" : ""}`}
              onClick={() => setView(item.id)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-actions">
          <button
            onClick={() => runCommand("generate")}
            disabled={runningCommand !== null}
            className="action-button"
          >
            <Play size={16} /> 生成站点
          </button>
          <button
            onClick={() => runCommand("deploy")}
            disabled={runningCommand !== null}
            className="action-button"
          >
            <Upload size={16} /> 部署上线
          </button>
          <button
            onClick={() => runCommand("server")}
            disabled={runningCommand !== null}
            className="action-button"
          >
            <Globe size={16} /> 本地预览
          </button>
        </div>

        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)} title="切换主题">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </aside>

      <main className="main">
        {view === "articles" && (
          <ArticleList blogPath={blogPath} onEdit={handleEdit} onCreate={handleCreate} />
        )}
        {view === "editor" && (
          <ArticleEditor blogPath={blogPath} filename={editFilename} onBack={handleBackToArticles} />
        )}
        {view === "categories" && (
          <CategoryManager
            blogPath={blogPath}
            onViewPost={handleViewPostFromCategory}
            onBack={() => setView("articles")}
          />
        )}
        {view === "update-log" && <UpdateLog blogPath={blogPath} />}
        {view === "settings" && <Settings blogPath={blogPath} onChangePath={handleChangePath} />}

        {commandOutput && (
          <div className="command-output">
            <div className="command-output-header">
              <span>命令输出</span>
              <button className="icon-button" onClick={() => setCommandOutput("")}>清除</button>
            </div>
            <pre>{commandOutput}</pre>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
