import { useState, useEffect } from "react";
import { FolderOpen, Save, GitBranch, Key, Globe } from "lucide-react";

interface SettingsProps {
  blogPath: string;
  onChangePath: (path: string) => void;
}

interface GitHubConfig {
  repo: string;
  branch: string;
  token: string;
  username: string;
}

export default function Settings({ blogPath, onChangePath }: SettingsProps) {
  const [path, setPath] = useState(blogPath);
  const [githubConfig, setGithubConfig] = useState<GitHubConfig>({
    repo: "",
    branch: "main",
    token: "",
    username: "",
  });

  useEffect(() => {
    setPath(blogPath);
    // Load saved GitHub config
    const saved = localStorage.getItem("githubConfig");
    if (saved) {
      setGithubConfig(JSON.parse(saved));
    }
  }, [blogPath]);

  function handleSave() {
    onChangePath(path);
    localStorage.setItem("githubConfig", JSON.stringify(githubConfig));
    alert("设置已保存！");
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>设置</h2>
      </div>

      <div className="settings-form">
        <div className="form-group">
          <label>博客路径</label>
          <div className="input-row">
            <FolderOpen size={18} />
            <input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="D:\hickercf_blog\blog"
              style={{ flex: 1 }}
            />
          </div>
          <p className="help-text">Hexo 博客目录的路径</p>
        </div>

        <div className="settings-section">
          <h3><GitBranch size={18} /> GitHub 配置</h3>
          
          <div className="form-group">
            <label>GitHub 用户名</label>
            <div className="input-row">
              <Globe size={18} />
              <input
                value={githubConfig.username}
                onChange={(e) => setGithubConfig({ ...githubConfig, username: e.target.value })}
                placeholder="your-username"
                style={{ flex: 1 }}
              />
            </div>
            <p className="help-text">你的 GitHub 用户名</p>
          </div>

          <div className="form-group">
            <label>仓库名称</label>
            <div className="input-row">
              <GitBranch size={18} />
              <input
                value={githubConfig.repo}
                onChange={(e) => setGithubConfig({ ...githubConfig, repo: e.target.value })}
                placeholder="username.github.io"
                style={{ flex: 1 }}
              />
            </div>
            <p className="help-text">GitHub Pages 仓库名，如：hickercf.github.io</p>
          </div>

          <div className="form-group">
            <label>分支</label>
            <div className="input-row">
              <Globe size={18} />
              <input
                value={githubConfig.branch}
                onChange={(e) => setGithubConfig({ ...githubConfig, branch: e.target.value })}
                placeholder="main"
                style={{ flex: 1 }}
              />
            </div>
            <p className="help-text">部署分支，通常是 main 或 master</p>
          </div>

          <div className="form-group">
            <label>GitHub Token</label>
            <div className="input-row">
              <Key size={18} />
              <input
                type="password"
                value={githubConfig.token}
                onChange={(e) => setGithubConfig({ ...githubConfig, token: e.target.value })}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                style={{ flex: 1 }}
              />
            </div>
            <p className="help-text">
              Personal Access Token，需要有 repo 权限。
              <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">
                点击生成 Token
              </a>
            </p>
          </div>
        </div>

        <button onClick={handleSave} className="primary-button">
          <Save size={16} /> 保存设置
        </button>
      </div>
    </div>
  );
}
