import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  // Building-phase bypass: set VITE_DEV_ADMIN_BYPASS=true in .env to skip auth when Supabase is unreachable
  const bypass = import.meta.env.VITE_DEV_ADMIN_BYPASS === 'true';
  if (bypass) return <>{children}</>;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }
  if (!session) return <Navigate to="/auth" replace />;
  const isAdmin = (session.user?.user_metadata as any)?.is_admin === true;
  const allowList = (import.meta.env.VITE_ADMIN_EMAILS || 'finese_admin@gmail.com').split(',').map((s:string)=>s.trim().toLowerCase()).filter(Boolean);
  const emailAdmin = allowList.includes((session.user?.email || '').toLowerCase());
  if (!isAdmin && !emailAdmin) return <Navigate to="/chat" replace />;
  return <>{children}</>;
}
