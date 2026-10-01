# Receita: Financeiro

Contas a pagar e a receber, fluxo de caixa, conciliação bancária, faturamento recorrente.

## Entidades

| Entidade | Identidade | Campos que decidem | Relações |
| --- | --- | --- | --- |
| **Lançamento** (a pagar / a receber) | descrição + contraparte | valor, vencimento, status (aberto, pago, vencido, cancelado), categoria, centro de custo | conta bancária, documento |
| **Conta bancária** | banco + apelido | saldo, última conciliação | lançamentos, extrato |
| **Categoria / centro de custo** | nome | tipo (receita/despesa), orçamento | lançamentos |
| **Fatura / assinatura** | cliente + período | valor, status, forma de pagamento | cliente, lançamentos |

## Mapa de navegação

```
Sidebar
├─ Início            visão financeira
├─ A receber         lista (vencidos primeiro)   → Lançamento (drawer)
├─ A pagar           lista                        → Lançamento (drawer)
├─ Fluxo de caixa    projeção por semana/mês
├─ Conciliação       extrato × lançamentos (duas colunas)
└─ Relatórios        DRE, por categoria, por centro de custo
   Configurações     contas bancárias, categorias, integrações
```

## Telas e componentes

| Tela | Componentes-chave |
| --- | --- |
| Visão financeira | `KpiCard` (saldo, a receber 30 d, a pagar 30 d, inadimplência com `goodWhen="down"`), `BarChart` entradas × saídas com cores `ok`/`rose` + `LineChart` de saldo, `DonutChart` despesas por categoria, `WaterfallChart` do resultado do mês, `GoalMeter` orçamento × realizado |
| A receber / a pagar | `StatGrid` (vencido, vence hoje, próximos 7 d) + `DataTable`: vencimento (vencido em `text-rose`), contraparte, valor à direita, status; `BulkBar` (marcar como pago, enviar cobrança), `Pagination` |
| Lançamento | `Drawer`: `CurrencyField`, `DatePicker`, `Combobox` contraparte, `Select` categoria, anexo `FileDropzone` |
| Conciliação | duas colunas (extrato \| sugestões), `RecordCard` com valor e data, ação "Conciliar" com desfazer |
| DRE | tabela hierárquica com subtotais, `Delta` vs. período anterior por linha |

Blocos: `fin-cashflow` (fluxo de caixa), `fin-receivables` (contas a receber com aging), `fin-dre` (DRE gerencial). Categoria **Financeiro** no showcase.

## Regras específicas

- Valores negativos com sinal (`−R$ 1.200,00`) e em `text-rose` só quando é **problema** (saldo negativo), não em toda despesa.
- Vencido é sempre visível: badge `bad` "Vencido há 3 d" e ordenação padrão por vencimento.
- Marcar como pago é reversível → toast com "Desfazer", sem confirmação. Excluir lançamento conciliado → `ConfirmDialog`.
- Períodos contábeis fechados ficam somente leitura, com `Callout` explicando e quem pode reabrir.
