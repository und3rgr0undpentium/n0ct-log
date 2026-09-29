import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/lib/api";
import Markdown from "@/components/Markdown";

export default function PostEditor() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const nav = useNavigate();
  const [form, setForm] = useState({ title: "", excerpt: "", content: "", tags: "", published: true });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    api.get("/admin/posts")
      .then((r) => {
        const p = r.data.find((x) => x.id === id);
        if (p) {
          setForm({
            title: p.title,
            excerpt: p.excerpt || "",
            content: p.content || "",
            tags: (p.tags || []).join(", "),
            published: p.published,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      title: form.title,
      excerpt: form.excerpt,
      content: form.content,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      published: form.published,
    };
    try {
      if (isEdit) await api.put(`/admin/posts/${id}`, payload);
      else await api.post("/admin/posts", payload);
      nav("/admin");
    } catch (err) {
      alert("Save failed: " + (err.response?.data?.detail || err.message));
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-10 font-mono text-[#606060]">loading...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="font-mono text-sm text-[#606060] mb-1">$ {isEdit ? "vi" : "touch"} post.md</div>
      <h1 className="font-mono text-3xl font-bold tracking-tighter text-[#E0E0E0] mb-8">
        <span className="text-[#FF00FF]">./</span>{isEdit ? "edit" : "new"} post
      </h1>

      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <label className="font-mono text-xs text-[#606060] block mb-1">title</label>
            <input
              data-testid="editor-title-input"
              className="hack-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="font-mono text-xs text-[#606060] block mb-1">excerpt (one line)</label>
            <input
              data-testid="editor-excerpt-input"
              className="hack-input"
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-mono text-xs text-[#606060]">content (markdown)</label>
              <button
                type="button"
                onClick={() => setPreview(!preview)}
                className="font-mono text-xs text-[#00FFFF] hover:text-[#FF00FF]"
                data-testid="toggle-preview-btn"
              >
                {preview ? "< edit" : "preview >"}
              </button>
            </div>
            {preview ? (
              <div className="panel p-5 min-h-[400px]">
                <Markdown>{form.content || "*(nothing yet)*"}</Markdown>
              </div>
            ) : (
              <textarea
                data-testid="editor-content-input"
                className="hack-input min-h-[400px] font-mono text-sm"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="font-mono text-xs text-[#606060] block mb-1">tags (comma separated)</label>
            <input
              data-testid="editor-tags-input"
              className="hack-input"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="cybersecurity, ctf, journey"
            />
          </div>
          <label className="flex items-center gap-3 font-mono text-sm text-[#A0A0A0] cursor-pointer">
            <input
              data-testid="editor-published-checkbox"
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
              className="accent-[#FF00FF] w-4 h-4"
            />
            publish immediately
          </label>

          <button data-testid="editor-save-btn" className="btn-hack w-full" disabled={saving}>
            {saving ? "saving..." : (isEdit ? "> update" : "> deploy")}
          </button>
          <button
            type="button"
            onClick={() => nav("/admin")}
            className="btn-ghost w-full"
            data-testid="editor-cancel-btn"
          >
            cancel
          </button>
        </div>
      </form>
    </div>
  );
}
