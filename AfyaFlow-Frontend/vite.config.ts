import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // Backend endpoints (Spring Boot runs on 8080)
      '/auth': {
        target: 'http://localhost:8080',
        rewrite: (path) => path.replace(/^\/auth/, '/api/auth')
      },
      '/patients': {
        target: 'http://localhost:8080',
        rewrite: (path) => path.replace(/^\/patients/, '/api/patients')
      },
      '/doctors': {
        target: 'http://localhost:8080',
        rewrite: (path) => path.replace(/^\/doctors/, '/api/doctors')
      },
      '/departments': {
        target: 'http://localhost:8080',
        rewrite: (path) => path.replace(/^\/departments/, '/api/departments')
      },
      '/appointments': {
        target: 'http://localhost:8080',
        rewrite: (path) => path.replace(/^\/appointments/, '/api/appointments')
      },
      '/queue': {
        target: 'http://localhost:8080',
        rewrite: (path) => path.replace(/^\/queue/, '/api/queue')
      },
      '/admin': {
        target: 'http://localhost:8080',
        rewrite: (path) => path.replace(/^\/admin/, '/api/admin')
      },
      '/logs': {
        target: 'http://localhost:8080',
        rewrite: (path) => path.replace(/^\/logs/, '/api/logs')
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
