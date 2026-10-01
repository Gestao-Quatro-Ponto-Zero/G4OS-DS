# Starter Next.js com G4OS-DS

App Router + Tailwind v4 + G4OS-DS: casca com sidebar, dashboard e uma lista. Copie a pasta, instale e rode.

```bash
npx degit Gestao-Quatro-Ponto-Zero/G4OS-DS/templates/next-app meu-app   # ou copie a pasta
cd meu-app
pnpm install                 # já traz @g4ai/ds, next, react, tailwindcss
pnpm dev
```

Conferir: `pnpm ds:doctor` (pré-requisitos), `pnpm ds:audit` (o que foge do DS; `pnpm ds:audit:fix` corrige o que é seguro) e `pnpm lint` (as mesmas regras no ESLint e no editor). Para CI e pre-commit: `npx g4os-ds init --hook lefthook` (cria o workflow do GitHub Actions e o hook). Guia: `node_modules/@g4ai/ds/docs/guias/auditoria.md`.

| Arquivo | O que faz |
| --- | --- |
| `app/globals.css` | Tailwind + estilos do DS (os `@source` já vêm dentro) |
| `app/layout.tsx` | `<html lang="pt-BR" className="ds-app">`, Figtree via `next/font`, registra o `Link` |
| `lib/ds.tsx` | `setLinkComponent(Link)` no cliente |
| `app/(app)/layout.tsx` | `AppShell` + `Sidebar` com o caminho atual |
| `app/(app)/page.tsx` | dashboard: `KpiGrid`, `ChartCard`, `AreaChart`, `BarList` |
| `app/(app)/negocios/page.tsx` | lista com `TableToolbar` + `DataTable` + `Empty` |
| `next.config.ts` / `postcss.config.mjs` | config vazia (o DS vem compilado) e plugin do Tailwind |
| `g4os-ds.config.json` | regras do `g4os-ds audit` (preset, pastas, exceções) |
| `eslint.config.mjs` | plugin `@g4ai/ds/eslint`: as mesmas regras no editor |

Próximos passos: copie blocos de `node_modules/@g4ai/ds/src/blocks/` (ou do site, aba Código) para telas completas (pipeline, registro, configurações, login) e siga o `AGENTS.md` do DS.

> Os arquivos deste starter não entram no `npm run typecheck` do DS (o DS não instala `next`). Eles usam só a API pública do pacote.

Com agente de IA: `claude mcp add g4os-ds -- npx -y @g4ai/ds mcp` e cole `node_modules/@g4ai/ds/templates/AGENTS.snippet.md` no `AGENTS.md` do app.
