import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";

function fmtDate(iso) { try { return new Date(iso).toISOString().slice(0, 10); } catch { return ""; } }

export default function AdminDashboard() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  const load = () => {
    setLoading(true);
    api.get("/admin/posts")
      .then((r) => setPosts(r.data))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const del = async (id) => {
    if (!window.confirm("Delete this post permanently?")) return;
    await api.delete(`/admin/posts/${id}`);
    load();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="font-mono text-sm text-[#606060]">$ /admin/dashboard</div>
          <h1 className="font-mono text-3xl font-bold tracking-tighter text-[#E0E0E0] mt-1">
            <span className="text-[#FF00FF]">./</span>posts.manage
          </h1>
        </div>
        <button
          onClick={() => nav("/admin/new")}
          className="btn-hack"
          data-testid="new-post-btn"
        >
          + new post
        </button>
      </div>

      <div className="panel">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-[#262626] font-mono text-xs text-[#606060] tracking-widest uppercase">
          <div className="col-span-6">title</div>
          <div className="col-span-2">status</div>
          <div className="col-span-2">date</div>
          <div className="col-span-2 text-right">actions</div>
        </div>
        {loading && (
          <div className="p-6 font-mono text-[#606060]" data-testid="admin-loading">
            &gt; loading<span className="terminal-cursor" />
          </div>
        )}
        {!loading && posts.map((p) => (
          <div
            key={p.id}
            data-testid={`admin-row-${p.id}`}
            className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-[#181818] items-center hover:bg-[#141414]"
          >
            <div className="col-span-6">
              <Link to={`/post/${p.slug}`} className="font-mono text-[#E0E0E0] hover:text-[#00FFFF]">
                {p.title}
              </Link>
              <div className="text-xs text-[#606060] font-mono mt-1">/{p.slug}</div>
            </div>
            <div className="col-span-2">
              <span className={`chip ${p.published ? "" : "!text-[#FF3333] !border-[#FF3333]"}`}>
                {p.published ? "PUBLISHED" : "DRAFT"}
              </span>
            </div>
            <div className="col-span-2 font-mono text-sm text-[#A0A0A0]">
              {fmtDate(p.created_at)}
            </div>
            <div className="col-span-2 flex gap-2 justify-end">
              <Link
                to={`/admin/edit/${p.id}`}
                className="btn-ghost"
                data-testid={`edit-btn-${p.id}`}
              >
                edit
              </Link>
              <button
                onClick={() => del(p.id)}
                className="btn-ghost hover:!text-[#FF3333] hover:!border-[#FF3333]"
                data-testid={`delete-btn-${p.id}`}
              >
                rm
              </button>
            </div>
          </div>
        ))}
        {!loading && posts.length === 0 && (
          <div className="p-6 font-mono text-[#606060]">no posts yet. spin one up.</div>
        )}
      </div>
    </div>
  );
}
