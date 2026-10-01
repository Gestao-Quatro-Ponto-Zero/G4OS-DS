# Densidade e controles progressivos

## Controle só quando há o que controlar

Cada controle custa atenção e altura. Abaixo de um volume, a lista é só a lista.

| Controle | Aparece a partir de | Constante |
| --- | --- | --- |
| Busca na toolbar | 12 itens | `collectionThresholds.search` |
| Filtro por atributo (`FacetFilter`) | 8 itens | `collectionThresholds.facets` |
| Alternador Lista \| Cards \| Quadro | 8 itens | `collectionThresholds.viewSwitch` |
| Busca dentro do filtro | 8 opções | interno do `FacetFilter` |
| Paginação | 50 itens (cliente) ou sempre (servidor) | — |
| Indicadores no topo de uma lista | só em páginas globais | — |

`TableToolbar` já esconde a busca abaixo do limiar.

## Densidade confortável × compacta

- `data-density="compact"` (em `Page`, `DataTable` ou qualquer contêiner) reduz o respiro de linhas, cards e kanban. `DensityControl` alterna; `useCollectionDisplay(scope)` guarda a escolha no navegador por área.
- **Compacto reduz espaço, não informação essencial.** Título, responsável e prazo continuam. O que pode sumir: descrição, objetivo, prévia.
- Não comprima: formulários, áreas de edição, células de calendário e textos longos.

Medidas de referência (1440 px): linha de tabela 12 px de respiro vertical no confortável; card de kanban ~100 px; card de tarefa em lista ~68 px.

## Cards × tabela

- **Tabela** para comparar registros por atributos (valor, data, dono, status). Padrão para listas de trabalho.
- **Cards** quando cada item tem identidade visual ou prévia (projeto com capa, template, vaga com resumo) ou há poucos itens.
- **Quadro (kanban)** quando a pergunta é "em que etapa está?" e as pessoas movem itens entre etapas.
- A mesma coleção pode alternar entre as três, **mantendo filtros e seleção**.

## Molduras

- `ListPanel` (moldura gelo com lista branca) é **prévia** de uma coleção dentro de uma página com vários assuntos (home, visão geral). Título uma vez, contagem = total disponível, "Ver todos" leva à lista completa.
- Página dedicada a uma coleção **não usa moldura extra**: toolbar + tabela, sem card em volta, sem repetir o título da página.
- Estado vazio dentro de moldura usa `Empty framed={false}` (sem borda tracejada encaixada).
- Nunca card dentro de card dentro de card.

## Números no topo

- Dashboard: 3–5 KPIs.
- Lista global: no máximo uma linha de indicadores (`StatGrid`) quando eles mudam a decisão (ex.: total vencido em Contas a receber). Nunca repita contagens que a toolbar já mostra ("12 resultados").
