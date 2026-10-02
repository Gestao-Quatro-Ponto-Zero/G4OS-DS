# Página do agente

- Arquivo: `src/blocks/ai-agent.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-agent` (`?theme=dark` para o escuro)

Registro de um agente (?id=): status, pausar/retomar com confirmação, editar no construtor; abas Visão geral (KPIs, fluxo padrão, rollout da próxima versão, região, quem acompanha), Versões (dial de revisões + changelog, restaurar), Execuções, Avaliações e Permissões; propriedades fixas à direita.

## Conceito

**Objetivo:** Dar ao dono de um agente tudo o que ele precisa para confiar, evoluir e responder pelo agente: o que faz, como está indo, o que mudou e o que pode acessar.

**Padrões aplicados**

- Anatomia C · Registro: trilha 'Agentes', título, status e ações fixos; propriedades em SplitLayout à direita
- Ações mudam com o estado: Pausar (com ConfirmDialog) × Retomar; Editar abre o construtor
- Fluxo padrão em AgentPlan recolhível; passos que pedem aprovação marcados
- Rollout da próxima versão como ProjectProgressCard com o próximo passo
- Versões: RevisionTimeline (dial por dia) + Timeline com `leading` como changelog; restaurar pede confirmação
- Região de execução com LocationTag (hora local) e aviso de LGPD fora do Brasil

**Quando usar e o que adaptar**

- Página de uma automação, integração ou robô de RPA
- Sem versões? Troque a aba por 'Histórico de alterações' (log de auditoria)

**Evite**

- Pausar sem dizer o que acontece com o que está na fila
- Permissões escondidas em outra tela: quem é dono precisa ver o que o agente pode tocar
- Restaurar versão sem confirmação (muda o comportamento em produção)

## Componentes usados

`ActionMenu`, `AgentPlan`, `AppIcon`, `Badge`, `Button`, `Callout`, `ChartCard`, `Column`, `ConfirmDialog`, `DataTable`, `HealthDot`, `IconButton`, `LineChart`, `LocationTag`, `Meter`, `MiniBarChart`, `Page`, `PageHeading`, `PlanStep`, `ProjectProgressCard`, `PropertyList`, `Revision`, `RevisionTimeline`, `SplitLayout`, `StackedList`, `StatCell`, `StatGrid`, `Tabs`, `Timeline`, `TimelineItem`, `formatCurrency`, `formatDate`, `formatDuration`, `formatNumber`, `formatPercent`, `notify`
