# Modelo de MIGRATION.md (copie para a raiz do projeto)

```markdown
# Migração para o G4OS-DS

- DS: @g4ai/ds <versão> (<caminho ou git>)
- Início: <data> · Responsável: <pessoa/agente>
- Decisões: marca do cliente <sim/não, data-brand="…">; tema escuro no lançamento <sim/não>; libs a remover: <mui, chakra, shadcn…>

## Pré-requisitos (g4os-ds doctor)
- [ ] React 19  - [ ] Tailwind v4  - [ ] Base UI  - [ ] CSS do DS  - [ ] tema (data-theme + themeScript)  - [ ] fonte  - [ ] setLinkComponent

## Linha de base
- `npx g4os-ds audit src --json --out ds-audit.baseline.json` → <E> erros / <W> avisos em <N> arquivos

## Telas (ordem de migração)
| # | Rota / arquivo | Bloco-alvo | Ocorrências antes | Depois | Estados (5) | 1440/390 · claro/escuro | Status |
| - | --- | --- | --- | --- | --- | --- | --- |
| 1 | casca (layout, sidebar) | AppShell + Sidebar | | | — | | ☐ |
| 2 | /dashboard | saas-dashboard | | | | | ☐ |

## Dependências a remover
- [ ] <lib> (usada em: …)

## Atualizações do DS
| Data | De → para | renames aplicados | Notas |
| --- | --- | --- | --- |

## Pronto quando
doctor ✓ · audit 0 erros · build/tsc/testes verdes · todas as telas ✓ · libs antigas removidas
```
