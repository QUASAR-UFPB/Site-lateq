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

A barra inferior permite alternar o fundo da abertura e a tipografia da marca. Em Fundo3, também é possível escolher a arte da abertura. A URL registra as escolhas.

- `/` ou `?fundo=introducao`: versão padrão Fundo1, com a esfera de Bloch interativa e atalhos para Sobre e Recursos.
- `?fundo=atual`: versão Fundo2 com o degradê animado.
- `/?fundo=antigo`, `/qubit?fundo=antigo` e `/fundo?fundo=antigo`: versão Fundo3 com as opções Átomo, Com qubit e Só fundo.
- `?logo=adobe|madimi|audex|corpta|bc-civitas`: alterna entre a marca desenhada no Adobe Express (`adobe`, padrão) e as fontes de comparação. Madimi One e BC Civitas Medium usam os kits Adobe Fonts `vpr6fng` e `vxo6zlk`, respectivamente.

As seções Publicações e Contato ainda usam texto provisório.
