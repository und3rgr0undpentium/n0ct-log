import { Link } from "react-router-dom";

function fmtDate(iso) {
  try { return new Date(iso).toISOString().slice(0, 10); } catch { return ""; }
}

export default function PostCard({ post, onTagClick }) {
  return (
    <article
      data-testid={`post-card-${post.slug}`}
      className="panel p-5 sm:p-6 group relative fade-up"
    >
      <div className="flex items-center gap-3 text-xs font-mono text-[#606060] mb-3">
        <span data-testid={`post-date-${post.slug}`}>[{fmtDate(post.created_at)}]</span>
        <span>·</span>
        <span>{Math.max(1, Math.round(post.content.length / 900))} min read</span>
      </div>

      <Link to={`/post/${post.slug}`} data-testid={`post-title-link-${post.slug}`}>
        <h2 className="glitch font-mono text-xl sm:text-2xl font-bold leading-snug text-[#E0E0E0] group-hover:text-[#00FFFF] transition-colors">
          {post.title}
        </h2>
      </Link>

      <p className="mt-3 text-[#A0A0A0] text-[0.95rem] leading-relaxed">
        {post.excerpt || post.content.slice(0, 160) + "..."}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {(post.tags || []).map((t) => (
          <button
            key={t}
            onClick={(e) => { e.preventDefault(); onTagClick?.(t); }}
            className="chip"
            data-testid={`post-tag-${post.slug}-${t}`}
          >
            #{t}
          </button>
        ))}
      </div>

      <Link
        to={`/post/${post.slug}`}
        className="mt-5 inline-block font-mono text-sm text-[#FF00FF] hover:text-[#00FFFF]"
        data-testid={`post-read-more-${post.slug}`}
      >
        &gt; cat post.md
      </Link>
    </article>
  );
}
