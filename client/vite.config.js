import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Sanitise env vars at config time so Vite inlines clean strings.
// Vercel sometimes stores values with a literal \n (backslash-n) which
// breaks esbuild's string-literal substitution at build time.
const cleanEnv = (val) => (val || '').replace(/\\n/g, '').replace(/\n/g, '').trim();

export default defineConfig({
  plugins: [react()],
  define: {
    // Override the raw env vars with sanitised versions before Vite inlines them.
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
      cleanEnv(process.env.VITE_SUPABASE_URL)
    ),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
      cleanEnv(process.env.VITE_SUPABASE_ANON_KEY)
    ),
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['recharts', 'lucide-react'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
