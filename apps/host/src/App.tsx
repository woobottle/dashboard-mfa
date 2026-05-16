import { Card } from '@dashboard/shared-ui';
import { createSharedValue, periodEventBus, regionEventBus, usePeriodStore, useRegionStore } from  '@dashboard/shared-store';
import { useSearchParams } from 'react-router-dom';

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
    </div>
  );
}
