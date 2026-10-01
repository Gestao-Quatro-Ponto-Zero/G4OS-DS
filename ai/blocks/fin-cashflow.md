# Fluxo de caixa

- Arquivo: `src/blocks/fin-cashflow.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Financeiro
- Preview: showcase `#/frame/fin-cashflow` (`?theme=dark` para o escuro)

Entradas e saídas por semana (saídas negativas), saldo projetado contra o mínimo de segurança, ponte do mês em cascata, próximos pagamentos e saldo por conta.

## Conceito

**Objetivo:** Responder se vai faltar caixa nas próximas semanas e o que vence antes.

**Padrões aplicados**

- Anatomia B · Painel: cabeçalho fixo
- Entradas/saídas por semana (saídas negativas) e saldo projetado × mínimo
- Ponte do mês em cascata; próximos pagamentos

**Quando usar e o que adaptar**

- Projeção de capacidade, consumo de licenças

**Evite**

- Saldo projetado sem o mínimo de segurança

## Componentes usados

`Badge`, `BarChart`, `Button`, `ChartCard`, `Column`, `CurrencyField`, `DataTable`, `DatePicker`, `FieldBlock`, `KpiCard`, `KpiGrid`, `LineChart`, `Modal`, `Page`, `PageHeading`, `ProportionBar`, `SegmentedControl`, `TextField`, `WaterfallChart`, `formatCurrency`, `notify`
