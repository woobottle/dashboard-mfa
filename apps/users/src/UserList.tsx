import { customFetcher } from '@dashboard/shared-api';
import { useEffect, useState } from 'react';
import { Button, Card } from '@dashboard/shared-ui';
import type { DirectoryUser, Role, UserListResponse } from '@dashboard/shared-types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { userIdEventBus, useUserStore } from '@dashboard/shared-store';
import { useQuery } from '@tanstack/react-query';

interface Props {
  token?: string | null;
  apiBase?: string;
}

const DEFAULT_API_BASE = 'http://localhost:4000';

export function UserList({ token,  apiBase = DEFAULT_API_BASE }: Props) {
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [role, ] = useState(() => localStorage.getItem('authRole'))
  const navigate = useNavigate();
  // url state 사용
  // const [searchParams, setSearchParams] = useSearchParams()
  //  const onSelectUser = (userId: string) => {
  //   const newSearchParams = new URLSearchParams(searchParams);
  //   newSearchParams.set('userId', userId);
  //   setSearchParams(newSearchParams);
  //   navigate('/metrics');
  // }
  // zustand store 사용
  // const setUserId = useUserStore((state) => state.setUserId)
  // const onSelectUser = (userId: string) => {
  //   setUserId(userId);
  //   navigate('/metrics');
  // }

  // event bus 사용
  const setUserId = userIdEventBus.set
  const onSelectUser = (userId: string) => {
    setUserId(userId);
    navigate('/metrics');
  }

  const canBan = role === 'admin' || role === 'cx';

  const getAuthMe = useQuery({ queryKey: ['authMe'], queryFn: async () => {
    const res = await customFetcher.fetchApi(`${apiBase}/auth/me`, {})
    return res.json()
  }})

  console.log(getAuthMe.data)

  const load = () => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    setLoading(true);
    setError(null);

    customFetcher.fetchApi(`${apiBase}/api/users`, { headers })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({ message: res.statusText }));
          throw new Error(`${res.status} · ${body.message ?? res.statusText}`);
        }
        return res.json() as Promise<UserListResponse>;
      })
      .then((body) => setUsers(body.users))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [token, apiBase]);

  const handleBan = async (user: DirectoryUser) => {
    if (!canBan) return;
    setBusyId(user.id);
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await customFetcher.fetchApi(`${apiBase}/api/users/${user.id}/ban`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(`${res.status} · ${body.message ?? res.statusText}`);
      }
      const updated = (await res.json()) as DirectoryUser;
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card title="유저 목록">
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
        role: {role ?? '없음'}
        {token ? '' : ' · ⚠️ 토큰 없이 호출 중 (BE는 401을 줄 거예요)'}
      </div>

      {loading && <div>불러오는 중…</div>}
      {error && <div style={{ color: '#b91c1c' }}>에러: {error}</div>}

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#6b7280' }}>
            <th style={{ padding: '6px 4px' }}>이름</th>
            <th style={{ padding: '6px 4px' }}>이메일</th>
            <th style={{ padding: '6px 4px' }}>지역</th>
            <th style={{ padding: '6px 4px' }}>가입일</th>
            <th style={{ padding: '6px 4px' }}>상태</th>
            <th style={{ padding: '6px 4px' }} />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr
              key={u.id}
              style={{ borderTop: '1px solid #f3f4f6', cursor: !!onSelectUser ? 'pointer' : 'default' }}
              onClick={() => onSelectUser(u.id)}
            >
              <td style={{ padding: '6px 4px' }}>{u.name}</td>
              <td style={{ padding: '6px 4px' }}>{u.email}</td>
              <td style={{ padding: '6px 4px' }}>{u.region}</td>
              <td style={{ padding: '6px 4px' }}>{u.joinedAt}</td>
              <td style={{ padding: '6px 4px' }}>
                {u.banned ? <span style={{ color: '#dc2626' }}>차단됨</span> : '정상'}
              </td>
              <td style={{ padding: '6px 4px' }}>
                {canBan && !u.banned ? (
                  <Button
                    variant="danger"
                    disabled={busyId === u.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBan(u);
                    }}
                  >
                    제재
                  </Button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export default UserList;
