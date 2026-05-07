// ./src/runtime-plugin/retry.ts
import { RetryPlugin } from '@module-federation/retry-plugin';

const retryPlugin = () => RetryPlugin({
  retryTimes: 3,
  retryDelay: 1000,
  manifestDomains: ['http://localhost:3001', 'http://localhost:3002'],
  domains: ['http://localhost:3001', 'http://localhost:3002'],
  addQuery: ({ times, originalQuery }) => `${originalQuery}&retry=${times}`,
  onRetry: ({ times, url }) => console.log('retry', times, url),
  onSuccess: ({ url }) => console.log('success', url),
  onError: ({ url }) => console.log('error', url),
})

export default retryPlugin;