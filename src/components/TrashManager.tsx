import { useState, useEffect } from "react";
import { Trash2, RotateCcw, AlertTriangle, RefreshCw } from "lucide-react";
import { getTrashItems, restoreFromTrash, permanentlyDelete } from "../utils/blogApi";

interface TrashManagerProps {
  blogPath: string;
}

export default function TrashManager({ blogPath }: TrashManagerProps) {
  const [items, setItems] = useState<{ filename: string; title: string; deletedDate: string }[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadItems() {
    setLoading(true);
    const data = await getTrashItems(blogPath);
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    loadItems();
  }, [blogPath]);

  async function handleRestore(filename: string) {
    if (!confirm(`确定要恢复 "${filename}" 吗？`)) return;
    await restoreFromTrash(blogPath, filename);
    await loadItems();
  }

  async function handleDelete(filename: string, title: string) {
    if (!confirm(`⚠️ 永久删除警告\n\n"${title}" 将被永久删除，无法恢复！\n\n确定要继续吗？`)) return;
    await permanentlyDelete(blogPath, filename);
    await loadItems();
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Trash2 size={24} />
          <h2>回收站</h2>
        </div>
        <button onClick={loadItems} disabled={loading} className="icon-button">
          <RefreshCw size={16} className={loading ? "spin" : ""} />
        </button>
      </div>

      <div className="trash-info">
        <AlertTriangle size={16} />
        <span>回收站中的文章将在 30 天后自动清理。您可以随时恢复或永久删除。</span>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>标题</th>
              <th>删除日期</th>
              <th style={{ width: 180 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.filename}>
                <td>{item.title || item.filename}</td>
                <td>{item.deletedDate || "-"}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => handleRestore(item.filename)}
                      className="action-button restore"
                      title="恢复"
                    >
                      <RotateCcw size={14} /> 恢复
                    </button>
                    <button
                      onClick={() => handleDelete(item.filename, item.title)}
                      className="action-button danger"
                      title="永久删除"
                    >
                      <Trash2 size={14} /> 删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={3} className="empty-state">回收站为空</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
