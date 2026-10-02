# Cobranças (boleto e Pix)

- Arquivo: `src/blocks/srv-billing.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Serviços
- Preview: showcase `#/frame/srv-billing` (`?theme=dark` para o escuro)

Boletos e Pix gerados por mensalidades e OS: a vencer, vencidos e pagos, com régua de cobrança automática (D-3, D0, D+1, D+7, D+15), envio de 2ª via em lote, registro de pagamento e conciliação simples do extrato. Cobrança abre em gaveta (?id=).

## Conceito

**Objetivo:** Receber no prazo sem cobrar na mão: a régua faz os lembretes, a pessoa só age nas exceções (vencidas, acordo, extrato sem dono).

**Padrões aplicados**

- Anatomia A · Lista: cabeçalho fixo + PageToolbar colada (abas, filtros, busca)
- Vencida em palavra com dias de atraso; seleção em massa com BulkBar para “Enviar 2ª via”
- Cobrança em Drawer (?id=): Pix copia e cola, linha digitável e a régua em Timeline (enviado, próximo, pendente)
- Régua de cobrança configurável por passo (Switch); D+15 vira tarefa, nunca suspensão automática
- Conciliação simples: crédito do extrato com a cobrança provável; confirmar baixa o título
- Cinco estados: ?estado=carregando|vazio|erro simula; vazio por filtro com Limpar

**Quando usar e o que adaptar**

- Contas a receber de escola, condomínio, academia; cobrança de assinatura

**Evite**

- Lembrete agressivo antes do vencimento
- Baixa manual sem registrar data e valor recebido

## Componentes usados

`Badge`, `BulkBar`, `Button`, `Callout`, `Column`, `CurrencyField`, `DataTable`, `DatePicker`, `Drawer`, `Empty`, `EmptyFilterResult`, `FilterBar`, `FilterField`, `Highlight`, `Modal`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PageToolbar`, `PropertyList`, `Select`, `StatCell`, `StatGrid`, `Switch`, `TableSearch`, `Tabs`, `Timeline`, `TimelineItem`, `formatCurrency`, `formatDate`, `notify`, `selectionColumn`, `useFilters`, `useOperation`, `useSelection`
