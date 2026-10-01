---
name: ds-migrate
description: Adapta um projeto existente ao G4OS-DS (ou atualiza a versão do DS) em fases verificáveis. Use quando o usuário pedir "adapte/migre/aplique este projeto ao nosso design system", "use o G4OS-DS aqui", "troque o visual deste app pelo DS", "atualize o @g4os/ds para a versão nova". Triggers in English: "migrate this project to the G4OS design system", "apply @g4os/ds to this app", "upgrade @g4os/ds". Para uma única tela nova use ds-create; para só revisar use ds-review.
---

# Migrar um projeto para o G4OS-DS

Trabalho longo: faça em fases, registre o progresso em `MIGRATION.md` na raiz do projeto e não quebre o que funciona. Aplique antes a skill **g4os-ds** (localizar `DS` e ler `DS/ai/core.md`).

## Fase 0 · Portão de pré-requisitos (pare se falhar)

```bash
npx g4os-ds doctor            # ou: node <DS>/scripts/cli.mjs doctor .
```

- React < 19, Tailwind < 4 (ou `@tailwind base`), sem Base UI → **não migre ainda**. Proponha ao usuário um plano de atualização (React 19 / Next 15+, `npx @tailwindcss/upgrade`) e só continue com o de acordo dele.
- MUI/Chakra/Ant/styled-components: convivem durante a migração, mas **não há mapeamento 1:1**; a estratégia é reescrever por página e remover a lib no fim. Avise o custo.
- shadcn/ui: importe `@g4os/ds/shadcn.css` na fase 1 para tudo herdar os tokens já; depois troque por componentes do DS página a página.

## Fase 1 · Instalar e ligar (um PR pequeno)

Siga `DS/docs/guias/instalacao.md`. Resumo:

1. `npm i @base-ui/react lucide-react` e o DS (`npm i ../G4OS-DS`, ou git).
2. CSS global: `@import "tailwindcss"; @import "@g4os/ds/styles.css";` (+ `@g4os/ds/shadcn.css` se houver shadcn). Remova o tema antigo do shadcn (`:root { --background… }`, `.dark {…}`).
3. `<html lang="pt-BR" className="ds-app" data-theme="system">` + `themeScript` no `<head>` + Figtree (`--ds-font-sans`).
4. Next: `transpilePackages: ["@g4os/ds"]`; `setLinkComponent(Link)` num módulo cliente.
5. `doctor` sem ✗, build verde. **Commit.**

## Fase 2 · Inventário

```bash
npx g4os-ds audit src --json --out ds-audit.baseline.json
```

Crie `MIGRATION.md` com o modelo de `references/migration-template.md`: telas (rotas) ordenadas por tráfego/importância, contagem de ocorrências por arquivo (do JSON), dependências de UI a remover, decisões (marca do cliente? tema escuro no lançamento?).

## Fase 3 · Mapear

Use `references/mapping.md`: paleta do Tailwind → tokens, classes shadcn → DS, componentes comuns (Dialog, Select, Table, Tabs, Toast, gráficos) → equivalentes do DS. Para cada tela, escolha o bloco mais próximo em `DS/ai/blocks/` como alvo visual.

## Fase 4 · Migrar por página (repita)

Ordem: **casca** (`AppShell` + `Sidebar` + `PageHeading`) → telas de maior tráfego → cauda longa → remoção das libs antigas.

Para cada página:
1. Leia a página e o bloco-alvo. Preserve dados, rotas, handlers e testes; troque só a apresentação.
2. Substitua componentes pelo mapeamento; aplique os cinco estados (ver **ds-create** §4); textos em pt-BR.
3. `npx g4os-ds audit <arquivos da página>` → 0 erros. `tsc` verde.
4. Se houver dev server: 1440/390 px, claro/escuro.
5. Atualize `MIGRATION.md` (✓ página, ocorrências antes → depois). **Commit por página ou grupo pequeno.**

Não faça "busca e troca" global cega de classes: o mesmo `bg-gray-100` pode ser `bg-soft` (hover) ou `bg-surface` (card). Decida pelo papel.

## Fase 5 · Fechar

- `npx g4os-ds audit src` → 0 erros (avisos justificados com `// ds-audit-ignore <regra>: motivo`).
- Remova dependências de UI antigas, CSS morto, tema antigo.
- Opcional: marca do cliente com **ds-theme**.

**Pronto quando**: doctor ✓, audit 0 erros, tsc/build/testes verdes, todas as rotas do `MIGRATION.md` marcadas, telas principais conferidas nos dois temas.

## Modo atualização (versão nova do DS)

1. Leia `DS/CHANGELOG.md` entre a versão instalada (`node_modules/@g4os/ds/package.json`) e a nova.
2. Aplique `DS/ai/renames.json` (exports e classes renomeados) com busca precisa, arquivo a arquivo.
3. `audit` + `tsc`; registre em `MIGRATION.md` (seção "Atualizações").

Mais detalhes humanos: `DS/docs/guias/migracao.md`.
