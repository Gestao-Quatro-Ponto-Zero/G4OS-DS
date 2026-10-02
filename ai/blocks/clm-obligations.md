# Obrigações e prazos

- Arquivo: `src/blocks/clm-obligations.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Contratos
- Preview: showcase `#/frame/clm-obligations` (`?theme=dark` para o escuro)

Tudo o que os contratos exigem com data: pagamentos, entregas, reajustes (IGP-M/IPCA), avisos prévios de não renovação e garantias. Lista agrupada por urgência ou calendário do mês, filtros, marcar como cumprida e as renovações em andamento com marcos.

## Conceito

**Objetivo:** Não perder prazo de contrato: cobrar a contraparte, pagar em dia e decidir renovações antes do aviso prévio.

**Padrões aplicados**

- Anatomia A · Lista: cabeçalho fixo + PageToolbar colada (situação, filtros, busca); lista agrupada por urgência ou calendário do mês
- Atrasadas primeiro, com dias de atraso em palavra; prazo em DateBadge
- Checkbox marca como cumprida com Desfazer
- Renovações em andamento como ProjectProgressCard (marcos, responsável, prazo)
- Nova obrigação em Drawer, com operação e aviso ao terminar
- Cinco estados: ?estado=carregando|vazio|erro; ?filtro=atrasadas vem do painel

**Quando usar e o que adaptar**

- Compliance regulatório (licenças, alvarás), manutenção preventiva, vencimento de certificados

**Evite**

- Lista plana por data sem separar o que já atrasou
- Aviso prévio tratado como data qualquer: é o prazo que mais custa perder

## Componentes usados

`AgendaEvent`, `Avatar`, `Badge`, `Button`, `Checkbox`, `Combobox`, `CurrencyField`, `DateBadge`, `DatePicker`, `Drawer`, `Empty`, `EmptyFilterResult`, `FilterBar`, `FilterField`, `Highlight`, `MonthCalendar`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PageToolbar`, `ProjectProgressCard`, `SegmentedControl`, `Select`, `StatCell`, `StatGrid`, `TableSearch`, `TextField`, `formatCurrency`, `notify`, `plural`, `useFilters`, `useOperation`
