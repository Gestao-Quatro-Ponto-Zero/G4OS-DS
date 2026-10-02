# Receita: plataforma de agentes de IA (frota)

Gestão dos agentes de IA da empresa: quem existe, o que cada um faz, quanto roda e custa, o que falhou e por quê, o que espera aprovação humana, se a nova versão está melhor que a anterior e quais limites valem para todos. Para a experiência de quem conversa com um agente (workspace, chat, tarefas propostas), veja [agentes](../padroes/agentes.md).

## Entidades

| Entidade | Identidade | Campos que decidem | Relações |
| --- | --- | --- | --- |
| **Agente** | nome + ferramentas (`ToolGlyph`) | status (ativo, pausado, com erro, rascunho), dono, área, modelo, versão em produção, orçamento, região de execução | versões, execuções, avaliações, permissões |
| **Versão** | número + data | publicada?, rollout, changelog, score da avaliação | agente |
| **Execução** | id + agente | status, gatilho, início, duração, tokens, custo, passos | agente, trace, aprovação |
| **Passo (trace)** | ordem + tipo | ferramenta, entrada, saída, latência, tokens, erro | execução |
| **Aprovação** | ação proposta + agente | tipo (e-mail, pagamento, mensagem), impacto, risco, prazo, política que exigiu | execução |
| **Suíte de avaliação** | nome + agente | casos, score, mínimo para publicar, regressão | agente, versões |
| **Modelo de agente** | nome + categoria | ferramentas, equipes que usam, tempo para configurar | agentes criados a partir dele |

Nomes na interface: "Agente", "Execução" (não "run" nem "job"), "Aprovação", "Avaliação" (não "eval"), "Créditos" para o consumo do mês.

## Mapa de navegação

```
IconRail
├─ Trabalho              Workspace, Projetos, Conversa com aprovação, Tarefas propostas, Chat livre
├─ Frota
│  ├─ Painel da frota    saúde, custo, "Precisa de você"
│  ├─ Agentes            lista com visões salvas → Agente (página de registro com abas)
│  │                                             → Construtor (app de altura total, ?id= | ?de= | ?modelo= | ?pedido=)
│  ├─ Descobrir agentes  galeria de modelos → Construtor (?modelo=)
│  ├─ Execuções          lista → Execução (registro com trace) → Inspetor (?id=)
│  ├─ Aprovações         mestre-detalhe (?id=)
│  └─ Avaliações         suítes por agente
└─ Administração
   ├─ Governança         custos, limites, política de aprovação, LGPD, chaves (?secao=)
   └─ Modelos e fontes   conexões (settings-integrations)
```

Contador só em Aprovações (pede decisão). Casca de referência: `src/blocks/shells/agent-shell.tsx` (`AppShell` + `IconRail`; no celular, pílula com Workspace, Painel, Agentes e Aprovações e o resto no menu).

## Telas e blocos

| Tela | Comece por | Componentes-chave |
| --- | --- | --- |
| Painel da frota | bloco `ai-agents-dashboard` | `KpiGrid`/`KpiCard` (execuções, sucesso, custo e latência p95 com `goodWhen="down"`), `BarChart` execuções × falhas por dia, `BarList` de quem mais roda, `MiniBarChart` de custo por área, `Meter` de créditos, `ListPanel` "Precisa de você" e incidentes que abrem a execução |
| Agentes | bloco `ai-agents` | `SavedViews` + `PageToolbar` + `FilterBar`, `DataTable` com `useSort` e `Pagination`, `HealthDot` + palavra, `Sparkline` de 7 dias, custo contra orçamento, `ActionMenu` (editar, execuções, pausar, duplicar), vazio com `AgentComposer` |
| Agente | bloco `ai-agent` | `PageHeading` com trilha, `SplitLayout` + `PropertyList`, `Tabs` (Visão geral, Versões, Execuções, Avaliações, Permissões), `AgentPlan` do fluxo padrão, `ProjectProgressCard` do rollout, `RevisionTimeline` + `Timeline` das versões, `LocationTag` da região, `ConfirmDialog` para pausar e restaurar |
| Construtor | bloco `ai-agent-builder` | `ResizableSplit` (conversa \| ficha), `AgentHeader` + `PublishBar`, `BuilderSection` Gatilhos → Propriedades → Instruções, `TriggerList`, `PropertyRow` + `ChipPicker`, `AddPropertyMenu`, `AgentInstructions`, teste na conversa com `RunSummary` |
| Descobrir agentes | bloco `ai-agent-templates` | `PageToolbar` com `FilterChip` de categoria e `TableSearch`, cartões com `ToolGlyph`, "Usar modelo" como único primário, `AgentComposer` para pedido livre |
| Execuções | bloco `ai-runs` | `SavedViews`, `FilterBar` (agente, status, gatilho, período), `StatGrid` do recorte (total, falhas, p95, custo), `DataTable` com `Pagination`, exportar CSV (`downloadCsv`) |
| Execução | bloco `ai-agent-run` | `AgentTrace` em cascata, entrada e saída do passo, `ToolCallsSection`, `TokenUsageMeter`, `JsonView`, "Executar de novo" com `OperationButton`, próximo passo em `CommandMenu` navegável por teclado |
| Inspetor | bloco `ai-trace` | `ResizableSplit` trace \| detalhe, `AgentTrace` com latência por passo, `JsonView`, `SystemMessage` do erro, tentar de novo só o passo que falhou |
| Aprovações | bloco `ai-approvals` | mestre-detalhe com `?id=`, `ApprovalRequest` (impacto, risco, prévia exata), política que exigiu a aprovação, recusar com motivo em `Modal` |
| Avaliações | bloco `ai-agent-evals` | `LineChart` do score por versão com referência no mínimo para publicar, `DataTable` de suítes, regressão em palavra, "Rodar avaliação" com `useOperation` |
| Governança | bloco `ai-agent-governance` | `SettingsLayout` + `SettingsSection` (`?secao=`), `Meter` de orçamento por área, orçamento por agente em `Drawer`, `SegmentedControl` da política (Sempre · Acima de um valor · Nunca), `ConfirmDialog` para mudança arriscada, chave nova com `CopyButton` exibida uma vez |

## Regras específicas

- **Status é ponto + palavra** (`HealthDot` + "Com erro", "Pausado"). Linha com erro ou orçamento acima de 90 % ganha faixa.
- **Custo sempre ao lado do orçamento**, com unidade e total do recorte. Custo, tokens e tempo visíveis em toda execução.
- **Mostre como chegou no resultado**: execução abre no trace por passo, nunca log em texto corrido. Falha em linguagem de gente, com link para o passo e "tentar de novo" só daquele passo.
- **Ação que sai da empresa passa por aprovação humana** (e-mail, mensagem, pagamento). O aprovador vê a prévia exata do que vai sair e a política que exigiu a aprovação. Recusar exige motivo, que volta para o agente como instrução. Pedido tem prazo.
- **Publicar tem estado visível** (rascunho, publicado, alterações não publicadas) e passa pela avaliação: score sem o mínimo ao lado não diz nada. Modelo de agente sempre nasce rascunho.
- **Mudança em produção pede confirmação**: pausar diz o que acontece com a fila; restaurar versão muda o comportamento; liberar modelo que processa dados fora do Brasil mostra o impacto de LGPD.
- **Permissões ficam no registro do agente**: quem é dono precisa ver o que o agente pode tocar.
- **Chave de API aparece uma única vez**, com copiar; depois, só o final.
- **Vazio começa pelo pedido** ("O que você quer automatizar?") com modelos sugeridos, não uma tabela vazia.
- Durações com `formatDuration`, custo com `formatCurrency`, taxas com `formatPercent`; KPIs de custo, latência e falhas com `goodWhen="down"`.

## Blocos de referência

`ai-agents-dashboard`, `ai-agents`, `ai-agent`, `ai-agent-builder`, `ai-agent-templates`, `ai-runs`, `ai-agent-run`, `ai-trace`, `ai-approvals`, `ai-agent-evals`, `ai-agent-governance`. Casca: `shells/agent-shell.tsx`. Categoria **IA** no showcase. Padrão relacionado: [agentes](../padroes/agentes.md) (construtor, tarefas propostas, aprovação).
