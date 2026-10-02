# Página da conta

- Arquivo: `src/blocks/saas-customer.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: SaaS
- Preview: showcase `#/frame/saas-customer` (`?theme=dark` para o escuro)

Conta de cliente (?id=): saúde, uso diário, adoção por recurso, faturas, chamados, ajuste de plano com prévia de MRR e cancelamento com confirmação.

## Conceito

**Objetivo:** Decidir o que fazer com uma conta: saúde, uso, cobrança e suporte em um lugar.

**Padrões aplicados**

- Anatomia C · Registro: KPIs da conta no topo; propriedades fixas à direita
- Saúde e adoção por recurso
- Ajuste de plano com prévia de MRR; cancelamento com confirmação

**Quando usar e o que adaptar**

- Empresa (CRM), cliente B2B (ERP)

**Evite**

- Cancelar sem mostrar o impacto

## Componentes usados

`ActionMenu`, `AreaChart`, `Badge`, `Banner`, `Button`, `ChartCard`, `Column`, `ConfirmDialog`, `DataTable`, `Drawer`, `EntityMark`, `FieldBlock`, `KpiCard`, `KpiGrid`, `Modal`, `NumberField`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PropertyList`, `RadialBars`, `Select`, `SplitLayout`, `Tabs`, `TextareaField`, `formatCurrency`, `formatDate`, `formatNumber`, `notify`, `useOperation`
