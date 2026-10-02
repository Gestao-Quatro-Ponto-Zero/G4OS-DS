# Contas bancárias

- Arquivo: `src/blocks/fin-bank-accounts.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Financeiro
- Preview: showcase `#/frame/fin-bank-accounts` (`?theme=dark` para o escuro)

Saldo por conta com limite disponível, barrinhas de entradas e saídas dos últimos 7 dias úteis, última conciliação e pendências que levam à conciliação, extrato recente da conta escolhida e transferência entre contas.

## Conceito

**Objetivo:** Saber quanto há em cada banco agora, o que entrou e saiu e se a conta está conciliada.

**Padrões aplicados**

- Anatomia B · Painel: KPIs consolidados no topo e um cartão por conta
- MiniBarChart de entradas e saídas por conta (toque mostra o dia)
- Última conciliação com palavra e atalho para conciliar as pendências
- Extrato recente da conta escolhida (?id=) com situação de conciliação

**Quando usar e o que adaptar**

- Carteiras de meios de pagamento, cartões corporativos, caixas de loja

**Evite**

- Saldo sem a data da última conciliação
- Cor sozinha para entrada e saída

## Componentes usados

`Badge`, `Button`, `Column`, `CurrencyField`, `DataTable`, `Empty`, `KpiCard`, `KpiGrid`, `MiniBarChart`, `Modal`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `Select`, `Skeleton`, `TextField`, `formatCurrency`, `formatRelative`, `notify`, `useOperation`
