# Contratos

- Arquivo: `src/blocks/clm-contracts.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Contratos
- Preview: showcase `#/frame/clm-contracts` (`?theme=dark` para o escuro)

Carteira de contratos em DataGrid: visões salvas (vencendo, renovação automática, aguardando assinatura), filtros por tipo, situação, contraparte e valor, vigência com alerta, total no rodapé, ações em massa e os cinco estados.

## Conceito

**Objetivo:** Achar qualquer contrato da empresa em segundos e enxergar o que vence, o que renova sozinho e o que está parado em alguma etapa.

**Padrões aplicados**

- Anatomia A · Lista com DataGrid: visões salvas acima, filtros e busca na barra da grade, rolagem interna com total no rodapé
- Visões salvas do sistema: Vigentes, Vencendo em 90 dias, Renovação automática, Aguardando assinatura, Meus
- Vigência com palavra (“Vence em 12 dias”); só ≤ 30 dias e vencidos pintam
- Seleção em massa: atribuir responsável e lembrar responsáveis
- Cinco estados: ?estado=carregando|vazio|erro simula; vazio por filtro com Limpar
- Linha abre o contrato (?id=); ?visao= abre a visão certa a partir do painel

**Quando usar e o que adaptar**

- Apólices de seguro, licenças, imóveis, convênios: troque tipos e situações

**Evite**

- Coluna só com a data de fim: mostre também renovação e aviso prévio
- Status editável na linha: a situação do contrato muda por fluxo (aprovação, assinatura), não à mão

## Componentes usados

`Avatar`, `Button`, `DataGrid`, `Empty`, `EmptyFilterResult`, `EntityMark`, `FilterBar`, `FilterField`, `GridColumn`, `Highlight`, `Menu`, `Page`, `PageHeading`, `SavedView`, `SavedViews`, `StatCell`, `StatGrid`, `TableSearch`, `formatCurrency`, `formatDate`, `notify`, `plural`, `useFilters`, `useSavedViews`
