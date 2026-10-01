# Migrar um projeto existente para o G4OS-DS

Roteiro humano do que a skill `ds-migrate` faz. Vale para migrar à mão ou revisar o trabalho de um agente.

## 0. Pode migrar?

```bash
npx g4os-ds doctor
```

| Situação | Caminho |
| --- | --- |
| React 19 + Tailwind v4 | migre direto |
| React 18 / Next 14 | atualize antes (React 19, Next 15+) num PR separado |
| Tailwind v3 (`tailwind.config.js`, `@tailwind base`) | `npx @tailwindcss/upgrade` antes |
| shadcn/ui | importe `@g4ai/ds/shadcn.css` já na fase 1 (tudo herda os tokens); troque por componentes do DS por página |
| MUI, Chakra, Ant, styled-components | convivem; **reescreva por página** (não há mapeamento 1:1) e remova a lib no fim |

## 1. Ligar o DS (um PR)

[Instalação](instalacao.md): pacote, `@import "@g4ai/ds/styles.css"`, `<html lang="pt-BR" className="ds-app" data-theme="system">` + `themeScript`, fonte, `transpilePackages`, `setLinkComponent`. `doctor` sem ✗ e build verde.

## 2. Linha de base e plano

```bash
npx g4os-ds audit src --json --out ds-audit.baseline.json
```

Liste as telas por importância (tráfego, dinheiro, frequência) e, para cada uma, o bloco do DS mais parecido (`ai/blocks/`). Registre em `MIGRATION.md` (modelo em `plugin/skills/ds-migrate/references/migration-template.md`).

## 3. Ordem

1. **Casca**: `AppShell` + `Sidebar` + `PageHeading`. Muda a percepção do app inteiro com pouco risco.
2. **Telas principais**, uma por vez (PR por tela ou grupo pequeno).
3. **Cauda longa** e formulários raros.
4. **Remoção**: libs de UI antigas, CSS morto, tema antigo.

## 4. Em cada tela

- Preserve dados, rotas, validação e testes; troque só a apresentação.
- Decida cada cor pelo **papel** ([mapeamentos](../../plugin/skills/ds-migrate/references/mapping.md)): o mesmo `bg-gray-100` pode ser `bg-soft` (hover) ou `bg-surface` (card). Nada de trocar em massa sem olhar.
- Cinco estados, textos em pt-BR, números por `format*`.
- `npx g4os-ds audit <arquivos>` → 0 erros; typecheck verde; 1440/390 px, claro/escuro.

## 5. Pronto

`doctor` ✓ · `audit src` com 0 erros · build/testes verdes · todas as telas do `MIGRATION.md` marcadas · libs antigas removidas.

## Atualizar a versão do DS

1. Leia o `CHANGELOG.md` entre as versões.
2. Aplique `ai/renames.json` (exports e classes renomeados).
3. `audit` + typecheck. Registre no `MIGRATION.md`.
