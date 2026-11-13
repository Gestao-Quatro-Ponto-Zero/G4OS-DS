# Avaliações de agentes

- Arquivo: `src/blocks/ai-agent-evals.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-agent-evals` (`?theme=dark` para o escuro)

Suítes de teste de cada agente: última execução caso a caso (grade de pontos por categoria com regressões e melhorias, filtros e comparação base × candidata com a rubrica do juiz), score contra o mínimo para publicar, score por versão em gráfico, rodar avaliação (uma suíte ou todas) e casos que falharam com link para a execução. Cinco estados (?estado=).

## Conceito

**Objetivo:** Saber se uma versão nova do agente ficou melhor ou pior antes de ela atender clientes, e achar o caso que quebrou.

**Padrões aplicados**

- Anatomia A · Lista: cabeçalho fixo + PageToolbar com filtros; gráfico do agente escolhido acima da tabela
- Última execução: EvalRunHeader (candidata × base, juiz, score contra a base, últimas 8 execuções, custo e tempo) + EvalDotGrid (um ponto por caso, forma além da cor, setas percorrem) + EvalCaseCompare (entrada, base × candidata, rubrica com ✓/×)
- Rodar a suíte transmite caso a caso (só com a aba visível); movimento reduzido mostra o resultado de uma vez
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
- Resultado só por cor (regressão e falha precisam de forma e palavra)

## Componentes usados

`Badge`, `Button`, `ChartCard`, `Column`, `DataTable`, `Empty`, `EmptyFilterResult`, `EvalCase`, `EvalCaseCompare`, `EvalCaseDetail`, `EvalCaseStatus`, `EvalCategory`, `EvalDotGrid`, `EvalRunHeader`, `FilterBar`, `FilterField`, `HealthDot`, `Highlight`, `LineChart`, `Meter`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PageToolbar`, `Select`, `StatCell`, `StatGrid`, `TableSearch`, `formatNumber`, `formatPercent`, `notify`, `useFilters`, `useOperation`, `useReducedMotion`, `useVisibleInterval`
