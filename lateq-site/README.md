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
| `npm run build` | Confere os tipos e prepara o pacote de publicação em `dist/`. |
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

## Publicação e indexação

1. Configure `lateq-site` como diretório de trabalho, rode `npm ci` seguido de `npm run build` e publique somente `lateq-site/dist`. Configure `SITE_URL` no ambiente do build com a origem HTTPS do domínio principal, sem caminho. Esse valor gera a URL canônica, as URLs de compartilhamento e o sitemap. A página inicial é a URL canônica das variações do site.
2. O build gera `_headers` e `_redirects` para hospedagem estática no Cloudflare Pages ou Netlify. Em um provedor diferente, aplique as regras equivalentes no painel ou servidor. Sirva `qubit/index.html` e `fundo/index.html` em suas rotas, faça o redirecionamento permanente de `/atomo` para `/` e sirva `404.html` com status HTTP 404 para endereços desconhecidos. Mantenha a listagem de diretórios desativada. A regra de cache imutável é restrita aos recursos em `/_assets/`. [Cloudflare Pages](https://developers.cloudflare.com/pages/configuration/headers/) · [Netlify](https://docs.netlify.com/manage/routing/headers/)
3. Configure o domínio e o certificado no provedor. Redirecione HTTP para HTTPS e as variantes de domínio para a origem principal, preservando caminho e parâmetros. Confira o certificado e os cabeçalhos na resposta pública. O HSTS do build abrange o host atual.
4. Confirme as licenças da fonte Corpta e dos kits Adobe Fonts para a publicação institucional. O aviso da Corpta descreve o arquivo como uma demonstração para uso pessoal. A página solicita os kits da Adobe, que recebe requisições de fontes e de contabilização de uso. Avalie também os registros e recursos de privacidade habilitados no provedor escolhido. [Aviso da Corpta](public/fonts/corpta-LEIA-ME.txt) · [Licenciamento Adobe Fonts](https://helpx.adobe.com/fonts/web/font-licensing/webfont-licensing.html) · [Requisições Adobe Fonts](https://helpx.adobe.com/fonts/web/web-design-and-development/content-security-policy.html)
5. No Google Search Console, adicione uma propriedade do tipo Domínio, verifique-a com o registro DNS fornecido pelo Google, envie `/sitemap.xml` e teste a página inicial na Inspeção de URL. Confira se a resposta é 200, se a canônica aponta para o domínio principal, se `robots.txt` permite o rastreamento e se o Google renderiza as seções carregadas pelo JavaScript. [Verificação de domínio](https://support.google.com/webmasters/answer/9008080) · [Sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) · [Inspeção de URL](https://support.google.com/webmasters/answer/9012289)
