import { createRoot } from 'react-dom/client';
import { App } from './App';
import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { TestProvider, TestContext } from '@dashboard/shared-ui';
import LoginPage from './pages/LoginPage';

console.log('[host] TestContext object id =', TestContext);

const MetricsDashboard = lazy(() => import('metrics/MetricsDashboard'));
const UserList = lazy(() => import('users/UserList'));

const router = createBrowserRouter([
  {
    path: '/metrics',
    element: (
      <Suspense fallback={<div>Loading Metrics...</div>}>
        <MetricsDashboard />
      </Suspense>
    ),
  },
  {
    path: '/users',
    element: (
      <Suspense fallback={<div>Loading Users...</div>}>
        <UserList />
      </Suspense>
    ),
  },
  {
    path: '/login',
    element:(<LoginPage />)
  },
  {
    path: '/',
    element: <App />,
  },
]);

const container = document.getElementById('root');
if (!container) throw new Error('#root element not found');

createRoot(container).render(
  <TestProvider value={{ theme: 'light' }}>
    <RouterProvider router={router} />
  </TestProvider>,
);
