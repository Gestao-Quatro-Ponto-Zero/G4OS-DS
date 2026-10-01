---
name: ds-create
description: Cria tela, página, fluxo ou app novo com o G4OS-DS partindo do bloco mais próximo. Use quando o usuário pedir "criar/fazer/montar uma tela, página, dashboard, CRUD, app novo com o design system", "tela a partir deste print/Figma", "refazer esta página no DS". Triggers in English: "create a new screen/page/app with the G4OS design system", "build this from a screenshot using @g4os/ds". Não use para adaptar um projeto inteiro (ds-migrate) nem só para revisar (ds-review).
---

# Criar com o G4OS-DS

Pré-requisito: aplique a skill **g4os-ds** (localizar o DS e ler `DS/ai/core.md`). Se o projeto ainda não tem o DS instalado, rode `npx g4os-ds doctor` e resolva os ✗ antes (ver **ds-migrate**, fase 1).

## 1. Entenda a entrada (três modos)

| Modo | O que fazer |
| --- | --- |
| **Descrição** ("tela de vagas com pipeline") | Extraia: entidade(s), ação principal, campos que decidem ações, estados/etapas, quem usa. Se faltar a ação principal ou a entidade, pergunte uma vez. |
| **Print / export do Figma** | Leia a imagem. Mapeie região → padrão do DS (cabeçalho → `PageHeading`, lista → `DataTable`, quadro → `KanbanBoard`, números → `KpiCard`…). **Não copie as cores/fontes do print**: a linguagem é a do DS; preserve estrutura e conteúdo. Liste o que o print tem e o DS não tem. |
| **Página existente** | Leia o arquivo, liste dados, ações e estados que ela já trata; reescreva com componentes do DS mantendo a lógica (fetch, handlers, rotas) intacta. |

## 2. Escolha a anatomia e o ponto de partida

0. **Anatomia primeiro.** Leia `DS/docs/padroes/anatomia-de-pagina.md` e escolha uma das nove (Lista, Painel, Registro, Configurações, Quadro, Mestre-detalhe, App de altura total, Fluxo focado, Público). Ela define o que fica fixo e o que rola: cabeçalho fixo (`PageHeading`), filtros colados em `PageToolbar`, propriedades em `SplitLayout`, uma rolagem por eixo. Diga ao usuário qual anatomia escolheu. Resumo e checklist: `references/anatomias.md`.

1. Procure o bloco mais próximo em `DS/ai/core.md` (seção Blocos) e leia `DS/ai/blocks/<slug>.md`. O `concept` de cada bloco (objetivo, padrões, adaptar, evitar) diz se ele serve para o seu caso. Receitas por tipo de app: `DS/docs/receitas/<crm|ats|erp|financeiro|portal-do-cliente>.md`.
2. Se servir ≥ 60 %: copie `DS/src/blocks/<slug>.tsx` para o projeto, renomeie, troque os dados do topo pelos tipos/fetch reais e remova o que não se aplica.
3. Se não houver bloco: componha. Leia só os `DS/ai/components/<módulo>.md` necessários. Padrões: `DS/docs/padroes/` (layout, formulários, tabelas, filtros, dashboards, superfícies).

Decisões de superfície: entidade = página; criar/editar sem perder a lista = `Drawer`; decisão curta = `Modal`; irreversível = `ConfirmDialog`.

## 3. Construa

- Imports só de `@g4os/ds` (+ `lucide-react`). Nada de cor, raio ou tamanho fora dos tokens.
- Rótulos e textos em pt-BR (`DS/docs/fundamentos/escrita.md`); números/datas com `format*`.
- Controles só quando há o que controlar (busca ≥ 12, filtros ≥ 8).
- Um primário por área; secundárias no `ActionMenu`.

## 4. Cinco estados (obrigatório)

Para cada coleção ou dado assíncrono, entregue:

| Estado | Componente |
| --- | --- |
| Carregando | `Skeleton` com a forma final (ou `LoadingState`) |
| Vazio | `Empty` com a próxima ação ("Criar a primeira vaga") |
| Vazio por filtro | `Empty` + "Limpar filtros" |
| Erro | `ErrorState`/`OperationFeedback` com saída ("Tentar de novo") |
| Parcial/ideal | a tela com dados; operações com `useOperation` + `notify` |

## 5. Verifique

```bash
npx g4os-ds audit <arquivos novos>   # 0 erros
npx tsc --noEmit
```

Se houver dev server: 1440 e 390 px, claro e escuro. No fim, diga ao usuário: bloco de origem, componentes usados, estados cobertos, o que foi verificado e o que ficou pendente (ex.: endpoint real).
