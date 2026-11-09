import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://wascal.org',
  trailingSlash: 'always',
  build: { format: 'directory' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
