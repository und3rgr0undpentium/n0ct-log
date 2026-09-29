import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 font-mono text-[#606060]">authenticating...</div>;
  if (!user) return <Navigate to="/admin/login" replace />;
  return children;
}
