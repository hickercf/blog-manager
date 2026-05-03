import { useState, useEffect } from "react";
import { FileText, Edit, Trash2, Plus, RefreshCw, Upload } from "lucide-react";
import { getPosts, deletePost, importMarkdownFile, Post } from "../utils/blogApi";

interface ArticleListProps {
  blogPath: string;
  onEdit: (filename: string) => void;
  onCreate: () => void;
}

export default function ArticleList({ blogPath, onEdit, onCreate }: ArticleListProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadPosts() {
    setLoading(true);
    const data = await getPosts(blogPath);
    setPosts(data);
    setLoading(false);
  }

  useEffect(() => {
    loadPosts();
  }, [blogPath]);

  async function handleDelete(filename: string) {
    if (!confirm(`确定要删除 "${filename}" 吗？`)) return;
    await deletePost(blogPath, filename);
    await loadPosts();
  }

  async function handleImport() {
    const result = await importMarkdownFile(blogPath);
    alert(result.message);
    if (result.success) {
      await loadPosts();
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>文章列表</h2>
        <div className="button-group">
          <button onClick={loadPosts} disabled={loading} className="icon-button">
            <RefreshCw size={16} className={loading ? "spin" : ""} />
          </button>
          <button onClick={handleImport} className="action-button">
            <Upload size={16} /> 导入文件
          </button>
          <button onClick={onCreate} className="primary-button">
            <Plus size={16} /> 新建文章
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>标题</th>
              <th>日期</th>
              <th>分类</th>
              <th>标签</th>
              <th style={{ width: 100 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.filename}>
                <td>
                  <div className="title-cell">
                    <FileText size={16} />
                    <span>{post.title}</span>
                  </div>
                </td>
                <td>{post.date?.split(" ")[0] || "-"}</td>
                <td>
                  <div className="tag-list">
                    {post.categories.map((c) => (
                      <span key={c} className="badge badge-category">{c}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="tag-list">
                    {post.tags.map((t) => (
                      <span key={t} className="badge badge-tag">{t}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button onClick={() => onEdit(post.filename)} className="icon-button" title="编辑">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(post.filename)} className="icon-button danger" title="删除">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">暂无文章</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
