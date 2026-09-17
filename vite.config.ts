import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      'process.env.REACT_APP_CDN': JSON.stringify(env.REACT_APP_CDN || 'https://dprstorage.b-cdn.net'),
      'process.env.REACT_APP_BACKEND_URL': JSON.stringify(env.REACT_APP_BACKEND_URL || ''),
      'process.env.NEXT_PUBLIC_STORAGE_DN_URL': JSON.stringify(
        env.NEXT_PUBLIC_STORAGE_DN_URL || env.REACT_APP_CDN || 'https://dprstorage.b-cdn.net'
      ),
    },
  };
});