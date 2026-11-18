import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/test-setup.ts'],
    globals: true,
    css: false,
    testTimeout: 15000,
  },
})
