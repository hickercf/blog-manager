import { useState, useEffect } from "react";
import { Folder, FileText, ArrowLeft } from "lucide-react";
import { getCategories, Category } from "../utils/blogApi";

interface CategoryManagerProps {
  blogPath: string;
  onViewPost: (filename: string) => void;
  onBack: () => void;
}

export default function CategoryManager({ blogPath, onViewPost, onBack }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadCategories() {
    setLoading(true);
    const data = await getCategories(blogPath);
    setCategories(data);
    setLoading(false);
  }

  useEffect(() => {
    loadCategories();
  }, [blogPath]);

  if (selectedCategory) {
    return (
      <div className="page-container">
        <div className="page-header">
          <button onClick={() => setSelectedCategory(null)} className="icon-button">
            <ArrowLeft size={18} />
          </button>
          <h2>分类：{selectedCategory.name}</h2>
          <span className="text-muted">{selectedCategory.count} 篇文章</span>
        </div>

        <div className="category-posts">
          {selectedCategory.posts.map((post) => (
            <div key={post.filename} className="post-card" onClick={() => onViewPost(post.filename)}>
              <div className="post-card-header">
                <FileText size={16} />
                <span className="post-title">{post.title}</span>
              </div>
              <div className="post-card-meta">
                <span>{post.date?.split(" ")[0] || "-"}</span>
                {post.tags.length > 0 && (
                  <div className="tag-list">
                    {post.tags.map((t) => (
                      <span key={t} className="badge badge-tag">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <button onClick={onBack} className="icon-button">
          <ArrowLeft size={18} />
        </button>
        <h2>分类管理</h2>
        <span className="text-muted">{categories.length} 个分类</span>
      </div>

      {loading ? (
        <div className="loading-state">加载中...</div>
      ) : categories.length === 0 ? (
        <div className="empty-state">暂无分类</div>
      ) : (
        <div className="categories-grid">
          {categories.map((category) => (
            <div
              key={category.name}
              className="category-card"
              onClick={() => setSelectedCategory(category)}
            >
              <div className="category-card-icon">
                <Folder size={32} />
              </div>
              <div className="category-card-info">
                <h3>{category.name}</h3>
                <span>{category.count} 篇文章</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
