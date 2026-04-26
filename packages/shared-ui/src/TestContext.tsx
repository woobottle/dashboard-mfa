import { createContext, useContext, type ReactNode } from 'react';

interface TestContextValue {
  theme: string;
}

export const TestContext = createContext<TestContextValue>({
  theme: '(default)'
});

export function TestProvider({
  value,
  children,
}: {
  value: TestContextValue;
  children: ReactNode;
}) {
  return <TestContext.Provider value={value}>{children}</TestContext.Provider>;
}

export function useTestContext() {
  return useContext(TestContext);
}

export function getTestContextId() {
  return (TestContext as unknown as { $$id?: string }).$$id ?? Math.random().toString(36).slice(2);
}
