import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ['three'],
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'vendor-three', test: /node_modules[\\/]three[\\/]/ },
            { name: 'vendor-r3f', test: /node_modules[\\/](@react-three[\\/]|postprocessing[\\/])/ },
            { name: 'vendor-animation', test: /node_modules[\\/](motion|motion-dom|motion-utils|framer-motion|gsap|@gsap[\\/]react)[\\/]/ },
          ],
        },
      },
    },
  },
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'] },
})
