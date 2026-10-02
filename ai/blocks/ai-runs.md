# Execuções de agentes

- Arquivo: `src/blocks/ai-runs.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-runs` (`?theme=dark` para o escuro)

Todas as execuções da frota: agente, status com palavra, gatilho, início, duração, tokens e custo. Filtros por agente, status, gatilho e período, p95 do recorte, CSV e os cinco estados (?estado=carregando|vazio|erro). Linha abre a execução.

## Conceito

**Objetivo:** Achar a execução certa (a que falhou, a que custou caro, a que está esperando alguém) e abrir o passo a passo dela.

**Padrões aplicados**

- Anatomia A · Lista: cabeçalho fixo + PageToolbar colada (visões salvas, filtros, busca)
- Resumo do recorte acima da tabela: total, falhas, p95 e custo mudam com o filtro
- Status = ponto + palavra; falha pinta a linha; número à direita com tabular-nums
- Vindo de outra tela, o filtro chega pela URL (?agente=, ?status=)

**Quando usar e o que adaptar**

- Jobs de integração, sincronizações, rotinas agendadas de ERP
- Fora de IA troque tokens por registros processados

**Evite**

- Log em texto corrido sem status por execução
- Custo sem unidade ou sem total do recorte

## Componentes usados

`Button`, `Column`, `DataTable`, `Empty`, `EmptyFilterResult`, `FilterBar`, `FilterField`, `GridColumn`, `Highlight`, `Page`, `PageHeading`, `PageToolbar`, `Pagination`, `SavedView`, `SavedViews`, `SortHeader`, `StatCell`, `StatGrid`, `TableSearch`, `downloadCsv`, `formatCurrency`, `formatDuration`, `formatNumber`, `gridToCsv`, `notify`, `useFilters`, `usePagination`, `useSavedViews`, `useSort`
