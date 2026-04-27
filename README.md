# Module Federation v2로 대시보드 마이크로프론트엔드 구축하기

## 📋 과제 개요

- **학습 목표**
  - Module Federation의 Host/Remote 개념과 런타임 로딩 흐름을 이해해요.
  - `shared` 설정이 왜 필요한지, singleton과 버전 정책이 어떻게 동작하는지 실측으로 체감해요.
  - Host와 Remote 사이에서 **인증 상태를 공유하는 3가지 패턴**을 이해하고, 그중 하나를 직접 구현해요.
  - 여러 Remote가 **데이터를 주고받는 패턴들**을 비교하고 시나리오에 맞게 구현해요.
  - Remote 장애가 났을 때 Host가 살아남는 구조를 설계해요.
- **기한**: 2주
- **결과물**: 동작하는 코드 (GitHub 레포)
- **기술 스택**: Module Federation v2 (`@module-federation/enhanced`), Rspack, React 18, TypeScript, Fastify 5 (BE는 제공됨), pnpm workspace, zustand

## 📖 배경 지식

과제 진행 전, 아래 개념들에 대한 사전 지식이 필요해요. 각 항목의 질문에 답할 수 있을 정도면 돼요. 감이 오지 않는 질문은 Step을 진행하면서 계속 고민해주세요.

### 마이크로 프론트엔드

- 마이크로 프론트엔드가 뭔가요? 왜 필요한가요?
- 마이크로 서비스(BE)와 마이크로 프론트엔드의 공통점과 차이점은 뭔가요?
- 어떤 조직 구조에서 이 접근이 의미 있을까요?

### Module Federation

- `Host`, `Remote`가 각각 뭔가요?
- `exposes`, `remotes`, `shared`는 각각 어떤 설정인가요?
- **빌드 타임**이 아닌 **런타임**에 모듈을 로드한다는 게 무슨 뜻인가요?
- Module Federation v1(`webpack.container.ModuleFederationPlugin`, Webpack 5 내장)과 v2(`@module-federation/enhanced` — Webpack/Rspack 둘 다 지원)의 차이는 뭔가요? (v2는 Rspack 전용이 아니에요)
- `mf-manifest.json`에는 어떤 정보가 들어있나요?

### 핵심 개념

- **Singleton**: 한 모듈을 런타임에 단 하나만 존재시키는 것. 왜 React에 필요할까요?
- **Shared scope**: 여러 Remote가 같은 라이브러리를 공유하는 범위. 버전이 다르면 어떻게 될까요?
- **Lazy loading의 경계**: Remote 컴포넌트는 왜 `import()`로 불러와야 하나요? 정적 import를 쓰면 어떤 문제가 생기나요?

### 인증/인가

- JWT가 뭔가요? Bearer 토큰은 어떻게 전달되나요?
- Role-based access control이 뭔가요?
- Cookie vs Authorization header 각각의 장단점은 뭔가요?

### 참고

- Module Federation v2 공식 문서: https://module-federation.io/
- Rspack Module Federation 가이드: https://rspack.dev/guide/features/module-federation
- zustand: https://zustand-demo.pmnd.rs/
- pnpm workspace: https://pnpm.io/workspaces

## 🏗️ 최종 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                    🖥️  Host (shell)                  │
│                    http://localhost:3000             │
│  ┌────────────────────────────────────────────┐     │
│  │ Layout: 상단 nav + 글로벌 필터 + 로그인 상태 │     │
│  │                                             │     │
│  │ Remote 로딩:                                │     │
│  │   /metrics → metrics remote                 │     │
│  │   /users   → users remote                   │     │
│  └────────────────────────────────────────────┘     │
└────────────┬──────────────────────┬─────────────────┘
             │                      │
   런타임 import()             런타임 import()
             │                      │
             ▼                      ▼
┌─────────────────────┐  ┌─────────────────────────┐
│ 📊 Remote: metrics  │  │ 👥 Remote: users        │
│ localhost:3001      │  │ localhost:3002          │
│ - 트래픽/매출 차트  │  │ - 유저 목록/상세        │
│ - viewer 이상 접근  │  │ - cx/admin만 접근       │
└──────────┬──────────┘  └──────────┬──────────────┘
           │                        │
           │   /api/* (Bearer JWT)  │
           ▼                        ▼
    ┌──────────────────────────────────┐
    │  🔐 BE: Fastify + JWT             │
    │  localhost:4000 (제공됨)          │
    │  POST /auth/login                 │
    │  GET  /auth/me                    │
    │  GET  /api/metrics  (viewer+)     │
    │  GET  /api/users    (cx/admin)    │
    │  POST /api/users/:id/ban (cx/admin)│
    └──────────────────────────────────┘
```

### 시나리오 — 사내 운영툴 대시보드

**역할 분담** (서로 다른 팀이 만든다고 가정)

| 앱                       | 담당 팀  | 책임                                                                   |
| ------------------------ | -------- | ---------------------------------------------------------------------- |
| **Host** (`shell`)       | 플랫폼팀 | 로그인, 공통 네비게이션, 글로벌 필터(기간/지역), 레이아웃, Remote 로딩 |
| **Remote A** (`metrics`) | 데이터팀 | 트래픽·매출·GMV 차트 패널                                              |
| **Remote B** (`users`)   | CX팀     | 유저 검색/목록, 유저 상세, 제재 액션                                   |
| **BE** (`api`)           | 제공됨   | JWT 인증, role 기반 인가, 더미 데이터                                  |

**Role 정책**

- `admin` — 전부 접근 가능
- `viewer` — `metrics`만 접근 가능
- `cx` — `metrics` + `users` 전부, "제재" 액션 가능

## 📦 프로젝트 구조

```
dashboard-mfa/
├── apps/
│   ├── api/                   # 🔐 Fastify BE — 완료된 코드
│   ├── host/                  # shell
│   ├── metrics/               # remote
│   └── users/                 # remote
├── packages/
│   ├── shared-types/          # User, Role, Metrics 등 공통 타입
│   └── shared-ui/             # 공통 디자인 (Card, Button, ErrorBoundary)
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

### starter 상태

처음 clone한 직후의 상태예요.

- `apps/api`와 `packages/*`는 **완성**되어 있어요. 건드리지 마세요.
- `apps/host`, `apps/metrics`, `apps/users`는 각자 **독립 실행 가능한 React 앱**으로 세팅되어 있어요. **MFA 연결은 아직 없어요** — Step 1에서 직접 만들어요.

## 🚦 시작하기

```bash
pnpm install

# BE 먼저 띄우기
pnpm -F api dev

# 다른 터미널에서 각 앱 띄우기
pnpm -F host dev
pnpm -F metrics dev
pnpm -F users dev
```

- `http://localhost:3000` (Host)
- `http://localhost:3001` (metrics)
- `http://localhost:3002` (users)
- `http://localhost:4000` (api)

각 포트에서 독립 실행되는 페이지가 보이면 준비 완료예요.

### BE 엔드포인트

이 과제 동안 호출하게 될 BE API는 다음과 같아요. BE는 이미 완성되어 있고, 토큰 검증과 role 체크가 진짜로 작동해요.

| Method | Path                                   | 설명                                               |
| ------ | -------------------------------------- | -------------------------------------------------- |
| `POST` | `/auth/login`                          | `{ username }` 받아서 JWT 발급. 비밀번호 검증 없음 |
| `GET`  | `/auth/me`                             | Bearer 토큰 검증 후 현재 유저 반환                 |
| `GET`  | `/api/metrics?period=&region=&userId=` | viewer 이상 접근 가능                              |
| `GET`  | `/api/users`                           | cx / admin만 접근 가능                             |
| `POST` | `/api/users/:id/ban`                   | cx / admin만 접근 가능                             |

토큰 없이 호출하면 `401`, 권한 부족하면 `403`을 반환해요.

---

## ⭐ Step 1: Host에 첫 Remote 붙이기

<aside>
💡 `step1/first-remote` 브랜치를 `main`에서 파서 진행해주세요. 이 브랜치의 최종 상태가 Step 2의 출발점이 돼요.
</aside>

### 📖 이해해야 할 내용

- **Module Federation v2 핵심 API**
  - Rspack 설정에서 `@module-federation/enhanced/rspack` 플러그인 등록
  - Remote는 `exposes`로 컴포넌트를 공개, Host는 `remotes`로 URL을 등록
  - `mf-manifest.json`이 생성되고, Host가 런타임에 이걸 읽어서 Remote를 찾아가요
- **런타임 로딩의 의미**
  - Host의 빌드 결과물에 Remote 코드는 포함되지 않아요.
  - 사용자가 `/metrics` 라우트에 접근하는 순간 브라우저가 `remoteEntry.js`를 fetch해요.
  - DevTools Network 탭에서 실제로 확인할 수 있어요.
- **`import()` vs 정적 import**
  - Remote 컴포넌트는 반드시 `React.lazy(() => import('metrics/Dashboard'))` 식으로 불러와야 해요.
  - 정적 import를 쓰면 동기 import 그래프가 평가될 때 shared/remote 런타임 초기화가 끝나기 전에 모듈을 가져오려다, eager consumption 또는 초기화 순서 에러가 나요. 비동기 경계(`import()`)가 있어야 런타임이 매니페스트를 먼저 해석할 시간을 벌어요.
- **`React.Suspense`가 왜 필요한가**
  - Remote 로딩은 비동기예요. fallback UI가 없으면 깜빡거리거나 에러가 나요.
- **bootstrap 패턴**
  - MF v2는 entry를 async로 만들어야 해요. `index.tsx`에서 `await import('./bootstrap')` 식으로 분리하지 않으면 eager consumption 에러가 나요.

### 🔧 실습 내용

**1단계: `metrics` Remote 설정**

- `apps/metrics/rspack.config.ts`에 `ModuleFederationPlugin`을 추가하세요.
- 다음을 `exposes`하세요:
  - `./MetricsDashboard` → `src/MetricsDashboard.tsx`
- `name: 'metrics'`, `filename: 'remoteEntry.js'`로 설정하세요.
- 개발 서버가 `http://localhost:3001/remoteEntry.js`로 서빙하는지 확인하세요.

**2단계: `users` Remote 설정**

- 동일한 방식으로 `apps/users`도 설정하세요. `./UserList`를 노출.

**3단계: Host에서 Remote 소비**

- `apps/host/rspack.config.ts`의 `ModuleFederationPlugin`에 `remotes`를 등록하세요.

  ```ts
  remotes: {
    metrics: 'metrics@http://localhost:3001/mf-manifest.json',
    users: 'users@http://localhost:3002/mf-manifest.json',
  }
  ```

- `src/App.tsx`에서 `react-router-dom`으로 `/metrics`, `/users` 라우트를 만들고, 각 Remote 컴포넌트를 `React.lazy` + `Suspense`로 불러오세요.
- TypeScript 타입 오류가 뜰 거예요. `src/remotes.d.ts`에 모듈 선언을 추가하거나, MF v2의 자동 타입 공유(`dts` 옵션)를 활성화하세요.

**4단계: 검증**

- `http://localhost:3000/metrics`에 접속 → metrics 화면이 뜨는지 확인.
- DevTools Network 탭에서 `mf-manifest.json`과 `remoteEntry.js`가 실제로 요청되는지.
- `http://localhost:3001`(Remote 단독)과 `http://localhost:3000/metrics`(Host 경유)가 같은 화면을 보여주는지.

### ✅ 완료 기준

- [ ] `/metrics`, `/users` 라우트에서 각각 Remote의 컴포넌트가 렌더링됨
- [ ] Network 탭에서 `mf-manifest.json`과 `remoteEntry.js`가 **요청 시점에** 로드됨을 확인
- [ ] Remote 개발 서버를 끄면 Host에서 해당 라우트 접근 시 에러가 뜸 (아직 fallback은 없음 — Step 5에서 다뤄요)
- [ ] Host의 `main.js` 번들에 Remote의 코드가 **포함되지 않음**을 빌드 결과로 확인 (`pnpm -F host build` 후 번들 분석)

### ⚠️ 흔한 함정

- `output.publicPath`를 `auto`로 설정하지 않으면 Remote가 자기 자산 경로를 잘못 계산해요.
- Host의 entry를 async로 만들지 않으면(`bootstrap.tsx` 패턴) eager consumption 에러가 나요. [MF v2 공식 가이드](https://module-federation.io/guide/basic/rspack.html) 참고.

---

## ⭐ Step 2: React가 두 번 로드돼요 — `shared` 수술

<aside>
💡 `step2/shared` 브랜치를 파서 진행해주세요.
</aside>

### 📖 이해해야 할 내용

- **왜 React를 공유해야 하나**
  - Host도 React를 번들에 포함, Remote도 자기 번들에 React 포함. 합치면 React가 2개예요.
  - 같은 버전의 React여도 **인스턴스가 다르면** `Invalid hook call`이 나거나 Context가 격리돼요.
  - singleton으로 지정하면 먼저 로드된 쪽을 모두가 재사용해요.
- **`shared` 설정의 네 가지 축**
  - `singleton: true` — 무조건 하나만 사용
  - `requiredVersion` — 최소 허용 버전
  - `strictVersion: true` — 버전 불일치 시 에러 (기본은 warn)
  - `eager: true` — 비동기 로딩 없이 초기 번들에 포함 (Host의 React는 eager로 두는 게 일반적)
- **Context 공유의 전제**
  - React가 singleton이 되어야 Host에서 만든 Context를 Remote가 소비할 수 있어요.
  - 이게 Step 3에서 "Context 패턴으로 인증 공유"가 가능한 전제 조건이에요.
- **Router 공유의 의미**
  - `react-router-dom`을 singleton으로 공유하면, Host의 `<BrowserRouter>` 하나만 존재해요.
  - Remote 안의 `<Link>`가 Host의 주소창을 진짜로 바꾸고, Remote의 `useLocation()`은 Host의 URL을 읽어요.
  - 이 과제 시나리오에서는 이게 자연스러워요. 자세한 trade-off는 마지막 "생각해볼 질문"에서 다뤄요.

### 📦 starter가 가진 문제

- Step 1을 마친 상태는 `shared` 설정이 거의 비어있어요.
- `packages/shared-ui`의 `<Card>` 같은 공통 컴포넌트가 Host 번들과 Remote 번들에 **양쪽 다** 포함되어 있어요.
- Step 3에서 Host의 Context를 Remote로 전달하려고 시도하면 안 돼요.

### 🔧 실습 내용

**1단계: 증상 재현**

- Host에서 임의의 Context를 만들어 Provider로 감싸고, Remote에서 `useContext`로 읽어보세요.
- Remote가 **Host의 Context 값을 못 읽는 현상**을 React DevTools에서 확인하세요. (별도 Provider가 있는 것처럼 보일 거예요)
- `packages/shared-ui/Card`를 양쪽에서 import한 상태에서 빌드 결과를 까보고, Card 코드가 양쪽 번들에 모두 포함됐는지 확인하세요.

**2단계: `shared` 설정 추가**

- Host와 Remote 양쪽의 MF 설정에 `shared`를 추가하세요. 최소한 다음 4가지를 다뤄요.
  - `react`, `react-dom` — singleton, Host에서 eager, requiredVersion 명시
  - `react-router-dom` — singleton
  - `@dashboard/shared-ui` — singleton
- 다시 빌드하고, **shared된 라이브러리가 공통 chunk로 분리**됐는지 확인하세요.

**3단계: 버전 불일치 실험**

- Remote의 `package.json`에서 shared 라이브러리 버전을 살짝 어긋나게 바꿔보세요. 같은 major 안에서 minor 차이가 안전해요.
  - 예: `react`/`react-dom`을 `18.2.0` ↔ `18.3.0` 으로 다르게.
  - 또는 workspace 패키지(`@dashboard/shared-ui`)의 버전을 한쪽만 올려보세요.
  - ⚠️ React 17 ↔ 18은 `createRoot`/`ReactDOM.render` API 자체가 달라서 그냥 깨져요. **버전 정책 학습이 목적이라면 minor 차이로 충분**해요.
- 재설치 후 실행 → 어떤 경고/에러가 나는지 관찰하세요.
- `strictVersion: true`일 때와 `false`일 때 차이를 비교하세요. (singleton + strictVersion 조합에서 가장 명확하게 동작 차이가 보여요)

**4단계: Context 공유 검증**

- Host에서 `const ThemeContext = createContext('dark')` 같은 샘플 Context를 만들어 Provider로 감싸세요.
- Remote 컴포넌트에서 `useContext(ThemeContext)`로 읽어서 값이 **Host가 제공한 값**인지 확인하세요.
- 이게 동작해야 Step 3에서 인증 공유 패턴 (a)가 가능해요.

**5단계: Router 공유 검증**

- Remote 안에 `<Link to="/users">` 같은 링크를 두고, 클릭 시 Host의 주소창이 바뀌는지 확인하세요.
- Remote에서 `useLocation()`을 호출했을 때 Host의 현재 URL이 읽히는지 확인하세요.

### ✅ 완료 기준

- [ ] Host와 Remote가 **같은 React 인스턴스**를 사용 (`window.React === remoteReact` 식으로 검증해도 좋아요)
- [ ] Host의 Context를 Remote가 정상 소비
- [ ] Remote의 `<Link>` 클릭이 Host의 URL을 바꿈
- [ ] `shared-ui`의 컴포넌트가 공통 chunk로 한 번만 로드됨
- [ ] 버전 불일치 시 어떤 경고/에러가 나는지 본인 언어로 정리 (README에 한두 줄)

### ⚠️ 흔한 함정

- Host에서만 `eager: true`로 두세요. Remote도 eager로 하면 초기 번들이 비대해지고 의미가 없어져요.
- workspace 패키지(`@dashboard/shared-ui`)를 shared하려면 `requiredVersion`에 workspace 별칭이 아닌 **실제 버전**이 들어가야 해요.
- `react-router-dom`을 v6 기준으로 사용하세요. v5와는 API가 달라서 가이드와 어긋날 수 있어요.

---

## ⭐ Step 3: 로그인 상태를 Remote가 알아야 해요 — 인증 공유

<aside>
💡 `step3/auth-sharing` 브랜치를 파서 진행해주세요.
</aside>

### 📖 이해해야 할 내용

- **인증 공유의 본질**
  - "누가 로그인 상태를 소유하고, 어떻게 Remote로 전파하느냐"의 문제예요.
  - 상태 저장 위치(메모리 / localStorage / shared singleton)와 전파 메커니즘(React tree / Browser API / Pub-Sub)의 조합이에요.
- **Role 기반 가시성**
  - `admin` / `viewer` / `cx` 3가지 role.
  - `metrics`는 viewer 이상 접근 가능, `users`의 "제재" 버튼은 cx / admin만.
  - Remote가 role을 **진짜로 알아야만** 올바른 UI를 그릴 수 있어요.
- **401 / 403의 차이**
  - 401: 토큰 없음 또는 만료 → 로그인 화면으로 이동
  - 403: 토큰은 있는데 권한 부족 → "권한 없음" UI
  - BE(`apps/api`)가 실제로 두 상태를 구분해서 반환해요.
- **Cookie를 안 쓰고 Bearer 토큰을 쓰는 이유**
  - Cookie는 브라우저가 자동으로 실어 보내서, "Remote가 토큰을 어떻게 공유받느냐"라는 이 Step의 질문 자체가 사라져요.
  - Bearer 토큰이어야 아래 3패턴 비교가 의미 있어져요.
  - 실무에서는 보안상 httpOnly cookie를 쓰는 게 더 일반적이라는 점은 별도로 알아두세요.

### 📦 제공되는 것

- `apps/api`는 완성 상태예요.
  - `POST /auth/login { username }` → `{ token, user: { id, name, role } }`
  - `GET /auth/me` (`Authorization: Bearer ...`) → 현재 유저
  - `/api/*` 호출 시 토큰 없으면 401, role 부족하면 403
- `packages/shared-types`에 `User`, `Role`, `AuthState` 타입이 있어요.

### 🔧 실습 내용 — 3패턴 이해 후 1개 선택 구현

이 Step의 핵심은 **3가지 패턴을 모두 이해하고, 그중 하나를 골라 끝까지 구현**하는 거예요. 선택의 근거를 본인 언어로 남기는 게 가장 중요해요.

> 📌 **세 패턴은 두 축으로 나뉘어요.** 비교 전에 이 구분을 먼저 잡고 가세요.
> - **상태 전파 메커니즘**: (a) React Context vs (c) Singleton Store — "Host가 가진 인증 상태를 Remote가 어떻게 구독하느냐"
> - **토큰 저장/transport**: (b) Storage + Fetch Interceptor — "토큰을 어디 두고, API 호출 시 어떻게 헤더에 붙이느냐"
>
> (b)는 (a)/(c)와 직교하는 결정이에요. 실무에서는 보통 **(b) + (a 또는 c)** 조합으로 쓰지만, 이 과제에서는 학습을 위해 **세 패턴을 일단 분리해서 비교한 뒤** 본인이라면 어떻게 조합할지까지 README에 적어주세요.

#### 패턴 (a) — React Context 공유

- `packages/shared-auth`(직접 만들거나 starter에 있다면 활용)에 Context를 정의하고, Host가 Provider, Remote가 훅으로 소비.
- 전제: Step 2에서 React가 singleton으로 공유되어 있어야 동작.
- **핵심 난점**: Context 객체의 **참조 동일성**. Host와 Remote가 각자 `createContext`를 호출하면 다른 Context가 돼요. Context 객체 자체를 어떻게 공유할지 설계가 필요해요. (힌트: shared 패키지에 Context를 정의하고 양쪽이 import)

#### 패턴 (b) — Storage + Fetch Interceptor

- 토큰을 localStorage에 저장.
- 공통 fetch wrapper(`createApiClient()` 등)를 만들어서 자동으로 `Authorization` 헤더를 첨부.
- Remote는 Context 없이 이 클라이언트만 import해서 사용.
- **고민할 점**: role 정보는 어디서 어떻게 캐싱할지? 매번 `/auth/me`를 호출할지? 토큰 갱신/로그아웃 시 broadcast는 어떻게?

#### 패턴 (c) — Shared Singleton Store

- `packages/shared-auth`(또는 별도 패키지)에 zustand store를 만들고 `shared`로 singleton 공유.
- Host가 store에 write, Remote가 store에서 read.
- **고민할 점**: store의 스키마가 Host/Remote 공통 의존성이 됨. 버전 변경 시 모두 영향.

### 📝 구현 요건 (선택한 패턴 기준)

선택한 패턴으로 다음을 모두 구현하세요.

- `/login` 페이지 — role 드롭다운(admin/viewer/cx) + 로그인 버튼
- 로그인 성공 시 토큰을 받아 보관, `/`로 이동
- 새로고침 후에도 로그인 상태가 복원돼야 함
- API 호출 시 Bearer 토큰이 자동으로 첨부
- `metrics`는 viewer 이상 접근 가능, 미만이면 "권한이 없어요" UI
- `users`의 "제재" 버튼은 role이 cx / admin일 때만 렌더
- BE가 401 반환 시 → 로그인 화면으로 리다이렉트
- BE가 403 반환 시 → "권한 없음" UI

### 🔧 실습 흐름

**1단계: 3패턴 비교 정리**

- 본인의 README나 별도 문서에 3패턴의 개념·동작·trade-off를 한 문단씩 정리하세요.
- 비교 축 예시:
  - **결합도** (Host-Remote 의존성)
  - **shared 설정 복잡도**
  - **토큰 보안** (XSS 노출 등)
  - **재사용성** (다른 Host에 Remote를 그대로 붙일 수 있는가)
  - **테스트 용이성**

**2단계: 1개 선택 + 근거 명시**

- 위 비교를 바탕으로 1개 패턴을 골라 README에 **선택 이유**를 적으세요. 본인이 만드는 시나리오의 어떤 특성이 그 패턴과 잘 맞는지가 핵심이에요.

**3단계: 선택한 패턴으로 끝까지 구현**

- 위 "구현 요건"을 모두 충족.
- BE가 진짜 401/403을 반환하니까 DevTools Network 탭으로 검증하세요.

**4단계: CORS 검증**

- Host(3000), Remote(3001/3002), BE(4000)가 다 다른 origin이에요.
- BE는 이미 CORS 허용 설정이 되어 있어요. 그래도 어떤 헤더가 preflight되고, `Access-Control-Allow-Origin`이 어떻게 응답되는지 한 번 살펴보세요.

### ✅ 완료 기준

- [ ] 3패턴의 개념·trade-off를 README에 정리
- [ ] 선택한 1개 패턴으로 모든 구현 요건을 충족
- [ ] **선택 근거를 README에 본인 언어로 명시**
- [ ] Role 기반 UI 분기 동작 (viewer로 로그인 → users 접근 불가, cx로 로그인 → 제재 버튼 보임)
- [ ] 401/403 시나리오를 DevTools에서 각각 재현 가능
- [ ] 새로고침 후 로그인 상태가 복원됨

### ⚠️ 흔한 함정

- Context 객체는 **참조 동일성**이 중요해요. Host와 Remote가 각자 `createContext`를 호출하면 서로 다른 Context가 돼요. 반드시 한 곳에서 만들어 import해야 해요.
- 전역 `fetch`를 monkey-patch하는 식의 인터셉터는 디버깅 지옥을 부를 수 있어요. 명시적인 클라이언트 팩토리가 안전해요.
- zustand를 singleton으로 공유하려면 store 인스턴스가 **모듈 top-level**에서 생성되어야 해요. 함수 안에서 만들면 인스턴스가 분리될 수 있어요.

---

## ⭐ Step 4: Remote끼리 데이터를 주고받아야 해요 — 데이터 공유

<aside>
💡 `step4/data-sharing` 브랜치를 파서 진행해주세요.
</aside>

### 📖 이해해야 할 내용

- **두 종류의 데이터 흐름**
  - **(1) 브로드캐스트**: Host의 글로벌 필터(기간 / 지역)를 바꾸면 → `metrics`와 `users`가 동시에 반응
  - **(2) 피어 간 전파**: `users`에서 유저를 클릭 → `metrics`가 그 유저의 지표로 드릴다운
- **패턴 후보**
  - (a) **Host-owned state** — Host가 상태 소유, props로 내림 / callback으로 받음
  - (b) **이벤트 버스** — `window.dispatchEvent(new CustomEvent(...))` 또는 `mitt` 같은 라이브러리
  - (c) **Shared zustand store** — singleton store에 공통 상태를 두고 양쪽이 구독
  - (d) **URL state** — search params로 상태 표현 (`?period=7d&userId=123`)
- **각 패턴이 어울리는 시나리오**
  - 글로벌 필터(브로드캐스트): URL state가 자연스러울 수 있어요. 새로고침/북마크에도 강해요.
  - 피어 전파: 이벤트 버스 / shared store / URL state 모두 후보
  - Host-owned는 가장 단순하지만 Host가 Remote의 props 모양을 알아야 해서 결합도가 올라가요.

### 🔧 실습 내용

**1단계: 글로벌 필터 (브로드캐스트) 구현**

- Host 상단에 "기간"(7일 / 30일 / 90일), "지역"(서울 / 부산 / 전체) 드롭다운 추가.
- 값이 바뀌면 `metrics` 차트와 `users` 목록이 **동시에** 새 데이터로 갱신되어야 해요.
- 패턴 후보 중 하나를 골라 구현하고, README에 선택 근거를 남기세요.
- 가능하면 (a)와 (d)를 둘 다 시도해보고 차이를 직접 체감해보세요. 새로고침 시 동작 차이가 큰 학습 포인트예요.

**2단계: 피어 간 드릴다운 구현**

- `users` 목록에서 유저를 클릭하면 → `metrics`가 그 유저의 지표(`/api/metrics?userId=...`)로 전환.
- 패턴 후보 중 하나를 골라 구현하고, README에 선택 근거를 남기세요.

**3단계: 패턴 비교 정리**

- README에 비교표를 만들어요. 축 예시:
  - **결합도** (각 Remote가 다른 Remote의 존재를 알아야 하는가)
  - **디버깅 용이성** (이벤트가 어디서 발화되고 누가 받는지 추적이 쉬운가)
  - **타입 안정성**
  - **재사용성** (다른 Host에 Remote를 그대로 붙일 수 있는가)
  - **새로고침/북마크 친화성**
- 본인이라면 실무에서 어떤 시나리오에 어떤 패턴을 쓸지를 한 줄씩 결정하세요.

**4단계 (보너스): TanStack Query 캐시 공유**

- `@tanstack/react-query`를 shared singleton으로 설정.
- `QueryClient` 하나를 Host에서 만들어 Provider로 감싸요.
- `metrics`와 `users`가 같은 API를 호출할 때 중복 요청이 사라지는지 Network 탭으로 확인하세요.
- 캐시를 공유하면 어떤 새로운 문제가 생기는지도 같이 생각해보세요. (예: 한 Remote의 mutation 결과가 다른 Remote의 캐시를 무효화해야 할 때)

### ✅ 완료 기준

- [ ] 글로벌 필터 변경 시 `metrics`와 `users`가 동시에 반응
- [ ] `users`에서 유저 클릭 시 `metrics`가 드릴다운 뷰로 전환
- [ ] 각 시나리오마다 **선택한 패턴과 근거**를 README에 명시
- [ ] 패턴 비교표 (결합도 / 디버깅 / 타입 안정성 / 재사용성 / 새로고침 친화성)
- [ ] (보너스) TanStack Query 캐시 공유로 중복 API 호출 제거 확인

### ⚠️ 흔한 함정

- 이벤트 버스를 쓸 때 **구독 해제**를 안 하면 Remote 언마운트 후에도 콜백이 남아 메모리 누수 + 이중 발화가 생겨요.
- zustand 훅의 selector를 잘못 쓰면 store의 어떤 값이 바뀌든 모든 구독자가 리렌더돼요.
- Host-owned 패턴에서 Remote의 props 타입을 어떻게 공유할지도 설계 포인트예요. `shared-types`를 활용하세요.
- URL state는 깔끔하지만, 너무 많은 상태를 URL에 담으면 URL이 거대해지고 가독성이 나빠져요.

---

## ⭐ Step 5: Remote가 죽어도 Host는 살아야 해요 — 장애 대응

<aside>
💡 `step5/resilience` 브랜치를 파서 진행해주세요.
</aside>

### 📖 이해해야 할 내용

- **MFA의 런타임 커플링 리스크**
  - Remote 빌드가 깨졌거나 서버가 죽었을 때, Host도 같이 죽으면 MFA의 의미가 없어져요.
  - "이 영역은 잠시 사용 불가, 다른 영역은 정상" 상태가 되어야 해요.
- **ErrorBoundary의 한계**
  - React의 `ErrorBoundary`는 **렌더 단계의 에러**만 잡아요.
  - `import()` 실패 같은 Promise rejection은 안 잡혀요.
- **MF v2 Runtime Plugin**
  - `@module-federation/enhanced/runtime`이 제공하는 hook을 등록할 수 있어요.
  - `errorLoadRemote` 훅에서 **fallback 모듈**(예: `{ default: FallbackComponent }` 형태의 모듈 객체)을 반환하면 그 모듈로 대체돼요. 컴포넌트 함수를 그대로 반환하지 않도록 주의하세요.
  - 재시도 로직도 이 훅 안에서 직접 구현할 수 있어요 (lifecycle 인자로 어느 단계에서 실패했는지도 받아옴).
  - 자세한 내용은 [공식 문서](https://module-federation.io/plugin/dev/index.html) 참고.
- **Graceful degradation**
  - 차트가 죽으면 "지금 지표를 표시할 수 없어요" 정도의 메시지로 대체.
  - 전체 네비게이션은 유지되고, 다른 Remote는 정상 동작해야 해요.

### 🔧 실습 내용

**1단계: 장애 재현**

- Remote dev 서버 끄기 → Host가 어떤 상태가 되는지 관찰
- `remoteEntry.js` URL을 일부러 404로 바꾸기 (Rspack config에서) → 매니페스트 로드 실패가 어떻게 보이는지
- Remote 컴포넌트에서 일부러 `throw new Error('boom')` → 런타임 렌더 에러
- 각 케이스에서 **에러가 어디까지 전파되는지**를 본인 눈으로 확인하세요.

**2단계: ErrorBoundary로 1차 방어**

- 각 Remote 로딩 지점을 `<ErrorBoundary fallback={<RemoteUnavailable name="metrics" />}>`로 감싸세요.
- `packages/shared-ui`의 `ErrorBoundary`를 활용해도 좋아요.
- 어떤 종류의 에러까지 잡히는지 1단계에서 본 케이스로 검증해보세요.

**3단계: MF v2 Runtime Plugin으로 import 실패 처리**

- Host에 runtime plugin을 등록하세요.
- `errorLoadRemote` 훅에서 fallback 모듈을 반환하거나 다음 동작을 정의.
- 재시도 로직도 추가해보세요 (최대 3회, 지수 backoff).

**4단계: 상태별 UX 설계**

- 시나리오별 fallback UI:
  - Remote 전체 로드 실패 → "이 영역을 불러올 수 없어요" 카드 + 재시도 버튼
  - Remote 내부 컴포넌트 throw → 해당 영역만 skeleton + 에러 메시지
  - API 401/403 → Step 3에서 처리한 흐름 그대로
- 사용자가 다른 Remote 라우트로 이동할 수 있어야 해요. 죽은 Remote 때문에 네비게이션 자체가 잠기면 안 돼요.

### ✅ 완료 기준

- [ ] Remote 서버가 꺼진 상태에서 Host가 크래시 없이 동작, 해당 라우트만 fallback UI
- [ ] Remote의 런타임 throw가 Host 전역으로 전파되지 않음
- [ ] 재시도 동작을 Network 탭에서 관찰 가능
- [ ] fallback UI 디자인의 의도를 한 줄이라도 README에 남김 (왜 이 메시지·이 모양인지)

### ⚠️ 흔한 함정

- ErrorBoundary는 **React 렌더 에러**만 잡아요. Promise rejection은 별도 처리가 필요해요.
- 재시도를 무한 루프로 돌리면 사용자 브라우저를 괴롭혀요. 반드시 횟수 상한 + backoff.
- fallback UI가 화면 전체를 덮으면 다른 Remote 사용까지 막힐 수 있어요. fallback의 영역을 명확히 한정하세요.

---

## 🎓 과제 완료 후 생각해볼 질문

아래 질문에 대한 답변을 자유롭게 정리해보세요.

### 1. MFA의 가치

- Module Federation을 도입해서 얻는 것은 무엇이고, 포기하는 것은 무엇인가요?
- 어떤 팀 규모·조직 구조에서 이 투자가 정당화될까요?
- 단일 레포 + lazy route split이 해결하지 못하고 MFA만이 해결하는 문제는 무엇인가요?

### 2. 공유의 경계

- Step 3에서 선택한 인증 공유 패턴을 본인이 실무에서도 기본값으로 가져갈 건가요? 어떤 상황에서 다른 패턴을 고를까요?
- Step 4에서 선택한 데이터 공유 패턴은 어떤가요?
- "shared" 설정을 늘릴수록 얻는 것과 잃는 것은 무엇일까요?
- Remote의 "재사용성"은 과대평가된 가치일까요, 실제로 중요한가요?

### 3. Router 공유의 trade-off

- 이 과제는 `react-router-dom`을 shared singleton으로 가져갔어요. 이걸 **Host의 Router 하나만 존재시키는 패턴 A**라고 부를게요.
- 반대 패턴, 즉 **각 Remote가 자체 Router(예: `MemoryRouter`)를 들고 있는 패턴 B**는 언제 유리할까요?
- Remote를 "여러 Host에 임베드되는 위젯"으로 만들고 싶다면 어떤 선택이 맞을까요?

### 4. 운영 관점

- Remote를 독립 배포할 때 실무에서 걱정해야 할 것들은 뭘까요? (버전 호환성 / 점진적 롤아웃 / 캐시 무효화 / 롤백)
- Remote에서 장애가 나면 어느 팀이 책임지나요? 모니터링·알람의 경계를 어떻게 그려야 할까요?
- 로컬 개발자 경험(여러 Remote dev 서버 동시 구동)을 어떻게 개선할 수 있을까요?

---

## 🔗 한 번 더 볼 만한 링크

- [Module Federation v2 docs](https://module-federation.io/)
- [MF v2 Runtime Plugins](https://module-federation.io/plugin/dev/index.html)
- [Rspack Module Federation guide](https://rspack.dev/guide/features/module-federation)
- [React Suspense docs](https://react.dev/reference/react/Suspense)
- [zustand SSR / sharing](https://zustand.docs.pmnd.rs/)
- [TanStack Query SSR / shared cache](https://tanstack.com/query/latest/docs/framework/react/guides/ssr)

수고하셨어요!


## step3 3패턴 비교
패턴 (a) — React Context 공유
* Host-Remote 의존성이 강함 / remote에서는 host에서의 provider하위에 존재해야함
* shared 설정 복잡도 / 복잡도는 높지 않음, 
* 토큰 보안 (XSS 노출 등) / 토큰이 메모리에 존재하고 있음, 토큰 보안에 대해선 안전
* 재사용성 (다른 Host에 Remote를 그대로 붙일 수 있는가) / 다른 host에 remote를 붙이려면 provider 세팅이 되어 있어야 함
* 테스트 용이성 / provider를 주입해주어야 함, 테스트는 용이하다고 판단

패턴 (b) — Storage + Fetch Interceptor
* Host-Remote 의존성이 약함 / remote에서는 공통 fetch wrapper를 사용하면 됨
* shared 설정 복잡도 / 토큰 주입등 shared의 fetch wrapper에서 이루어져야 함
* 토큰 보안 (XSS 노출 등) / 토큰이 브라우저 스토리지에 위치하고 있어 xss 주의 필요
* 재사용성 (다른 Host에 Remote를 그대로 붙일 수 있는가) / 공통 fetch wrapper를 사용하면 문제 없음 
* 테스트 용이성 / fetch wrapper mock을 주입해주어야 함, 테스트는 용이하다고 판단

패턴 (c) — Shared Singleton Store
* Host-Remote 의존성이 약함 / remote에서는 shared store에 의존
* shared 설정 복잡도 / 복잡도는 높지 않다고 판단
* 토큰 보안 (XSS 노출 등) / 토큰이 메모리에 존재하고 있음, 토큰 보안에 대해선 안전
* 재사용성 (다른 Host에 Remote를 그대로 붙일 수 있는가) / 공통 shared store를 쓰고 있으면 문제 x, 단 버전과 스키마가 동일해야함, 스키마 변경시 사용처들 전부 파악 필요
* 테스트 용이성 / 현재 스키마에 맞는 store만 주입해주면 됨
