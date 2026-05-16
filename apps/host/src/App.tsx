import { Card } from '@dashboard/shared-ui';
import { useEffect } from 'react';

const layoutStyle: React.CSSProperties = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  maxWidth: 880,
  margin: '40px auto',
  padding: '0 16px',
  color: '#111827',
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  padding: '12px 0',
  borderBottom: '1px solid #e5e7eb',
  marginBottom: 24,
  alignItems: 'center',
};

export function App() {

  
  return (
    <div style={layoutStyle}>
      <header style={navStyle}>
        <strong style={{ fontSize: 18 }}>🖥️ Host (shell)</strong>
        <span style={{ color: '#6b7280', fontSize: 12 }}>http://localhost:3000</span>
      </header>

      <Card title="Starter 상태">
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          이 화면은 Host가 단독으로 실행되는 상태예요. <br />
          아직 Module Federation 연결은 없어요. <strong>Step 1</strong>에서 직접 metrics / users
          Remote를 붙여보세요.
        </p>
        <ul style={{ marginTop: 12, lineHeight: 1.8 }}>
          <li>
            할 일: <code>apps/host/rspack.config.ts</code> 에{' '}
            <code>ModuleFederationPlugin</code> 추가
          </li>
          <li>
            할 일: <code>/metrics</code>, <code>/users</code> 라우트 만들기 (
            <code>react-router-dom</code> + <code>React.lazy</code> + <code>Suspense</code>)
          </li>
          <li>
            할 일: Remote 컴포넌트의 타입 선언 (<code>src/remotes.d.ts</code> 또는 MF v2{' '}
            <code>dts</code> 옵션)
          </li>
        </ul>
      </Card>

      <Card title="확인" style={{ marginTop: 16 }}>
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          BE는 <code>http://localhost:4000/health</code> 에서 동작 중인지 확인할 수 있어요.
        </p>
      </Card>
    </div>
  );
}
