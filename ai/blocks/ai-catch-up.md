# Resumo do período

- Arquivo: `src/blocks/ai-catch-up.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-catch-up` (`?theme=dark` para o escuro)

\"Enquanto você estava fora\": a IA lê Slack, e-mail, GitHub e tarefas de um período e devolve quatro seções (Precisa de você, Decisões tomadas, Entregue, Para saber). Em Precisa de você, cada linha traz a oferta da IA com a ação.

## Conceito

**Objetivo:** Pôr a pessoa em dia em um minuto depois de um dia fora e resolver ali mesmo o que espera por ela, sem abrir quatro apps.

**Padrões aplicados**

- Anatomia B · Painel em coluna estreita: período no topo, fontes, depois o resumo
- Quatro seções fixas, nesta ordem; seção vazia não aparece
- Precisa de você: a linha diz o que espera; a oferta da IA diz o que ela faz e leva o primário
- Linhas reservadas enquanto o resumo chega; lido recolhe a linha e passa o foco

**Quando usar e o que adaptar**

- Volta de férias, início do dia, passagem de turno de suporte, resumo de um canal ou projeto

**Evite**

- Resumo sem as fontes e a contagem do período
- Oferecer trabalho em Decisões, Entregue ou Para saber
- Executar a oferta sem a pessoa tocar em Fazer

## Componentes usados

`Button`, `CatchUpDone`, `CatchUpItem`, `CatchUpRow`, `CatchUpRowSkeleton`, `CatchUpSection`, `CatchUpSource`, `CatchUpSources`, `Page`, `PageHeading`, `SegmentedControl`, `ToolGlyph`, `catchUpSections`, `notify`, `prefersReducedMotion`, `useVisibleInterval`
