---
"@g4ai/ds": patch
---

`styles.css` deixa de ler `src/blocks` com `@source`. Os blocos são exemplos para copiar, e a cópia no app é lida pelo Tailwind do próprio app. Medido nos Galts: o CSS inicial cai 19,5 KB (2,3 KiB gzip) sem mudar nenhuma tela. Se o seu app aponta `@source` para `node_modules/@g4ai/ds/src` inteiro, exclua os blocos com `@source not ".../@g4ai/ds/src/blocks"`.
