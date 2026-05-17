import { Card, Theme, ThemeProvider } from '@dashboard/shared-ui';
import { periodEventBus, regionEventBus } from  '@dashboard/shared-store';
import { ReactNode, useState } from 'react';
import { BrowserRouter, NavLink, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import { RemoteRoute } from './RemoteRoute';
import RequireAuth from './RequireAuth';
import RequireRole from './RequireRole';

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

function NavWithFilters({ to, children, end }: {to: string, children: ReactNode, end?: boolean}) {
  const location = useLocation();
  return (
    <NavLink to={{pathname: to, search: location.search}} end={end}>
      {children}
    </NavLink>
  )
}

function Home() {
return (
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
)
}

export function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

function AppShell() {
  const [searchParams, setSearchParams] = useSearchParams()
  // url state 사용
  // const [region, setRegion] = useState(() => searchParams.get('region') || 'seoul');
  // const [period, setPeriod] = useState(() => searchParams.get('period') || '7d');
  // const onChangePeriod = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   const newSearchParams = new URLSearchParams(searchParams);
  //   newSearchParams.set('period', e.target.value)
  //   setSearchParams(newSearchParams);
  // }
  // const onChangeRegion = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   const newSearchParams = new URLSearchParams(searchParams);
  //   newSearchParams.set('region', e.target.value)
  //   setSearchParams(newSearchParams);
  // }

  // zustand store 사용
  // const setPeriod = usePeriodStore((state) => state.setPeriod)
  // const period = usePeriodStore((state) => state.period)
  // const setRegion = useRegionStore((state) => state.setRegion)
  // const region = useRegionStore((state) => state.region)
  
  // const onChangePeriod = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   const period = e.target.value;
  //   setPeriod(period);
  // }

  // const onChangeRegion = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   const region = e.target.value;
  //   setRegion(region);
  // }

  // event bus 사용
  const period = periodEventBus.useValue();
  const region = regionEventBus.useValue();
  
  const onChangePeriod = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const period = e.target.value;
    periodEventBus.set(period);
  }

  const onChangeRegion = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const region = e.target.value;
    regionEventBus.set(region);
  }
  
  const [theme, setTheme] = useState<Theme>('light');
  const changeTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }
  
  return (
    <div style={layoutStyle}>
      <ThemeProvider theme={theme}>
          <header style={navStyle}>
            <strong style={{ fontSize: 18 }}>🖥️ Host (shell)</strong>
            <span style={{ color: '#6b7280', fontSize: 12 }}>http://localhost:3000</span>
            <nav style={{ display: 'flex', gap: '12px' }}>
              <NavWithFilters to="/" end>home</NavWithFilters>
              <NavWithFilters to="/metrics">metrics</NavWithFilters>  
              <NavWithFilters to="/users">users</NavWithFilters>  
            </nav>  

            <button onClick={changeTheme}>change Theme</button>
          </header>

          <Card title="확인" style={{ marginTop: 16 }}>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              BE는 <code>http://localhost:4000/health</code> 에서 동작 중인지 확인할 수 있어요.
            </p>
          </Card>

          <Card title="확인" style={{ marginTop: 16 }}>
            <label htmlFor="period">기간 : </label>
            <select id="period" onChange={onChangePeriod} value={period}>
              <option value="7d">7일</option>
              <option value="30d">30일</option>
              <option value="90d">90일</option>
            </select><br />
            <label htmlFor="region">지역 : </label>
            <select id="region" onChange={onChangeRegion} value={region}>
              <option value="seoul">서울</option>
              <option value="busan">부산</option>
              <option value="all">전체</option>
            </select>
          </Card>

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={
                <LoginPage />
            } />
            <Route path="/metrics"
              element={
                <RequireAuth>
                  <RequireRole allowed={['admin', 'cx']}>
                    <RemoteRoute
                      name="metrics"
                      importer={() => import('metrics/MetricsDashboard')}
                    />
                </RequireRole>
                </RequireAuth>
              }
            />
            <Route path="/users"
              element={
                <RequireAuth>
                  <RequireRole allowed={['admin']}>
                    <RemoteRoute
                      name="users"
                      importer={() => import('users/UserList')}
                    />
                  </RequireRole>
                </RequireAuth>
              }
            />
          </Routes>
          
        </ThemeProvider>
      </div>
  );
}
