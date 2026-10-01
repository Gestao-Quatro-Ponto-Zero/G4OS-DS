# Anatomias de página (resumo para a skill)

Fonte completa: `DS/docs/padroes/anatomia-de-pagina.md`. Escolha UMA antes de montar a tela e declare no `concept.patterns` do bloco.

| | Anatomia | Fixo | Rola | Comece por |
| --- | --- | --- | --- | --- |
| A | Lista | `PageHeading` + `PageToolbar` (visões, filtros, busca) colada | página (tabela) ou grade (`DataGrid maxHeight`) | saas-customers, crm-contacts |
| B | Painel | cabeçalho com período | página | saas-dashboard, erp-dashboard |
| C | Registro | trilha + título + ações; propriedades (`SplitLayout`) | conteúdo principal | crm-deal, saas-customer |
| D | Configurações | título + subnavegação (`SettingsLayout`) | conteúdo da seção | settings-profile |
| E | Quadro | cabeçalho; página não rola no desktop | quadro (horizontal) e colunas (vertical) | crm-pipeline |
| F | Mestre-detalhe | cabeçalho; seleção em `?id=` | lista e detalhe, cada um | erp-purchase-requests, saas-support |
| G | App de altura total | casca, cabeçalho da área, composer | só a thread/lista/canvas | ai-chat, ai-agent-builder |
| H | Fluxo focado | rodapé de passos | documento | auth-login, onboarding-wizard |
| I | Público | cabeçalho do site | documento | marketing-landing |

Checklist rápido:
- [ ] `PageHeading` direto dentro de `<Page>` (sem invólucro; se precisar de classe, `contents`).
- [ ] Filtros de lista longa dentro de `<PageToolbar>`.
- [ ] Coluna de propriedades via `SplitLayout` (gruda no desktop).
- [ ] Uma rolagem por eixo; no celular, a página.
- [ ] Uma ação primária por área, à direita do título.
- [ ] Barras de ação (`BulkBar`, alterações não salvas) no rodapé da área.
