# Avaliações de agentes

- Arquivo: `src/blocks/ai-agent-evals.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-agent-evals` (`?theme=dark` para o escuro)

Suítes de teste de cada agente: casos, score contra o mínimo para publicar, score por versão em gráfico, regressões, rodar avaliação (uma suíte ou todas) e casos que falharam com link para a execução. Cinco estados (?estado=).

## Conceito

**Objetivo:** Saber se uma versão nova do agente ficou melhor ou pior antes de ela atender clientes, e achar o caso que quebrou.

**Padrões aplicados**

- Anatomia A · Lista: cabeçalho fixo + PageToolbar com filtros; gráfico do agente escolhido acima da tabela
- Score por versão em LineChart com linha de referência no mínimo para publicar
- Suíte abaixo do mínimo = palavra + cor na linha (regressão)
- Rodar avaliação com useOperation: o botão diz o que está fazendo
- Caso que falhou leva à execução, onde está o trace

**Quando usar e o que adaptar**

- Testes de regras de automação, validação de prompts, QA de integrações
- Fora de IA: suíte = conjunto de cenários; score = % aprovado

**Evite**

- Score sem o mínimo ao lado (ninguém sabe se 87 % é bom)
- Falha sem link para o caso e a execução

## Componentes usados

`Badge`, `Button`, `ChartCard`, `Column`, `DataTable`, `Empty`, `EmptyFilterResult`, `FilterBar`, `FilterField`, `HealthDot`, `Highlight`, `LineChart`, `Meter`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PageToolbar`, `Select`, `StatCell`, `StatGrid`, `TableSearch`, `formatNumber`, `formatPercent`, `notify`, `useFilters`, `useOperation`
