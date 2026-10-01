---
name: ds-contribute
description: Adiciona ou altera componente, bloco, página do showcase, token ou tema DENTRO do repositório G4OS-DS, seguindo os contratos do pacote. Use quando estiver neste repositório e o pedido for "criar componente/bloco novo no DS", "promover este componente para o DS", "novo token/preset de marca", "documentar no showcase".
---

# Contribuir com o G4OS-DS (neste repositório)

Leia `AGENTS.md` (regras) e `docs/guias/contribuir.md` (contratos). Resumo do que **sempre** fazer:

## Componente
1. Arquivo da família em `src/components/<família>.tsx` (ou novo arquivo + `export * from "./components/<novo>"` em `src/index.ts`). Nome exportado **único** no pacote (`grep -rn "export function <Nome>" src`).
2. Só tokens semânticos (`bg-surface`, `bg-popover`, `text-ink`, `bg-primary text-on-primary`, `text-on-ink`…); nada de `bg-white`/`text-white`/hex. Funciona em `data-theme="dark"` e com outra `data-brand` sem código extra.
3. JSDoc de uma frase acima do componente e das props não óbvias (vira documentação em `ai/`).
4. Acessível (teclado, foco, nomes), responsivo, pt-BR, `prefers-reduced-motion`.
5. Página em `showcase/pages/<slug>.tsx` (contrato em `showcase/kit.tsx`: `meta: PageMeta` + `DocPage`/`DocSection`/`Demo code=…`/`PropsTable`/`Rules`). O `code` do `Demo` vira o exemplo em `ai/components/*.md`.

## Bloco
`src/blocks/<slug>.tsx` com `export const meta = { title, description, category, height, order } as const` + `export default function`. Imports só de `@g4os/ds` e `lucide-react`; dados de exemplo realistas em pt-BR no topo; raiz `h-dvh` com rolagem própria (o iframe usa `html.ds-app`).

## Token ou tema
- Semântico novo/alterado: `src/styles/tokens.css` (claro **e** escuro) + `src/tokens/index.ts` (`color` e `colorDark`).
- Preset de marca: `src/styles/themes.css`, só `--ds-*`, blocos claro e `[data-theme="dark"]`; confira contraste: `node plugin/skills/ds-theme/scripts/contrast.mjs check src/styles/themes.css`.
- Documente em `docs/fundamentos/tokens.md` / `temas-e-dark-mode.md`.

## Mudança que quebra API
Registre em `CHANGELOG.md` e em `ai/renames.json` (`exports` / `classes` da versão nova) para a skill ds-migrate atualizar os apps.

## Pronto quando
```bash
npm run ai:build          # regenera ai/ (o check falha se esquecer)
npm run check             # tokens + tipos + ai/ em dia + auditoria do próprio DS
npm run showcase:build    # e confira a página/bloco em 1440 e 390, claro e escuro (#/frame/<slug>?theme=dark)
```
