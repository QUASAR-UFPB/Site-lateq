import { existsSync, readFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ isPreview }) => ({
  appType: isPreview ? 'mpa' : 'spa',
  build: {
    assetsDir: '_assets',
    copyPublicDir: false,
    sourcemap: false,
  },
  plugins: [
    react(),
    {
      name: 'lateq-static-preview',
      configurePreviewServer({ config, middlewares }) {
        const dist = resolve(config.root, config.build.outDir)
        const rulesPath = resolve(dist, '_headers')
        if (!existsSync(rulesPath)) return

        const [common, hashed] = readFileSync(rulesPath, 'utf8').split('/_assets/*')
        const headers = common.split('\n').filter((line) => line.startsWith('  '))
          .map((line) => line.trim().split(/: (.*)/).slice(0, 2))
          .filter(([name]) => name !== 'Strict-Transport-Security')
        const immutable = hashed?.match(/Cache-Control: ([^\n]+)/)?.[1]
        const notFound = readFileSync(resolve(dist, '404.html'))
        const pages = ['/index.html', '/qubit/index.html', '/fundo/index.html', '/404.html']
        const respondNotFound = (req: IncomingMessage, res: ServerResponse) => {
          res.statusCode = 404
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.end(req.method === 'HEAD' ? undefined : notFound)
        }

        middlewares.use((req, res, next) => {
          for (const [name, value] of headers) res.setHeader(name, value)
          const pathname = req.url?.split('?')[0]
          if (pathname === '/_headers' || pathname === '/_redirects') {
            return respondNotFound(req, res)
          }
          if (pathname === '/atomo' || pathname === '/atomo/') {
            res.writeHead(301, { Location: '/' }).end()
            return
          }
          if (pathname === '/qubit' || pathname === '/fundo') req.url = `${pathname}/index.html`
          if (pathname && /^\/_assets\/[\w.-]+$/.test(pathname) && immutable && existsSync(resolve(dist, `.${pathname}`))) {
            res.setHeader('Cache-Control', immutable)
          }
          next()
        })

        return () => middlewares.use((req, res, next) => {
          if (pages.includes(req.url ?? '')) return next()
          respondNotFound(req, res)
        })
      },
    },
  ],
  preview: { cors: false },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/test-setup.ts'],
    globals: true,
    css: false,
    testTimeout: 15000,
  },
}))
