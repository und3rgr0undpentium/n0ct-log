import { useState } from "react";
import api from "@/lib/api";

export default function TldrBox({ post }) {
  const [tldr, setTldr] = useState(post.tldr || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const handleReveal = async () => {
    if (tldr) { setRevealed(true); return; }
    setLoading(true); setError(null);
    try {
      const { data } = await api.post(`/posts/${post.id}/tldr`);
      setTldr(data.tldr);
      setRevealed(true);
    } catch (e) {
      setError("decryption failed. try again.");
    } finally { setLoading(false); }
  };

  return (
    <div
      data-testid="tldr-box"
      className="border border-[#FF00FF] bg-[#120012] p-5 mb-8 relative"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono text-xs tracking-widest text-[#FF00FF]">
          [ AI // TL;DR ]
        </div>
        {!revealed && !loading && (
          <button
            onClick={handleReveal}
            data-testid="tldr-decrypt-btn"
            className="font-mono text-xs text-[#00FFFF] hover:text-[#FF00FF] underline underline-offset-4"
          >
            {tldr ? "reveal" : "decrypt >>"}
          </button>
        )}
        {loading && (
          <span className="font-mono text-xs text-[#00FFFF] animate-pulse">
            decrypting<span className="terminal-cursor" />
          </span>
        )}
      </div>
      {error && (
        <div className="font-mono text-sm text-[#FF3333]">{error}</div>
      )}
      {!error && (
        <p
          data-testid="tldr-content"
          className={`text-[0.95rem] leading-relaxed text-[#E0E0E0] font-mono ${
            !revealed && !loading ? "tldr-blur" : "tldr-blur revealed"
          }`}
        >
          {tldr || "██████████ ████████████████████████ █████████████ ████ ██████████ ████████."}
        </p>
      )}
    </div>
  );
}
