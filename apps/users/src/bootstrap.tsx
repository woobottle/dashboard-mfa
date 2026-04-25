import { createRoot } from 'react-dom/client';
import { UserList } from './UserList';

const container = document.getElementById('root');
if (!container) throw new Error('#root element not found');

createRoot(container).render(
  <div style={{ padding: 24, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
    <header style={{ marginBottom: 16 }}>
      <strong>👥 Remote: users (단독 실행)</strong>
      <span style={{ color: '#6b7280', fontSize: 12, marginLeft: 8 }}>
        http://localhost:3002
      </span>
    </header>
    <UserList />
  </div>
);
