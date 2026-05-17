import { useAuthStore } from './store';

// ApiError: 호출자가 401/403을 구분해 처리할 수 있게 status 를 노출.
export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export interface ApiClient {
  get<T>(path: string, init?: RequestInit): Promise<T>;
  post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
}

// 명시적인 클라이언트 팩토리.
// 전역 fetch monkey-patch 대신 모든 호출이 이 함수를 통과하도록 한다 → 디버깅이 쉽다.
//
// 토큰은 호출 시점에 store 에서 읽는다. closure 로 잡으면 refresh/logout 후 stale 토큰을
// 계속 보낼 수 있다.
async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const { token, apiBase, logout } = useAuthStore.getState();
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (body !== undefined) headers.set('Content-Type', 'application/json');

  const res = await fetch(`${apiBase}${path}`, {
    ...init,
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let parsed: unknown = null;
    try {
      parsed = await res.json();
    } catch {
      /* noop */
    }
    const extracted =
      parsed && typeof parsed === 'object' && 'message' in parsed
        ? String((parsed as { message?: unknown }).message ?? '')
        : '';
    const message = extracted || res.statusText;

    // 401 → 토큰 폐기. UI 는 status === 'unauthenticated' 를 보고 로그인 화면으로 보낸다.
    if (res.status === 401) logout();

    throw new ApiError(res.status, message, parsed);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const apiClient: ApiClient = {
  get: (path, init) => request('GET', path, undefined, init),
  post: (path, body, init) => request('POST', path, body, init),
};
