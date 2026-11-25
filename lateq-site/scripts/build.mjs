import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { isIP } from 'node:net'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const root = fileURLToPath(new URL('../', import.meta.url))
const dist = join(root, 'dist')
const pages = ['', 'qubit', 'fundo']
const assets = [
  'assets/brasao-ufpb.png',
  'assets/ciquanta-empresas-pb.webp',
  'assets/computador-quantico-pb.jpg',
  'assets/lateq-adobe-bold.png',
  'assets/logo-ci.png',
  'assets/logo-quasar.png',
  'assets/membros/grupo.jpg',
  'assets/membros/seminario.jpg',
  'fonts/audex.woff',
  'fonts/audex-OFL.txt',
  'fonts/corpta.woff',
  'fonts/corpta-LEIA-ME.txt',
]

function publicUrl() {
  const value = process.env.SITE_URL?.trim()
  if (!value) return null

  const url = URL.parse(value)
  if (!url || url.protocol !== 'https:' || url.username || url.password || url.port
    || url.pathname !== '/' || url.search || url.hash || !url.hostname.includes('.')
    || isIP(url.hostname) || /\.(?:local|localhost)\.?$/.test(url.hostname)) {
    throw new Error('SITE_URL deve conter a origem HTTPS do domínio público, sem porta, caminho ou parâmetros.')
  }
  return url
}

const canonical = publicUrl()
const shareImage = canonical && new URL('/assets/brasao-ufpb.png', canonical)
const organization = {
  '@type': 'Organization',
  name: 'Laboratório de Tecnologias Quânticas',
  alternateName: 'LATEQ',
  parentOrganization: {
    '@type': 'CollegeOrUniversity',
    name: 'Universidade Federal da Paraíba',
    url: 'https://www.ufpb.br/',
  },
  ...(canonical && { url: canonical.href, logo: new URL('/assets/lateq-adobe-bold.png', canonical).href }),
}
const structuredData = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    organization,
    {
      '@type': 'WebSite',
      name: 'LATEQ | Laboratório de Tecnologias Quânticas',
      inLanguage: 'pt-BR',
      ...(canonical && { url: canonical.href }),
    },
  ],
}).replaceAll('<', '\\u003c')

const csp = [
  "default-src 'none'",
  "base-uri 'none'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'none'",
  "connect-src 'self'",
  "script-src 'self'",
  "style-src 'self' https://use.typekit.net/vpr6fng.css https://use.typekit.net/vxo6zlk.css https://p.typekit.net/p.css",
  // ScrollTrigger can reset the body style by setting an empty style attribute.
  "style-src-attr 'unsafe-hashes' 'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='",
  "font-src 'self' data: https://use.typekit.net",
  "img-src 'self' data: https://p.typekit.net",
].join('; ')

const headers = `/*
  Content-Security-Policy: ${csp}
  Strict-Transport-Security: max-age=31536000
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: no-referrer
  Permissions-Policy: camera=(), geolocation=(), microphone=(), payment=(), usb=()
  Cross-Origin-Resource-Policy: same-origin
/_assets/*
  Cache-Control: public, max-age=31536000, immutable
`

await build({ root })
const template = await readFile(join(dist, 'index.html'), 'utf8')
const metadataSlot = '<!-- production-metadata -->'
if (!template.includes(metadataSlot)) {
  throw new Error('O HTML de entrada precisa do ponto de inserção para metadados.')
}
const metadata = [
  ...(canonical ? [
    `<link rel="canonical" href="${canonical.href}" />`,
    `<meta property="og:url" content="${canonical.href}" />`,
    `<meta property="og:image" content="${shareImage.href}" />`,
    '<meta property="og:image:alt" content="Brasão da Universidade Federal da Paraíba" />',
    `<meta name="twitter:image" content="${shareImage.href}" />`,
  ] : []),
  `<script type="application/ld+json">${structuredData}</script>`,
].join('\n    ')
const pageHtml = template.replace(metadataSlot, () => metadata)

for (const page of pages) {
  const target = join(dist, page, 'index.html')
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, pageHtml)
}

for (const asset of assets) {
  const target = join(dist, asset)
  await mkdir(dirname(target), { recursive: true })
  await copyFile(join(root, 'public', asset), target)
}
await copyFile(join(root, 'node_modules/@fontsource/plus-jakarta-sans/LICENSE'), join(dist, 'fonts/plus-jakarta-sans-OFL.txt'))

await writeFile(join(dist, '404.html'), template.replace(metadataSlot, '<meta name="robots" content="noindex" />'))
await writeFile(join(dist, '_headers'), headers)
await writeFile(join(dist, '_redirects'), '/atomo / 301\n/atomo/ / 301\n')
const sitemapUrl = canonical && new URL('/sitemap.xml', canonical)
await writeFile(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n${sitemapUrl ? `Sitemap: ${sitemapUrl.href}\n` : ''}`)
if (canonical) {
  await writeFile(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${canonical.href}</loc></url>
</urlset>
`)
}
