import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import PostCard from "@/components/PostCard";
import CodeRain from "@/components/CodeRain";

export default function Home({ site }) {
  const [posts, setPosts] = useState([]);
  const [tags, setTags] = useState([]);
  const [q, setQ] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typed, setTyped] = useState("");
  const tagline = site?.tagline || "";

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      setTyped(tagline.slice(0, i));
      if (i >= tagline.length) clearInterval(iv);
    }, 32);
    return () => clearInterval(iv);
  }, [tagline]);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (q) params.q = q;
    if (activeTag) params.tag = activeTag;
    Promise.all([
      api.get("/posts", { params }),
      api.get("/posts/tags"),
    ]).then(([p, t]) => {
      setPosts(p.data);
      setTags(t.data);
    }).finally(() => setLoading(false));
  }, [q, activeTag]);

  const heading = useMemo(() => `${site?.handle || "n0ct"}@root`, [site]);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[#262626]">
        <CodeRain />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-14 sm:pt-24 sm:pb-20">
          <div className="font-mono text-[#606060] text-sm mb-4" data-testid="home-shell-prompt">
            $ ssh {heading}:~$
          </div>
          <h1 className="font-mono text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-[#E0E0E0] leading-[1.05]">
            <span className="text-[#FF00FF]">./</span>notes-from-<br />the-terminal
            <span className="text-[#00FFFF]">_</span>
          </h1>
          <p className="mt-6 max-w-2xl text-[#A0A0A0] font-mono text-base sm:text-lg" data-testid="home-tagline">
            &gt; {typed}<span className="text-[#00FFFF] animate-pulse">|</span>
          </p>
        </div>
      </section>

      {/* Controls */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 flex items-center gap-2 border border-[#3a3a3a] focus-within:border-[#00FFFF] bg-[#050505] px-3">
            <span className="font-mono text-[#FF00FF]">&gt;</span>
            <input
              data-testid="search-input"
              className="hack-input border-0 focus:shadow-none px-0"
              placeholder="grep -r 'query' ./posts"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          {activeTag && (
            <button
              onClick={() => setActiveTag(null)}
              data-testid="clear-tag-btn"
              className="btn-ghost"
            >
              clear filter: #{activeTag} ×
            </button>
          )}
        </div>

        {/* Tag row */}
        <div className="mt-5 flex flex-wrap gap-2" data-testid="tag-row">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTag(t === activeTag ? null : t)}
              className={`chip ${activeTag === t ? "active" : ""}`}
              data-testid={`filter-tag-${t}`}
            >
              #{t}
            </button>
          ))}
        </div>

        {/* Post grid */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
          {loading && (
            <div className="col-span-full font-mono text-[#606060]" data-testid="posts-loading">
              &gt; loading posts<span className="terminal-cursor" />
            </div>
          )}
          {!loading && posts.length === 0 && (
            <div className="col-span-full font-mono text-[#606060]" data-testid="posts-empty">
              &gt; no posts found. try clearing filters.
            </div>
          )}
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onTagClick={setActiveTag} />
          ))}
        </div>
      </section>
    </div>
  );
}
