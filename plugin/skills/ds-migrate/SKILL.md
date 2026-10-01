---
name: ds-migrate
description: Adapta um projeto existente ao G4OS-DS (ou atualiza a versão do DS) em fases verificáveis. Use quando o usuário pedir "adapte/migre/aplique este projeto ao nosso design system", "use o G4OS-DS aqui", "troque o visual deste app pelo DS", "atualize o @g4ai/ds para a versão nova". Triggers in English: "migrate this project to the G4OS design system", "apply @g4ai/ds to this app", "upgrade @g4ai/ds". Para uma única tela nova use ds-create; para só revisar use ds-review.
---

# Migrar um projeto para o G4OS-DS

Trabalho longo: faça em fases, registre o progresso em `MIGRATION.md` na raiz do projeto e não quebre o que funciona. Aplique antes a skill **g4os-ds** (localizar `DS` e ler `DS/ai/core.md`).

## Fase 0 · Portão de pré-requisitos (pare se falhar)

```bash
npx g4os-ds doctor            # ou: node <DS>/scripts/cli.mjs doctor .
```

- React < 19, Tailwind < 4 (ou `@tailwind base`), sem Base UI → **não migre ainda**. Proponha ao usuário um plano de atualização (React 19 / Next 15+, `npx @tailwindcss/upgrade`) e só continue com o de acordo dele.
- MUI/Chakra/Ant/styled-components: convivem durante a migração, mas **não há mapeamento 1:1**; a estratégia é reescrever por página e remover a lib no fim. Avise o custo.
- shadcn/ui: importe `@g4ai/ds/shadcn.css` na fase 1 para tudo herdar os tokens já; depois troque por componentes do DS página a página.

## Fase 1 · Instalar e ligar (um PR pequeno)

Siga `DS/docs/guias/instalacao.md`. Resumo:

1. `pnpm add @g4ai/ds @base-ui/react lucide-react` (ou `npm i` / `yarn add`, conforme o lockfile do projeto).
2. CSS global: `@import "tailwindcss"; @import "@g4ai/ds/styles.css";` (+ `@g4ai/ds/shadcn.css` se houver shadcn). Remova o tema antigo do shadcn (`:root { --background… }`, `.dark {…}`).
3. `<html lang="pt-BR" className="ds-app" data-theme="system">` + `themeScript` no `<head>` + Figtree (`--ds-font-sans`).
4. Next: `setLinkComponent(Link)` num módulo cliente importado pelo layout. O pacote vem compilado: não adicione `transpilePackages`.
5. `doctor` sem ✗, build verde. **Commit.**

## Fase 2 · Inventário

```bash
npx g4os-ds init --baseline --hook lefthook             # config, scripts ds:*, CI e pre-commit (mostra o que muda; --dry-run antes se quiser)
npx g4os-ds audit --fix                                  # trocas seguras de uma vez (bg-white, text-gray-500, rounded-[12px], imports…)
npx g4os-ds audit --update-baseline                      # congela a dívida restante: CI e pre-commit só falham no que é novo
npx g4os-ds audit --no-baseline --format json --out ds-audit.json   # inventário completo para o MIGRATION.md
```

Em `g4os-ds.config.json`, use `"extends": "migration"` enquanto a dívida for grande (quase tudo vira aviso) e volte a `"recommended"` no fim. Crie `MIGRATION.md` com o modelo de `references/migration-template.md`: telas (rotas) ordenadas por tráfego/importância, contagem de ocorrências por arquivo (do JSON), dependências de UI a remover, decisões (marca do cliente? tema escuro no lançamento?).

## Fase 3 · Mapear

Use `references/mapping.md`: paleta do Tailwind → tokens, classes shadcn → DS, componentes comuns (Dialog, Select, Table, Tabs, Toast, gráficos) → equivalentes do DS. Para cada tela, escolha o bloco mais próximo em `DS/ai/blocks/` como alvo visual.

## Fase 4 · Migrar por página (repita)

Ordem: **casca** (`AppShell` + `Sidebar` + `PageHeading`) → telas de maior tráfego → cauda longa → remoção das libs antigas.

Para cada página:
1. Leia a página e o bloco-alvo. Preserve dados, rotas, handlers e testes; troque só a apresentação.
2. Substitua componentes pelo mapeamento; aplique os cinco estados (ver **ds-create** §4); textos em pt-BR.
3. `npx g4os-ds audit <arquivos da página> --fix --no-baseline` → 0 erros. `tsc` verde. Depois `npx g4os-ds audit --update-baseline` (a dívida só encolhe).
4. Se houver dev server: 1440/390 px, claro/escuro.
5. Atualize `MIGRATION.md` (✓ página, ocorrências antes → depois). **Commit por página ou grupo pequeno.**

Não faça "busca e troca" global cega de classes: o mesmo `bg-gray-100` pode ser `bg-soft` (hover) ou `bg-surface` (card). Decida pelo papel.

## Fase 5 · Fechar

- `npx g4os-ds audit --no-baseline` → 0 erros (avisos justificados com `// g4os-ds-disable-next-line <regra> -- motivo`); apague `.g4os-ds-baseline.json` e a chave `baseline` da config; `extends` de volta a `recommended`.
- Remova dependências de UI antigas, CSS morto, tema antigo.
- Opcional: marca do cliente com **ds-theme**.

**Pronto quando**: doctor ✓, audit 0 erros sem baseline, tsc/build/testes verdes, todas as rotas do `MIGRATION.md` marcadas, telas principais conferidas nos dois temas.

## Modo atualização (versão nova do DS)

1. Veja a versão instalada (`node_modules/@g4ai/ds/package.json`) e a última (`npm view @g4ai/ds version`). Atualize com o gerenciador do projeto: `pnpm up @g4ai/ds` (ou `npm i @g4ai/ds@latest`). Leia `DS/CHANGELOG.md` entre as duas: cada entrada diz o que o app precisa fazer. Em `0.x`, um minor novo pode quebrar.
2. `npx g4os-ds audit --fix`: a regra `deprecated-export` aplica `DS/ai/renames.json` (exports viram `Novo as Antigo`; classes trocadas). O que sobrar, troque à mão, arquivo a arquivo.
3. `audit` + `tsc`; registre em `MIGRATION.md` (seção "Atualizações").

Mais detalhes humanos: `DS/docs/guias/migracao.md`.
