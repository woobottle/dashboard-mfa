import type { FederationRuntimePlugin } from '@module-federation/enhanced/runtime';

// MF v2 Runtime Plugin — Remote 로드 실패 시 fallback 모듈을 반환해서
// React.lazy 를 reject 대신 resolve 시킨다 (정상 렌더 경로로 빠지게).
//
// ⚠️ 중요: 이 파일은 MF 초기화 시점에 동기 평가되므로 react / shared 모듈을
// top-level 에서 import 하면 안 된다 ("factory is undefined" 발생).
// 그래서 react 를 끌고 오는 코드는 모두 ./src/RemoteRoute 안에 두고,
// errorLoadRemote 가 실제 호출되는 시점(=sharing scope 준비 완료 후)에
// dynamic import 로 가져온다.

const MAX_RETRIES = 2;
const BASE_DELAY_MS = 250;

const inFlight = new Set<string>();
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function makeFallback(id: string, error: unknown) {
  const { buildRemoteFallbackModule } = await import('./src/RemoteRoute');
  const reason = (error as { message?: string })?.message;
  return buildRemoteFallbackModule(id, reason);
}

const plugin: () => FederationRuntimePlugin = () => ({
  name: 'host-resilience',
  async errorLoadRemote(args: any) {
    const { id, lifecycle, error, origin } = args;
    console.warn(`[mf-resilience] errorLoadRemote id=${id} lifecycle=${lifecycle}`, error);

    // 재귀 호출이면 outer 의 catch 로 흘려보낸다 — fallback 으로 resolve 하면 retry 가 의미를 잃는다.
    if (inFlight.has(id) || !origin || typeof origin.loadRemote !== 'function') {
      if (inFlight.has(id)) throw error ?? new Error(`recursive load fail: ${id}`);
      return makeFallback(id, error);
    }

    inFlight.add(id);
    try {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        await sleep(BASE_DELAY_MS * 2 ** (attempt - 1));
        try {
          const mod = await origin.loadRemote(id);
          console.info(`[mf-resilience] recovered ${id} after ${attempt} retries`);
          return mod;
        } catch (retryErr) {
          console.warn(
            `[mf-resilience] retry ${attempt}/${MAX_RETRIES} failed for ${id}`,
            retryErr,
          );
        }
      }
      return makeFallback(id, error);
    } finally {
      inFlight.delete(id);
    }
  },
});

export default plugin;
