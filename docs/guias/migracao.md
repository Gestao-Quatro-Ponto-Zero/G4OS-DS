# Migrar um projeto existente para o G4OS-DS

Roteiro humano do que a skill `ds-migrate` faz. Vale para migrar à mão ou revisar o trabalho de um agente.

## 0. Pode migrar?

```bash
npx g4os-ds doctor
```

| Situação | Caminho |
| --- | --- |
| React 18.2+ ou 19 + Tailwind v4 | migre direto (Next 14 e 15+ funcionam; ver [React 18](instalacao.md#react-18)) |
| React 17 ou 18.0–18.1 | atualize para 18.3 ou 19 antes, num PR separado |
| Tailwind v3 (`tailwind.config.js`, `@tailwind base`) | `npx @tailwindcss/upgrade` antes |
| shadcn/ui | importe `@g4ai/ds/shadcn.css` já na fase 1 (tudo herda os tokens); troque por componentes do DS por página |
| MUI, Chakra, Ant, styled-components | convivem; **reescreva por página** (não há mapeamento 1:1) e remova a lib no fim |

## 1. Ligar o DS (um PR)

```bash
pnpm add @g4ai/ds @base-ui/react lucide-react
```

[Instalação](instalacao.md): `@import "@g4ai/ds/styles.css"`, `<html lang="pt-BR" className="ds-app" data-theme="system">` + `themeScript`, fonte, `setLinkComponent`. `doctor` sem ✗ e build verde.

## 2. Linha de base e plano

```bash
npx g4os-ds init --baseline --hook lefthook   # config (preset migration abaixo), scripts, CI e pre-commit
npx g4os-ds audit --fix                        # trocas seguras de uma vez (bg-white, text-gray-500, rounded-[12px]…)
npx g4os-ds audit --update-baseline            # congela o que sobrou: daqui em diante só achado novo falha
npx g4os-ds audit --no-baseline --format json --out ds-audit.json   # dívida total, para acompanhar
```

Em `g4os-ds.config.json`, comece com `"extends": "migration"` (quase tudo vira aviso) e volte para `"recommended"` quando a baseline estiver perto de zero. Detalhes em [auditoria](auditoria.md#projeto-legado-baseline). A cada tela migrada, `--update-baseline` encolhe a dívida; o CI garante que ela nunca cresce.

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
- `npx g4os-ds audit <arquivos> --fix` e depois → 0 erros sem baseline (`--no-baseline`); typecheck verde; 1440/390 px, claro/escuro.

## 5. Pronto

`doctor` ✓ · `audit --no-baseline` com 0 erros (e a baseline apagada) · build/testes verdes · todas as telas do `MIGRATION.md` marcadas · libs antigas removidas.

## Atualizar de versão

```bash
npm view @g4ai/ds version            # última publicada
pnpm up @g4ai/ds                     # ou: npm i @g4ai/ds@latest
npx g4os-ds audit --fix              # troca nomes renomeados e o que for seguro; aponta regras novas
```

1. Leia o [CHANGELOG](../../CHANGELOG.md) entre a sua versão e a nova. Cada entrada diz o que o app precisa fazer.
2. Aplique as renomeações de `node_modules/@g4ai/ds/ai/renames.json` (exports e classes).
3. `audit` com 0 erros + typecheck + build. Confira as telas principais em claro e escuro.

Com agente: *"Atualize o @g4ai/ds e ajuste o código"* (skill `ds-migrate`, modo atualização), que faz os três passos. Enquanto o DS estiver em `0.x`, mudança que quebra sobe o **minor** (0.2 → 0.3): leia o changelog antes de subir um minor.
