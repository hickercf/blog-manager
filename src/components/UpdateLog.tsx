import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { getUpdateLog, saveUpdateLog } from "../utils/blogApi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface UpdateLogProps {
  blogPath: string;
}

export default function UpdateLog({ blogPath }: UpdateLogProps) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    loadLog();
  }, [blogPath]);

  async function loadLog() {
    const data = await getUpdateLog(blogPath);
    setContent(data);
  }

  async function handleSave() {
    setSaving(true);
    await saveUpdateLog(blogPath, content);
    setSaving(false);
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>更新日志</h2>
        <div className="button-group">
          <button onClick={() => setShowPreview(!showPreview)} className="icon-button">
            {showPreview ? "隐藏预览" : "显示预览"}
          </button>
          <button onClick={handleSave} disabled={saving} className="primary-button">
            <Save size={16} /> {saving ? "保存中..." : "保存修改"}
          </button>
        </div>
      </div>

      <div className={`editor-layout ${showPreview ? "split" : "full"}`}>
        <div className="editor-pane">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="在此编辑 Markdown 格式的更新日志..."
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
