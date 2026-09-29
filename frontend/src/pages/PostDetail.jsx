import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import Markdown from "@/components/Markdown";
import TldrBox from "@/components/TldrBox";

function fmtDate(iso) {
  try { return new Date(iso).toISOString().slice(0, 10); } catch { return ""; }
}

export default function PostDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/posts/${slug}`)
      .then((r) => setPost(r.data))
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24 font-mono">
      <div className="text-[#FF3333] text-2xl mb-2">404: fragment not found</div>
      <Link to="/" className="text-[#00FFFF] underline">&lt; return to index</Link>
    </div>
  );

  if (!post) return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24 font-mono text-[#606060]">
      &gt; loading fragment<span className="terminal-cursor" />
    </div>
  );

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
      <Link to="/" className="font-mono text-xs text-[#606060] hover:text-[#00FFFF]" data-testid="back-home-link">
        &lt; cd ..
      </Link>

      <div className="mt-6 mb-4 flex flex-wrap items-center gap-3 font-mono text-xs text-[#606060]">
        <span data-testid="post-detail-date">[{fmtDate(post.created_at)}]</span>
        <span>·</span>
        <div className="flex flex-wrap gap-2">
          {(post.tags || []).map((t) => (
            <span key={t} className="chip">#{t}</span>
          ))}
        </div>
      </div>

      <h1
        data-testid="post-detail-title"
        className="font-mono text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter text-[#E0E0E0] leading-tight mb-8"
      >
        {post.title}
        <span className="text-[#00FFFF] animate-pulse ml-1">_</span>
      </h1>

      <TldrBox post={post} />

      <Markdown>{post.content}</Markdown>

      <div className="mt-16 pt-8 border-t border-[#262626] font-mono text-sm text-[#606060]">
        &gt; EOF · thanks for reading. see you in the next log.
      </div>
    </article>
  );
}
