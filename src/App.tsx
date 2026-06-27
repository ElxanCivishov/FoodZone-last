import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/utils/cn';

const AdminApp     = lazy(() => import('@/components/admin/AdminApp').then(m => ({ default: m.AdminApp })));
const KitchenPanel = lazy(() => import('@/components/kitchen/KitchenPanel').then(m => ({ default: m.KitchenPanel })));
const WaiterPanel  = lazy(() => import('@/components/waiter-panel/WaiterPanel').then(m => ({ default: m.WaiterPanel })));

function PanelFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size={40} />
    </div>
  );
}

interface AuthGuardProps {
  children: React.ReactNode;
  roles?: string[];
}

function AuthGuard({ children, roles }: AuthGuardProps) {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}

function StaffPanel({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useThemeStore();
  return (
    <div className={cn('min-h-screen bg-surface text-foreground', resolvedTheme === 'dark' ? 'dark' : '')}>
      {children}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />

        <Route
          path="/admin/*"
          element={
            <AuthGuard roles={['super_admin', 'admin', 'manager']}>
              <StaffPanel>
                <Suspense fallback={<PanelFallback />}>
                  <AdminApp />
                </Suspense>
              </StaffPanel>
            </AuthGuard>
          }
        />

        <Route
          path="/kitchen"
          element={
            <AuthGuard roles={['super_admin', 'admin', 'manager', 'kitchen']}>
              <StaffPanel>
                <Suspense fallback={<PanelFallback />}>
                  <KitchenPanel />
                </Suspense>
              </StaffPanel>
            </AuthGuard>
          }
        />

        <Route
          path="/waiter"
          element={
            <AuthGuard roles={['super_admin', 'admin', 'manager', 'waiter', 'staff']}>
              <StaffPanel>
                <Suspense fallback={<PanelFallback />}>
                  <WaiterPanel />
                </Suspense>
              </StaffPanel>
            </AuthGuard>
          }
        />

        <Route
          path="/waiter-panel"
          element={<Navigate to="/waiter" replace />}
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
