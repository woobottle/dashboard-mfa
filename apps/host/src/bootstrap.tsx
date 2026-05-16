import { createRoot } from 'react-dom/client';
import { App } from './App';
import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import { customFetcher } from '@dashboard/shared-api';
import NoAuthroizedPage from './pages/NoAuthroizedPage';
import { QueryClientProvider } from '@dashboard/shared-store';
import { ErrorBoundary } from '@dashboard/shared-ui';
import FallbackComponent from './FallbackComponent';


const MetricsDashboard = lazy(() => import('metrics/MetricsDashboard'));
const UserList = lazy(() => import('users/UserList'));
  
const router = createBrowserRouter([
  {
    path: '/metrics',
    element: (
      <ErrorBoundary fallback={<FallbackComponent />}>
        <Suspense fallback={<div>Loading Metrics...</div>}>
          <MetricsDashboard />
        </Suspense>
      </ErrorBoundary>
    ),
    errorElement: <FallbackComponent />
  },
  {
    path: '/users',
    element: (
      <ErrorBoundary fallback={<div style={{padding:16}}>router caught: users 영역 사용 불가</div>}>
        <Suspense fallback={<div>Loading Users...</div>}>
          <UserList />
        </Suspense>
      </ErrorBoundary>
    )
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
  <QueryClientProvider>
    <RouterProvider router={router} />
  </QueryClientProvider>
);
