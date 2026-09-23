// OPEN MODE — auth frozen for building phase (2026-09-23)
// All routes are public. Auth pages are kept but bypassed. Re-enable Protected* when ready for prod.
import { Route, Routes } from "react-router-dom";
import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import Index from "@/pages/Index";
import Chat from "@/pages/Chat";
import DataViewer from "@/pages/DataViewer";
import NotFound from "@/pages/NotFound";
import SamplePrompts from "@/pages/SamplePrompts";
import Admin from "@/pages/Admin";
import Settings from "@/pages/Settings";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/" element={<Index />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/chat/:sessionId" element={<Chat />} />
      <Route path="/data/:view" element={<DataViewer />} />
      <Route path="/prompts" element={<SamplePrompts />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
