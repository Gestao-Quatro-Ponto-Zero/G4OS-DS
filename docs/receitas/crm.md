# Receita: CRM

Gestão de relacionamento e vendas B2B: empresas, contatos, negócios em funil, atividades.

## Entidades

| Entidade | Identidade | Campos que decidem | Relações |
| --- | --- | --- | --- |
| **Empresa** | nome + marca (`EntityMark`) | segmento, porte, dono, saúde | contatos, negócios, atividades |
| **Contato** | nome + avatar | cargo, e-mail, telefone, empresa | empresa, negócios, atividades |
| **Negócio** | título + valor | etapa, valor, previsão de fechamento, dono, probabilidade | empresa, contatos, atividades |
| **Atividade** | tipo + data | ligação, reunião, e-mail, tarefa; concluída? | negócio/contato |

## Mapa de navegação

```
Sidebar
├─ Início           dashboard de vendas
├─ Negócios         quadro (padrão) | lista        → Negócio (página de registro)
├─ Empresas         lista                           → Empresa (entidade com abas)
├─ Contatos         lista                           → Contato (drawer ou página)
├─ Atividades       lista agrupada por dia / agenda
└─ Relatórios       funil, previsão, perdas
   Configurações    funis e etapas, equipe, campos, integrações
```

## Telas e blocos

| Tela | Comece por | Componentes-chave |
| --- | --- | --- |
| Dashboard de vendas | bloco `crm-sales-dashboard` | `KpiGrid`/`KpiCard` (receita, pipeline, conversão, ciclo), `AreaChart` com `reference` da meta, `FunnelChart`, `Leaderboard` de vendedores, `ListPanel tone="attention"` com negócios parados |
| Pipeline | bloco `crm-pipeline` | `KanbanBoard`, `KanbanColumn meta={soma}`, `RecordCard` (empresa, valor, dono, idade), `SegmentedControl` Quadro \| Lista, `FacetFilter` por dono |
| Negócio | bloco `crm-deal` | `ContextBar` (Negócios ›), `StagePath` com `outcome`, `SplitLayout` (atividades + notas / `PropertyList`), `ActivityFeed`, composer de nota |
| Contatos | bloco `crm-contacts` | `TableToolbar`, `DataTable` com `useSort`, `useSelection`, `BulkBar` (atribuir dono, exportar), `Pagination` |
| Empresa | `EntityHeader` com abas (Visão geral, Contatos, Negócios, Atividades, Arquivos) | `StatGrid`, `ListPanel`, `DataTable` |
| Novo negócio | `Drawer` | `Combobox` (empresa, contatos), `CurrencyField`, `DatePicker`, `Select` de etapa |
| Perder negócio | `Modal sm` | `Select` motivo (obrigatório), `TextareaField` |

## Regras específicas

- Valor sempre `formatCurrency`; somas de coluna em compacto (`R$ 1,2 mi`).
- Negócio parado > 14 dias → `tone="warn"` no card e entrada em "Precisa de você".
- Etapas intermediárias sem cor; Ganho `ok`, Perdido `bad`.
- Previsão de fechamento no passado = data em `text-rose`.
- Probabilidade é da etapa (configurável), não digitada por negócio.
