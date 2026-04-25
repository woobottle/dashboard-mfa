import { createRoot } from 'react-dom/client';
import { MetricsDashboard } from './MetricsDashboard';

const container = document.getElementById('root');
if (!container) throw new Error('#root element not found');

createRoot(container).render(
  <div style={{ padding: 24, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
    <header style={{ marginBottom: 16 }}>
      <strong>📊 Remote: metrics (단독 실행)</strong>
      <span style={{ color: '#6b7280', fontSize: 12, marginLeft: 8 }}>
        http://localhost:3001
      </span>
    </header>
    <MetricsDashboard />
  </div>
);
