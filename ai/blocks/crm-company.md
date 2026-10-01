# Página da empresa

- Arquivo: `src/blocks/crm-company.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: CRM
- Preview: showcase `#/frame/crm-company` (`?theme=dark` para o escuro)

Conta (?id=): indicadores, negócios, contatos e atividades da empresa, propriedades na lateral e novo negócio já vinculado.

## Conceito

**Objetivo:** Ver uma conta inteira (negócios, contatos, atividades) para preparar uma reunião ou decidir o próximo passo.

**Padrões aplicados**

- Anatomia C · Registro: cabeçalho fixo; propriedades fixas à direita (SplitLayout)
- KPIs da conta no topo; abas para negócios, contatos e atividades
- Novo negócio já vinculado à empresa

**Quando usar e o que adaptar**

- Cliente no ERP, conta no SaaS, fornecedor

**Evite**

- Repetir na aba o que já está nas propriedades

## Componentes usados

`ActionMenu`, `Avatar`, `Badge`, `Button`, `Column`, `DataTable`, `EntityMark`, `KpiCard`, `KpiGrid`, `Page`, `PageHeading`, `PropertyList`, `SplitLayout`, `Tabs`, `formatCurrency`, `formatDate`, `notify`
