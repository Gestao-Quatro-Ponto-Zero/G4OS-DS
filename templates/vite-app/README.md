# Starter Vite + React + G4OS-DS

```bash
cp -r node_modules/@g4ai/ds/templates/vite-app meu-app   # ou copie do repositório
cd meu-app && pnpm install && pnpm dev
pnpm ds:doctor   # pré-requisitos
pnpm ds:audit    # regras do DS (o mesmo que `pnpm lint` via ESLint)
```

- `index.html`: `<html lang="pt-BR" class="ds-app" data-theme="system">` + Figtree.
- `vite.config.ts`: Tailwind v4 + `themeScript` antes da primeira pintura.
- `src/router.tsx`: roteador mínimo e `setLinkComponent` (troque por React Router quando crescer).
- `src/pages/`: uma tela por arquivo, sempre `Page` + `PageHeading` (ver `node_modules/@g4ai/ds/ai/core.md`).

Agentes de IA: cole `node_modules/@g4ai/ds/templates/AGENTS.snippet.md` no `AGENTS.md` do projeto.
