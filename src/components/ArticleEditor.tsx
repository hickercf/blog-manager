import { useState, useEffect } from "react";
import { Save, ArrowLeft, Eye, EyeOff, X, Plus, Folder } from "lucide-react";
import { getPost, savePost, getCategories, Category } from "../utils/blogApi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ArticleEditorProps {
  blogPath: string;
  filename: string | null;
  onBack: () => void;
}

export default function ArticleEditor({ blogPath, filename, onBack }: ArticleEditorProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingCategories, setExistingCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    loadExistingCategories();
    if (filename) {
      loadPost();
    } else {
      setTitle("");
      setDate(new Date().toISOString().slice(0, 16).replace("T", " "));
      setCategories([]);
      setTags("");
      setContent("");
    }
  }, [filename, blogPath]);

  async function loadExistingCategories() {
    const cats = await getCategories(blogPath);
    setExistingCategories(cats);
  }

  async function loadPost() {
    if (!filename) return;
    const post = await getPost(blogPath, filename);
    if (post) {
      setTitle(post.title);
      setDate(post.date);
      setCategories(post.categories);
      setTags(post.tags.join(", "));
      setContent(post.content);
    }
  }

  async function handleSave() {
    setSaving(true);
    const newFilename = filename || `${title.replace(/\s+/g, "-").toLowerCase()}.md`;
    await savePost(blogPath, newFilename, {
      title,
      date,
      categories: categories.filter(Boolean),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      content,
    });
    setSaving(false);
    onBack();
  }

  function toggleCategory(category: string) {
    if (categories.includes(category)) {
      setCategories(categories.filter((c) => c !== category));
    } else {
      setCategories([...categories, category]);
    }
  }

  function addNewCategory() {
    const trimmed = newCategory.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
      const exists = existingCategories.some((c) => c.name === trimmed);
      if (!exists) {
        setExistingCategories([...existingCategories, { name: trimmed, count: 0, posts: [] }]);
      }
      setNewCategory("");
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <button onClick={onBack} className="icon-button">
          <ArrowLeft size={18} />
        </button>
        <h2>{filename ? "编辑文章" : "新建文章"}</h2>
        <div className="button-group">
          <button onClick={() => setShowPreview(!showPreview)} className="icon-button">
            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button onClick={handleSave} disabled={saving} className="primary-button">
            <Save size={16} /> {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>

      <div className="editor-meta">
        <div className="form-row">
          <div className="form-group">
            <label>标题</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="文章标题" />
          </div>
          <div className="form-group">
            <label>日期</label>
            <input value={date} onChange={(e) => setDate(e.target.value)} placeholder="2024-01-01 00:00:00" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>分类</label>
            <div className="category-selector">
              <div className="selected-categories">
                {categories.map((category) => (
                  <span key={category} className="badge badge-category">
                    {category}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="remove-btn"
                      title="移除"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <button 
                  onClick={() => setShowCategoryPicker(!showCategoryPicker)} 
                  className="icon-button"
                  title="选择分类"
                >
                  <Folder size={14} />
                </button>
              </div>
              
              {showCategoryPicker && existingCategories.length > 0 && (
                <div className="category-picker-dropdown">
                  <div className="category-picker-header">
                    <span className="label-small">点击选择分类（{existingCategories.length} 个）</span>
                    <button onClick={() => setShowCategoryPicker(false)} className="icon-button">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="category-picker-grid">
                    {existingCategories.map((category) => (
                      <button
                        key={category.name}
                        className={`category-picker-item ${categories.includes(category.name) ? "active" : ""}`}
                        onClick={() => toggleCategory(category.name)}
                        title={`该分类下有 ${category.count} 篇文章`}
                      >
                        <Folder size={14} />
                        <span>{category.name}</span>
                        <span className="category-count">{category.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="add-category-row">
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addNewCategory()}
                  placeholder="输入新分类名称"
                  className="small-input"
                />
                <button onClick={addNewCategory} className="icon-button" title="添加">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>标签（用逗号分隔）</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="标签1, 标签2" />
          </div>
        </div>
      </div>

      <div className={`editor-layout ${showPreview ? "split" : "full"}`}>
        <div className="editor-pane">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="在此输入 Markdown 格式的文章内容..."
          />
        </div>
        {showPreview && (
          <div className="preview-pane">
            <div className="preview-header">预览</div>
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || "*预览将显示在这里*"}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
