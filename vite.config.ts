import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Ensure we always pass a string, even if the env var is missing
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      // Polyfill process.env to prevent crashes
      'process.env': {}
    }
  };
});