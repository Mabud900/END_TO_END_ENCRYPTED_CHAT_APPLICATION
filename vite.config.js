import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Replace the host(s) below with the host shown in your error if needed
export default defineConfig({
  plugins: [react()],
  server: {
    // listen on all interfaces so remote host can reach it
    host: true,
    port: 3000,
    // allow the bytexl host(s) that will open this dev server in the browser
    // add any other hosts you see in errors (or use 'all' to allow all hosts)
    allowedHosts: ['owrkcwtpvophrnvk-3000.bytexl.net', 'localhost'],
    // proxy API calls to your backend (adjust target port if backend runs on another port)
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
