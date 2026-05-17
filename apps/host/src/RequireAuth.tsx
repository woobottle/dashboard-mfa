import { Role } from "@dashboard/shared-types";
import { Card } from "@dashboard/shared-ui";
import { hasRole, useAuthStore } from "@dashboard/shared-auth";
import { Navigate, useLocation } from "react-router-dom";

interface Props {
  children: React.ReactNode;
}

const RequireAuth = ({ children }: Props) => {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === 'idle' || status === 'loading') {
    return <Card title="로그인 상태 복원 중">…</Card>;
  }
  if (status === 'unauthenticated') return <Navigate to={`/login?from=${encodeURIComponent(location.pathname)}`} replace />

  return <>{children}</>;
}

export default RequireAuth;