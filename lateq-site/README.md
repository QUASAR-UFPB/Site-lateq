# LATEQ | Laboratório de Tecnologias Quânticas

Site do Laboratório de Tecnologias Quânticas (LATEQ) da UFPB, construído com React, TypeScript e Vite.

## Como rodar

Precisa de Node.js e npm:

```bash
cd lateq-site
npm install
npm run dev
```

O servidor abre em `http://localhost:5173/`.

## Scripts

| Comando | Uso |
| --- | --- |
| `npm run dev` | Sobe o servidor de desenvolvimento do Vite. |
| `npm run build` | Confere os tipos com `tsc -b` e gera o build em `dist/`. |
| `npm run preview` | Serve localmente o conteúdo de `dist/`. |
| `npm run lint` | Roda o `oxlint` no projeto. |
| `npx vitest run` | Executa a suíte em `src/tests/App.test.tsx`. |

## Rotas e variações

A barra inferior e a URL trocam a arte do topo e a tipografia da marca:

- `/`: cena 3D do átomo com quatro órbitas.
- `/qubit`: esfera de Bloch em WebGL (Three.js).
- `/fundo`: apenas o fundo verde, sem cena 3D.
- `?logo=adobe|madimi|audex|corpta`: alterna entre a marca desenhada no Adobe Express (`adobe`, padrão) e as fontes de comparação. Madimi One usa o kit Adobe Fonts `vpr6fng`.

As seções Publicações e Contato ainda usam texto provisório.
