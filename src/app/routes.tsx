import { Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ProtectedAdminRoute from "@/components/auth/ProtectedAdminRoute";

const Auth = lazy(() => import("@/pages/Auth"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Index = lazy(() => import("@/pages/Index"));
const Chat = lazy(() => import("@/pages/Chat"));
const DataViewer = lazy(() => import("@/pages/DataViewer"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const SamplePrompts = lazy(() => import("@/pages/SamplePrompts"));
const Admin = lazy(() => import("@/pages/Admin"));
const Settings = lazy(() => import("@/pages/Settings"));
const Embed = lazy(() => import("@/pages/Embed"));
const MetricsLibrary = lazy(() => import("@/pages/MetricsLibrary"));
const Workspaces = lazy(() => import("@/pages/Workspaces"));

function Fallback() {
  return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<Index />} />
        <Route path="/admin" element={<ProtectedAdminRoute><Admin /></ProtectedAdminRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/chat/:sessionId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/data/:view" element={<ProtectedRoute><DataViewer /></ProtectedRoute>} />
        <Route path="/prompts" element={<ProtectedRoute><SamplePrompts /></ProtectedRoute>} />
        <Route path="/metrics" element={<ProtectedRoute><MetricsLibrary /></ProtectedRoute>} />
        <Route path="/workspaces" element={<ProtectedRoute><Workspaces /></ProtectedRoute>} />
        <Route path="/embed" element={<Embed />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
