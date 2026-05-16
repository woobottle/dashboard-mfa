import { createRoot } from 'react-dom/client';
import { App } from './App';
import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { TestProvider, TestContext } from '@dashboard/shared-ui';
import LoginPage from './pages/LoginPage';
import { customFetcher } from '@dashboard/shared-api';
import NoAuthroizedPage from './pages/NoAuthroizedPage';

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
    path: '/no-auth',
    element: <NoAuthroizedPage />
  },
  {
    path: '/',
    element: <App />,
  },
]);

customFetcher.setRequestInterceptor((opts) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    opts.headers = { ...opts.headers, Authorization: `Bearer ${token}` };
  }
  return opts;
})

customFetcher.setResponseInterceptor((response) => {
  console.log('this is shit')
  if(response.status === 401) {
    router.navigate('/')
  } 

  if (response.status === 403) {
    router.navigate('/no-auth')
  }

  return response;
})


const container = document.getElementById('root');
if (!container) throw new Error('#root element not found');

createRoot(container).render(
  <TestProvider value={{ theme: 'light' }}>
    <RouterProvider router={router} />
  </TestProvider>,
);
