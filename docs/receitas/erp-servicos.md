# Receita: ERP de serviços

Empresa que vende horas e atendimento em vez de produto (manutenção predial, climatização, TI, facilities): ordens de serviço, agenda de técnicos, orçamentos, contratos recorrentes, NFS-e e cobrança por boleto e Pix. Linha Conta Azul, Omie e SAP Business One.

## Entidades

| Entidade | Identidade | Campos que decidem | Relações |
| --- | --- | --- | --- |
| **Cliente** | razão social + CNPJ (`EntityMark`) | segmento, situação (ativo, implantação, inadimplente), receita recorrente, saldo vencido, ISS retido | contratos, OS, orçamentos, notas, cobranças |
| **Ordem de serviço (OS)** | número + título | etapa (Aberta → Agendada → Em execução → Concluída → Faturada), técnico, SLA, prioridade, checklist, assinatura | cliente, técnico, contrato ou orçamento de origem, NFS-e |
| **Técnico** | nome + avatar | especialidade, presença, carga semanal em horas | OS, agenda |
| **Orçamento** | número + cliente | situação (rascunho, enviado, aprovado, recusado, expirado), validade, horas × valor/hora, materiais, desconto, ISS | vira OS (avulso) ou contrato (recorrente) |
| **Contrato recorrente** | número + plano | valor mensal, índice e data de reajuste (IPCA/IGP-M), horas do pacote, próxima cobrança, situação | cliente, notas, cobranças |
| **Nota fiscal de serviço (NFS-e)** | número ou RPS | situação na prefeitura (a emitir, na prefeitura, emitida, rejeitada, cancelada), ISS e retenção | OS ou contrato |
| **Cobrança** | número + forma (boleto, Pix) | vencimento, situação (a vencer, vencida, paga), passo da régua | cliente, nota |

Nomes na interface: "OS" e "Ordem de serviço" (não "chamado" nem "ticket"), "Orçamento" (não "proposta"), "Cobrança" (não "título" nem "boleto" como sinônimo).

## Mapa de navegação

```
Sidebar
├─ Operação
│  ├─ Início                painel (caixa, a receber, OS, "Precisa de você")
│  ├─ Ordens de serviço     quadro por etapa (padrão) | lista  → OS (página de registro)
│  ├─ Agenda dos técnicos   semana técnico × dia | mês
│  ├─ Orçamentos            lista por situação → orçamento em drawer
│  └─ Clientes              lista → Cliente (página de registro com abas)
└─ Financeiro
   ├─ Contratos             lista por situação → contrato em drawer
   └─ Faturamento           (subitens, sem página própria)
      ├─ Notas fiscais (NFS-e)
      └─ Cobranças
   ⌘K                        OS (#), clientes (@), orçamentos e contratos, ações (>)
```

Contador na sidebar só onde pede ação: OS sem técnico, NFS-e rejeitadas, cobranças vencidas. Casca de referência: `src/blocks/shells/servicos-shell.tsx` (`AppShell` + `Sidebar` com subitens + `SearchPalette`; o modal de agendamento é compartilhado entre quadro, agenda e OS).

## Telas e blocos

| Tela | Comece por | Componentes-chave |
| --- | --- | --- |
| Início | bloco `srv-dashboard` | `KpiGrid`/`KpiCard` (saldo em caixa, a receber, a pagar, recorrente, OS abertas), `BarChart` do fluxo de caixa previsto por semana, `ListPanel` "Precisa de você" em quatro filas, `MiniBarChart` de OS concluídas, `StackedList` de técnicos em campo |
| Ordens de serviço | bloco `srv-work-orders` | `KanbanBoard` + `KanbanColumn` (totais no cabeçalho) + `RecordCard` com SLA em palavra, `SegmentedControl` Quadro \| Lista, `InlineSelect` de etapa na lista, `Modal` de agendamento ao arrastar para Agendada, abrir OS em `Drawer` (`?nova=1`) |
| OS | bloco `srv-work-order` | `PageHeading` com trilha, `StagePath`, uma ação primária por estado, `SplitLayout` + `PropertyList`, `Tabs` (Execução, Horas e materiais, Fotos e anexos, Histórico), `Checkbox` do checklist, `FileDropzone`, `LocationTag`, `Timeline` |
| Agenda | bloco `srv-schedule` | `WeekPicker`, `SegmentedControl` Semana \| Mês, grade técnico × dia com tokens, `Meter` de carga (horas de 44 h), `ListPanel` "Sem técnico", `MonthCalendar`, `MiniAgenda` no celular |
| Orçamentos | bloco `srv-quotes` | `PageToolbar` + `Tabs` por situação, `DataTable`, `Drawer` com itens de serviço e materiais separados, `NumberField`, `Combobox` de cliente, `Modal` "Aprovar como" (OS ou contrato) |
| Clientes | bloco `srv-clients` | `PageToolbar` + `FilterBar` + `TableSearch` (CNPJ sem pontuação), `DataTable` com `useSort`, cadastro em `Drawer` com "Buscar na Receita" |
| Cliente | bloco `srv-client` | `StatGrid` (recorrente, em aberto, vencido, OS abertas), `Callout` de inadimplência com saída, `Tabs`, `Switch` de ISS retido, edição em `Drawer` |
| Contratos | bloco `srv-contracts` | `Tabs` por situação (contador só em "Renovação próxima"), `Meter` de horas do pacote, `Drawer` com reajuste simulado, `ProjectProgressCard` da implantação |
| NFS-e | bloco `srv-invoices` | `DataGrid` com total e ISS no rodapé, emissão em lote pela seleção, rejeitada em `Drawer` com o campo exato a corrigir, `ConfirmDialog` para cancelar |
| Cobranças | bloco `srv-billing` | `Tabs` + `PageToolbar`, `BulkBar` "Enviar 2ª via", `Drawer` com Pix copia e cola, linha digitável e a régua em `Timeline`, `Switch` por passo da régua, conciliação simples do extrato |

## Regras específicas

- **Uma ação primária por estado da OS**: Agendar → Iniciar → Concluir → Faturar. Concluir exige checklist e assinatura do cliente; o `disabledReason` diz o que falta. Nunca todas as ações visíveis em todos os estados.
- **SLA e prazo em palavra** ("Atrasada 1 d", "Vence hoje 16:00"); borda vermelha só no estourado. Prioridade sempre com palavra, nunca só cor.
- **Alocar técnico não depende de arrastar**: o mesmo `Modal` de agendamento abre pelo botão "Alocar" no quadro, na agenda e na OS (teclado e leitor de tela).
- **Orçamento aprovado não é redigitado**: aprovar pergunta o destino (avulso → OS, recorrente → contrato) e o registro guarda o vínculo.
- **Valor a faturar separa** mão de obra coberta pelo contrato de materiais cobrados à parte. Desconto aparece como linha própria, não embutido no preço unitário.
- **Reajuste de contrato mostra o valor novo** antes de aplicar (índice acumulado × valor atual).
- **NFS-e rejeitada diz o que corrigir**: código da prefeitura, campo exato e onde achar o dado; "Reenviar" só depois de editar. ISS retido pelo tomador em palavra. Cancelar nota emitida é irreversível: `ConfirmDialog` com a consequência.
- **Régua de cobrança** (D-3, D0, D+1, D+7, D+15) é configurável por passo; D+15 vira tarefa, nunca suspensão automática. Baixa manual registra data e valor recebido.
- Valores com `formatCurrency`, horas com `formatNumber`, colunas numéricas à direita com `tabular-nums`; vencido pinta só o valor. CNPJ sempre com máscara.
- Local do atendimento com `LocationTag` (hora local) quando a operação cobre mais de um fuso.

## Blocos de referência

`srv-dashboard`, `srv-work-orders`, `srv-work-order`, `srv-schedule`, `srv-quotes`, `srv-clients`, `srv-client`, `srv-contracts`, `srv-invoices`, `srv-billing`. Casca: `shells/servicos-shell.tsx`; dados de exemplo: `src/blocks/data/servicos.ts`. Categoria **Serviços** no showcase. Para contas a pagar, fluxo de caixa e DRE, use os blocos `fin-*` ([receita financeiro](financeiro.md)).
