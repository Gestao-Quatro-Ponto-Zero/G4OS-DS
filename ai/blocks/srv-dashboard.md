# Início do ERP de serviços

- Arquivo: `src/blocks/srv-dashboard.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Serviços
- Preview: showcase `#/frame/srv-dashboard` (`?theme=dark` para o escuro)

Início no estilo Conta Azul: saldo em caixa, a receber e a pagar do mês, receita recorrente dos contratos, OS abertas e atrasadas, fluxo de caixa previsto, OS concluídas por dia e as filas que pedem ação.

## Conceito

**Objetivo:** Mostrar ao dono da empresa de serviços, em um minuto, se o caixa aguenta o mês e o que está travando a operação.

**Padrões aplicados**

- Anatomia B · Painel: cabeçalho fixo, 5 KPIs com base explícita, um gráfico por pergunta
- Fluxo de caixa previsto em barras com entradas e saídas (negativas) por semana; insight do menor saldo
- “Precisa de você” em quatro filas: cobranças vencidas, OS sem técnico, NFS-e rejeitadas, contratos a renovar
- MiniBarChart de OS concluídas por dia; técnicos em campo em StackedList
- Cada linha abre o registro certo (OS, cobrança, nota, contrato)

**Quando usar e o que adaptar**

- Início de qualquer ERP de PME (Omie, Conta Azul, Bling): troque OS por pedidos
- Empresa de limpeza, segurança, dedetização, assistência técnica

**Evite**

- KPI sem base de comparação (“R$ 76 mil” de quê?)
- Fila de ação escondida abaixo dos gráficos

## Componentes usados

`Badge`, `BarChart`, `Button`, `ChartCard`, `KpiCard`, `KpiGrid`, `LineChart`, `ListPanel`, `ListRow`, `MiniBarChart`, `Page`, `PageHeading`, `StackedList`, `formatCompact`, `formatCurrency`, `formatNumber`
