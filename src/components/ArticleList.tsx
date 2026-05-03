import { useState, useEffect } from "react";
import { FileText, Edit, Trash2, Plus, RefreshCw, Upload, Search, RotateCcw, Send } from "lucide-react";
import { getAllPosts, moveToTrash, importMarkdownFile, publishDraft, Post } from "../utils/blogApi";

interface ArticleListProps {
  blogPath: string;
  onEdit: (filename: string) => void;
  onCreate: () => void;
}

export default function ArticleList({ blogPath, onEdit, onCreate }: ArticleListProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState<"all" | "title" | "content" | "category" | "tag">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  async function loadPosts() {
    setLoading(true);
    const data = await getAllPosts(blogPath);
    setPosts(data);
    applyFilters(data, searchQuery, searchField, statusFilter);
    setLoading(false);
  }

  function applyFilters(data: Post[], query: string, field: string, status: string) {
    let result = data;
    if (status !== "all") {
      result = result.filter((p) => p.status === status);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((post) => {
        switch (field) {
          case "title": return post.title.toLowerCase().includes(q);
          case "content": return post.content.toLowerCase().includes(q);
          case "category": return post.categories.some((c) => c.toLowerCase().includes(q));
          case "tag": return post.tags.some((t) => t.toLowerCase().includes(q));
          default: return (
            post.title.toLowerCase().includes(q) ||
            post.content.toLowerCase().includes(q) ||
            post.categories.some((c) => c.toLowerCase().includes(q)) ||
            post.tags.some((t) => t.toLowerCase().includes(q))
          );
        }
      });
    }
    setFilteredPosts(result);
  }

  useEffect(() => { loadPosts(); }, [blogPath]);
  useEffect(() => { applyFilters(posts, searchQuery, searchField, statusFilter); }, [searchQuery, searchField, statusFilter, posts]);

  async function handleDelete(filename: string) {
    if (!confirm(`确定要删除 "${filename}" 吗？`)) return;
    await moveToTrash(blogPath, filename);
    await loadPosts();
  }

  async function handlePublish(filename: string) {
    await publishDraft(blogPath, filename);
    await loadPosts();
  }

  async function handleImport() {
    const result = await importMarkdownFile(blogPath);
    alert(result.message);
    if (result.success) await loadPosts();
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

      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="搜索文章..." className="search-input" />
          {searchQuery && <button onClick={() => setSearchQuery("")} className="clear-search"><RotateCcw size={14} /></button>}
        </div>
        <select value={searchField} onChange={(e) => setSearchField(e.target.value as any)} className="search-field-select">
          <option value="all">全部字段</option>
          <option value="title">标题</option>
          <option value="content">内容</option>
          <option value="category">分类</option>
          <option value="tag">标签</option>
        </select>
        <div className="status-filter">
          <button className={`filter-btn ${statusFilter === "all" ? "active" : ""}`} onClick={() => setStatusFilter("all")}>全部</button>
          <button className={`filter-btn ${statusFilter === "published" ? "active" : ""}`} onClick={() => setStatusFilter("published")}>已发布</button>
          <button className={`filter-btn ${statusFilter === "draft" ? "active" : ""}`} onClick={() => setStatusFilter("draft")}>草稿</button>
        </div>
        <span className="search-count">{filteredPosts.length} 篇</span>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>状态</th>
              <th>标题</th>
              <th>日期</th>
              <th>分类</th>
              <th>标签</th>
              <th style={{ width: 130 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredPosts.map((post) => (
              <tr key={post.filename} className={post.status === "draft" ? "draft-row" : ""}>
                <td><span className={`status-badge ${post.status}`}>{post.status === "draft" ? "草稿" : "已发布"}</span></td>
                <td><div className="title-cell"><FileText size={16} /><span>{post.title}</span></div></td>
                <td>{post.date?.split(" ")[0] || "-"}</td>
                <td><div className="tag-list">{post.categories.map((c) => (<span key={c} className="badge badge-category">{c}</span>))}</div></td>
                <td><div className="tag-list">{post.tags.map((t) => (<span key={t} className="badge badge-tag">{t}</span>))}</div></td>
                <td>
                  <div className="action-buttons">
                    {post.status === "draft" && (
                      <button onClick={() => handlePublish(post.filename)} className="icon-button publish" title="发布"><Send size={15} /></button>
                    )}
                    <button onClick={() => onEdit(post.filename)} className="icon-button" title="编辑"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(post.filename)} className="icon-button danger" title="删除"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredPosts.length === 0 && (
              <tr><td colSpan={6} className="empty-state">{searchQuery ? "未找到匹配的文章" : "暂无文章"}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
