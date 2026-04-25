import { useEffect, useState } from 'react';
import { Card } from '@dashboard/shared-ui';
import type { MetricsResponse } from '@dashboard/shared-types';

interface Props {
  token?: string | null;
  period?: '7d' | '30d' | '90d';
  region?: 'seoul' | 'busan' | 'all';
  userId?: string;
  apiBase?: string;
}

const DEFAULT_API_BASE = 'http://localhost:4000';

export function MetricsDashboard({
  token,
  period = '7d',
  region = 'all',
  userId,
  apiBase = DEFAULT_API_BASE,
}: Props) {
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('period', period);
    params.set('region', region);
    if (userId) params.set('userId', userId);

    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`${apiBase}/api/metrics?${params.toString()}`, {
      headers,
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({ message: res.statusText }));
          throw new Error(`${res.status} · ${body.message ?? res.statusText}`);
        }
        return res.json() as Promise<MetricsResponse>;
      })
      .then((body) => setData(body))
      .catch((err) => {
        if ((err as Error).name === 'AbortError') return;
        setError((err as Error).message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [token, period, region, userId, apiBase]);

  return (
    <Card title={userId ? `유저 ${userId} 지표` : '전체 지표'}>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
        period: {period} · region: {region}
        {token ? '' : ' · ⚠️ 토큰 없이 호출 중 (BE는 401을 줄 거예요)'}
      </div>

      {loading && <div>불러오는 중…</div>}
      {error && <div style={{ color: '#b91c1c' }}>에러: {error}</div>}

      {data && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#6b7280' }}>
              <th style={{ padding: '6px 4px' }}>날짜</th>
              <th style={{ padding: '6px 4px' }}>트래픽</th>
              <th style={{ padding: '6px 4px' }}>매출</th>
              <th style={{ padding: '6px 4px' }}>GMV</th>
            </tr>
          </thead>
          <tbody>
            {data.points.map((p) => (
              <tr key={p.date} style={{ borderTop: '1px solid #f3f4f6' }}>
                <td style={{ padding: '6px 4px' }}>{p.date}</td>
                <td style={{ padding: '6px 4px' }}>{p.traffic.toLocaleString()}</td>
                <td style={{ padding: '6px 4px' }}>{p.revenue.toLocaleString()}</td>
                <td style={{ padding: '6px 4px' }}>{p.gmv.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

export default MetricsDashboard;
