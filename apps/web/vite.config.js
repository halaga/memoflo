import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    // Needed so tenant subdomains such as xplicit-technologies.localhost
    // reach the same local Vite development server.
    host: true,
  },
})
