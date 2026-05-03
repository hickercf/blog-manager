import { useState, useEffect } from "react";
import { FileText, Folder, Tag, Clock, TrendingUp, BarChart3 } from "lucide-react";
import { getPosts, getCategories, Post, Category } from "../utils/blogApi";

interface DashboardProps {
  blogPath: string;
  onEdit: (filename: string) => void;
}

export default function Dashboard({ blogPath, onEdit }: DashboardProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [blogPath]);

  async function loadData() {
    setLoading(true);
    const [postData, catData] = await Promise.all([
      getPosts(blogPath),
      getCategories(blogPath),
    ]);
    setPosts(postData);
    setCategories(catData);
    setLoading(false);
  }

  // Statistics
  const totalPosts = posts.length;
  const totalCategories = categories.length;
  const totalTags = new Set(posts.flatMap((p) => p.tags)).size;
  const thisMonthPosts = posts.filter((p) => {
    if (!p.date) return false;
    const postDate = new Date(p.date);
    const now = new Date();
    return postDate.getMonth() === now.getMonth() && postDate.getFullYear() === now.getFullYear();
  }).length;

  // Recent posts (last 7 days)
  const recentPosts = posts.filter((p) => {
    if (!p.date) return false;
    const postDate = new Date(p.date);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return postDate >= sevenDaysAgo;
  });

  if (loading) {
    return <div className="page-container"><div className="loading">加载中...</div></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BarChart3 size={24} />
          <h2>仪表盘</h2>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><FileText size={24} /></div>
          <div className="stat-value">{totalPosts}</div>
          <div className="stat-label">总文章数</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Folder size={24} /></div>
          <div className="stat-value">{totalCategories}</div>
          <div className="stat-label">分类数</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Tag size={24} /></div>
          <div className="stat-value">{totalTags}</div>
          <div className="stat-label">标签数</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><TrendingUp size={24} /></div>
          <div className="stat-value">{thisMonthPosts}</div>
          <div className="stat-label">本月发布</div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <h3>分类统计</h3>
          <div className="category-stats">
            {categories.map((cat) => (
              <div key={cat.name} className="category-stat-bar">
                <span className="category-name">{cat.name}</span>
                <div className="category-bar-bg">
                  <div
                    className="category-bar-fill"
                    style={{
                      width: `${totalPosts > 0 ? (cat.count / totalPosts) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="category-count">{cat.count}</span>
              </div>
            ))}
            {categories.length === 0 && <p>暂无分类数据</p>}
          </div>
        </div>

        <div className="dashboard-section">
          <h3>最近动态（7天内）</h3>
          <div className="recent-posts-list">
            {recentPosts.map((post) => (
              <div
                key={post.filename}
                className="recent-post-item"
                onClick={() => onEdit(post.filename)}
              >
                <Clock size={14} />
                <span className="recent-post-title">{post.title}</span>
                <span className="recent-post-date">{post.date?.split(" ")[0]}</span>
              </div>
            ))}
            {recentPosts.length === 0 && <p>最近7天没有新文章</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
