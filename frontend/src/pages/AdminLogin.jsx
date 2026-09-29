import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function AdminLogin() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      await login(username, password);
      nav("/admin");
    } catch (e2) {
      setErr("access denied. invalid credentials.");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
      <div className="font-mono text-sm text-[#606060] mb-2">$ sudo su -</div>
      <h1 className="font-mono text-3xl font-bold tracking-tighter text-[#E0E0E0] mb-6">
        <span className="text-[#FF00FF]">&gt;_</span> admin login
      </h1>

      <form onSubmit={submit} className="panel p-6 space-y-4">
        <div>
          <label className="font-mono text-xs text-[#606060] block mb-1">username</label>
          <input
            data-testid="login-username-input"
            className="hack-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label className="font-mono text-xs text-[#606060] block mb-1">password</label>
          <input
            data-testid="login-password-input"
            type="password"
            className="hack-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {err && (
          <div data-testid="login-error" className="font-mono text-sm text-[#FF3333]">
            [!] {err}
          </div>
        )}

        <button data-testid="login-submit-btn" className="btn-hack w-full" disabled={loading}>
          {loading ? "authenticating..." : "> authenticate"}
        </button>

        <div className="pt-2 font-mono text-xs text-[#606060]">
          hint: default admin / admin123
        </div>
      </form>
    </div>
  );
}
