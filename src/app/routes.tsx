import { Route, Routes } from "react-router-dom";
import { lazy, Suspense, ReactNode } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ProtectedAdminRoute from "@/components/auth/ProtectedAdminRoute";
import { ErrorBoundary, RouteSkeleton } from "@/components/ErrorBoundary";

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
const FreeModels = lazy(() => import("@/pages/FreeModels"));

function RouteShell({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteSkeleton />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<RouteShell><Auth /></RouteShell>} />
      <Route path="/reset-password" element={<RouteShell><ResetPassword /></RouteShell>} />
      <Route path="/" element={<RouteShell><Index /></RouteShell>} />
      <Route path="/admin" element={<RouteShell><ProtectedAdminRoute><Admin /></ProtectedAdminRoute></RouteShell>} />
      <Route path="/settings" element={<RouteShell><ProtectedRoute><Settings /></ProtectedRoute></RouteShell>} />
      <Route path="/chat" element={<RouteShell><ProtectedRoute><Chat /></ProtectedRoute></RouteShell>} />
      <Route path="/chat/:sessionId" element={<RouteShell><ProtectedRoute><Chat /></ProtectedRoute></RouteShell>} />
      <Route path="/data/:view" element={<RouteShell><ProtectedRoute><DataViewer /></ProtectedRoute></RouteShell>} />
      <Route path="/prompts" element={<RouteShell><ProtectedRoute><SamplePrompts /></ProtectedRoute></RouteShell>} />
      <Route path="/metrics" element={<RouteShell><ProtectedRoute><MetricsLibrary /></ProtectedRoute></RouteShell>} />
      <Route path="/workspaces" element={<RouteShell><ProtectedRoute><Workspaces /></ProtectedRoute></RouteShell>} />
      <Route path="/embed" element={<RouteShell><Embed /></RouteShell>} />
      <Route path="/free-models" element={<RouteShell><FreeModels /></RouteShell>} />
      <Route path="*" element={<RouteShell><NotFound /></RouteShell>} />
    </Routes>
  );
}
