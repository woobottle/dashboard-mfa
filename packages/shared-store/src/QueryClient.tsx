import { QueryClient, QueryClientProvider as ReactQueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    }
  }
}
);

const QueryClientProvider = ({ children }: { children: React.ReactNode }) => {
  return <ReactQueryClientProvider client={ queryClient }> { children } </ReactQueryClientProvider>
}

export default QueryClientProvider;