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
| `npx vitest run` | Executa os testes unitários e de componentes com o Vitest. |

## Rotas e variações

A barra inferior permite combinar a arte do topo, a tipografia da marca e a paleta de cores. A URL registra as escolhas.

- `/`: cena 3D do átomo com quatro órbitas.
- `/qubit`: esfera de Bloch em WebGL (Three.js).
- `/fundo`: fundo da paleta selecionada, sem cena 3D.
- `?logo=adobe|madimi|audex|corpta|bc-civitas`: alterna entre a marca desenhada no Adobe Express (`adobe`, padrão) e as fontes de comparação. Madimi One e BC Civitas Medium usam os kits Adobe Fonts `vpr6fng` e `vxo6zlk`, respectivamente.
- `?paleta=dourado|verde|azul`: seleciona Dourado (padrão), Verde ou Azul.

As seções Publicações e Contato ainda usam texto provisório.
