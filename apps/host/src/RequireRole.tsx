import { Role } from "@dashboard/shared-types";
import { Card } from "@dashboard/shared-ui";
import { hasRole, useAuthStore } from "@dashboard/shared-auth";

interface Props {
  children: React.ReactNode;
  allowed: Role[];
}

const RequireRole = ({ allowed, children }: Props) => {
  const role = useAuthStore((s) => s.user?.role ?? null);

  if (!hasRole(role, allowed)) {
    return (
      <Card title="권한 없음">
        <p style={{ margin: 0, color: '#6b7280', fontSize: 13, lineHeight: 1.6 }}>
          현재 role: <strong>{role ?? '없음'}</strong>. 이 영역은 <strong>{allowed.join(' / ')}</strong>{' '}
          만 접근할 수 있어요.
        </p>
      </Card>
    );
  }

  return <>{children}</>
}

export default RequireRole;