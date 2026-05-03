async function customFetcher(url: string, options: RequestInit) {
  const token = localStorage.getItem('auth.token');
  if (token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    }
  }

  return fetch(url, options);
}
