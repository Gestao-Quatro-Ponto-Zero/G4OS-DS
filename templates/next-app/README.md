# Starter Next.js com G4OS-DS

App Router + Tailwind v4 + G4OS-DS: casca com sidebar, dashboard e uma lista. Copie a pasta, instale e rode.

```bash
cp -r templates/next-app ../meu-app && cd ../meu-app
npm i next react react-dom @base-ui/react lucide-react ../G4OS-DS
npm i -D typescript @types/react @types/node tailwindcss @tailwindcss/postcss
npx next dev
```

| Arquivo | O que faz |
| --- | --- |
| `app/globals.css` | Tailwind + estilos do DS + `@source` para as classes dos componentes |
| `app/layout.tsx` | `<html lang="pt-BR" className="ds-app">`, Figtree via `next/font`, registra o `Link` |
| `lib/ds.tsx` | `setLinkComponent(Link)` no cliente |
| `app/(app)/layout.tsx` | `AppShell` + `Sidebar` com o caminho atual |
| `app/(app)/page.tsx` | dashboard: `KpiGrid`, `ChartCard`, `AreaChart`, `BarList` |
| `app/(app)/negocios/page.tsx` | lista com `TableToolbar` + `DataTable` + `Empty` |
| `next.config.ts` / `postcss.config.mjs` | `transpilePackages` e plugin do Tailwind |

Próximos passos: copie blocos de `G4OS-DS/src/blocks/` para telas completas (pipeline, registro, configurações, login) e siga o `AGENTS.md` do DS.

> Os arquivos deste starter não entram no `npm run typecheck` do DS (o DS não instala `next`). Eles usam só a API pública do pacote.
