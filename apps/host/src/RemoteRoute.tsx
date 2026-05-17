import { ComponentType, createContext, lazy, ReactNode, Suspense, useCallback, useContext, useMemo, useState } from "react";
import { Button, Card, ErrorBoundary } from "@dashboard/shared-ui";

export const RemoteRetryContext = createContext<() => void>(() => {});

interface Props { 
  name: string;
  importer: () => Promise<{ default: ComponentType<Record<string,never>> }>;
}

export const RemoteRoute = ({name, importer}: Props) => {
  // key가 바뀔 때마다 새 lazy()가 만들어진다 -> 캐시된 reject를 무시하고 import 재시도.
  // React.lazy는 첫 import 결과를 컴포넌트 식별자에 영구 캐시하므로 retry의 핵심
  const [retryKey, setRetryKey] = useState(0);
  const Component = useMemo(() => lazy(importer), [importer, retryKey])
  const retry = useCallback(() => setRetryKey((k) => k + 1), [])

  return (
    <RemoteRetryContext.Provider value={retry}>
      <ErrorBoundary key={retryKey} onError={(err) => {
        console.warn(`RemoteRoute [${name}] failed loading, retrying...`, err)
      }}
        fallback={(error, reset) => <RemoteRenderError name={name} error={error} onRetry={() => { 
          reset();
          retry();
         }} />}
      >
        <Suspense fallback={<div style={{ padding: '30px 0' }}>Loading {name}...</div>}>
          <Component />
        </Suspense>
      </ErrorBoundary>
    </RemoteRetryContext.Provider>
  )
  
}

function RemoteRenderError({
  name,
  error,
  onRetry,
}: {
  name: string;
  error: Error;
  onRetry: () => void;
}) {
  return (
    <Card title={`${name} 에서 문제가 발생했어요`}>
      <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>
        Remote 컴포넌트가 렌더 중 예외를 던졌어요. 다른 영역은 계속 사용할 수 있어요.
      </p>
      <pre
        style={{
          marginTop: 8,
          padding: 8,
          background: '#fef2f2',
          color: '#991b1b',
          fontSize: 12,
          borderRadius: 4,
          overflow: 'auto',
        }}
      >
        {error.message}
      </pre>
      <div style={{ marginTop: 12 }}>
        <Button onClick={onRetry}>다시 시도</Button>
      </div>
    </Card>
  );
}

// 런타임 플러그인이 errorLoadRemote 시 반환하는 fallback 모듈에서 import 해 쓰는 컴포넌트.
// import 실패는 ErrorBoundary 가 잡지 못한다 (Promise rejection → React.lazy 가 처리).
// 런타임 플러그인이 fallback module 을 돌려주면 lazy 가 그걸로 resolve 하므로 정상 렌더 경로를 탄다.
export function RemoteLoadFallback({ name, reason }: { name: string; reason?: string }): ReactNode {
  const retry = useContext(RemoteRetryContext);
  return (
    <Card title={`${name} 영역을 불러올 수 없어요`}>
      <p style={{ margin: 0, color: '#6b7280', fontSize: 13, lineHeight: 1.6 }}>
        Remote 모듈 로드가 실패했어요. 잠시 후 다시 시도하거나, 다른 영역으로 이동하세요.
      </p>
      {reason && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#991b1b' }}>사유: {reason}</div>
      )}
      <div style={{ marginTop: 12 }}>
        <Button onClick={retry}>다시 시도</Button>
      </div>
    </Card>
  );
}

// runtime plugin 에서 dynamic import 하여 React.lazy 가 resolve 할 모듈 형태로 돌려준다.
// runtime plugin 본체가 react 를 직접 import 하면 MF sharing scope 초기화 전 평가되어
// `factory is undefined (webpack/sharing/consume/default/react/react)` 가 발생하므로
// react 의존이 들어가는 코드는 모두 이 파일 (dynamic import 대상) 안에 가둔다.
export function buildRemoteFallbackModule(name: string, reason?: string) {
  function RemoteFallbackDefault() {
    return <RemoteLoadFallback name={name} reason={reason} />;
  }
  return { default: RemoteFallbackDefault };
}
