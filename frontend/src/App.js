import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

import api from "@/lib/api";
import { AuthProvider } from "@/context/AuthContext";
import BootSequence from "@/components/BootSequence";
import Navbar from "@/components/Navbar";
import Home from "@/pages/Home";
import PostDetail from "@/pages/PostDetail";
import About from "@/pages/About";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import PostEditor from "@/pages/PostEditor";
import ProtectedRoute from "@/components/ProtectedRoute";

function AppShell() {
  const [booted, setBooted] = useState(() => sessionStorage.getItem("hack_booted") === "1");
  const [site, setSite] = useState(null);

  useEffect(() => {
    api.get("/site").then((r) => setSite(r.data)).catch(() => setSite({}));
  }, []);

  const handleBooted = () => {
    sessionStorage.setItem("hack_booted", "1");
    setBooted(true);
  };

  return (
    <>
      {!booted && <BootSequence onDone={handleBooted} />}
      {booted && (
        <>
          <Navbar site={site} />
          <main data-testid="main-content">
            <Routes>
              <Route path="/" element={<Home site={site} />} />
              <Route path="/post/:slug" element={<PostDetail />} />
              <Route path="/about" element={<About site={site} />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/new" element={<ProtectedRoute><PostEditor /></ProtectedRoute>} />
              <Route path="/admin/edit/:id" element={<ProtectedRoute><PostEditor /></ProtectedRoute>} />
              <Route path="*" element={
                <div className="max-w-3xl mx-auto px-6 py-24 font-mono text-[#FF3333]">
                  404: fragment not found
                </div>
              } />
            </Routes>
          </main>
          <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-10 border-t border-[#262626] mt-16 font-mono text-xs text-[#606060] flex flex-wrap gap-3 justify-between">
            <div>© {new Date().getFullYear()} {site?.handle || "n0ct"} · powered by curiosity + caffeine</div>
            <div>[ session_uptime: {new Date().toTimeString().slice(0,8)} ]</div>
          </footer>
        </>
      )}
    </>
  );
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <AppShell />
          <Toaster theme="dark" position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
