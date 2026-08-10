import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/tools/oni-planet-resources/',
  build: {
    outDir: 'dist/tools/oni-planet-resources',
  },
  plugins: [react()],
})
