import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function Navbar({ site }) {
  const { user, logout } = useAuth();
  const handle = site?.handle || "n0ct";

  const linkCls = ({ isActive }) =>
    `font-mono text-sm tracking-wide px-2 py-1 transition-colors ${
      isActive ? "text-[#FF00FF]" : "text-[#A0A0A0] hover:text-[#00FFFF]"
    }`;

  return (
    <header className="border-b border-[#262626] sticky top-0 z-40 bg-[#0A0A0A]/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link to="/" data-testid="nav-home-brand" className="font-mono text-xl font-bold">
          <span className="text-[#606060]">~/</span>
          <span className="text-[#E0E0E0]">{handle}</span>
          <span className="text-[#FF00FF]">.log</span>
          <span className="ml-1 text-[#00FFFF] animate-pulse">_</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink to="/" end className={linkCls} data-testid="nav-home">./home</NavLink>
          <NavLink to="/about" className={linkCls} data-testid="nav-about">./about</NavLink>
          {user ? (
            <>
              <NavLink to="/admin" className={linkCls} data-testid="nav-admin">./admin</NavLink>
              <button onClick={logout} className="btn-ghost ml-2" data-testid="nav-logout">logout</button>
            </>
          ) : (
            <NavLink to="/admin/login" className={linkCls} data-testid="nav-login">./login</NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
