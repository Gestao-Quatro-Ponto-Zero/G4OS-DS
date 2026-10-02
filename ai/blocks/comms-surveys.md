# Mural · pesquisas e clima

- Arquivo: `src/blocks/comms-surveys.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Comunicação
- Preview: showcase `#/frame/comms-surveys` (`?theme=dark` para o escuro)

eNPS do trimestre com distribuição de notas, evolução e eNPS por área, participação por área, temas dos comentários, lista de pesquisas com resultado em gaveta e criação de pesquisa com pré-visualização de como a pessoa responde.

## Conceito

**Objetivo:** Ouvir o time com frequência e mostrar o resultado de forma honesta: quanto recomendam, quem respondeu e o que pedem.

**Padrões aplicados**

- Anatomia A · Lista com resultado no topo: KPIs + NpsChart antes da lista de pesquisas
- Participação por área (BarList) e eNPS por área: onde a amostra é fraca, o número vale menos
- Resultado e ações da pesquisa em Drawer (?id=); criar em Drawer (?novo=1) com pré-visualização em Questionnaire
- Anonimato visível em todo lugar onde aparece um resultado
- Cinco estados na lista: ?estado=carregando|vazio|erro simula; aba sem itens oferece Ver todas

**Quando usar e o que adaptar**

- NPS de clientes (SaaS), pesquisa de satisfação de alunos, avaliação de fornecedores

**Evite**

- Mostrar resultado de grupo com menos de 5 respostas (quebra o anonimato)
- eNPS sem a base de comparação (trimestre anterior)

## Componentes usados

`Badge`, `BarList`, `Button`, `ChartCard`, `ChoiceCards`, `Column`, `ConfirmDialog`, `DataTable`, `DatePicker`, `Drawer`, `Empty`, `IconButton`, `KpiCard`, `KpiGrid`, `Meter`, `MiniBarChart`, `MultiSelect`, `NpsChart`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PropertyList`, `Questionnaire`, `QuestionnaireQuestion`, `Switch`, `Tabs`, `TextField`, `formatDate`, `formatNumber`, `formatPercent`, `notify`, `plural`, `useOperation`
