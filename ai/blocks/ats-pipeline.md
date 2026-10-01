# Candidatos da vaga

- Arquivo: `src/blocks/ats-pipeline.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ATS
- Preview: showcase `#/frame/ats-pipeline` (`?theme=dark` para o escuro)

Quadro (ou lista) de candidatos de uma vaga por etapa: nota média, origem, tempo na etapa, arrastar para avançar e adicionar candidato. Card abre o perfil.

## Conceito

**Objetivo:** Mover candidatos de uma vaga entre etapas e ver onde o funil trava.

**Padrões aplicados**

- Anatomia E · Quadro: colunas por etapa; no desktop a página não rola
- Card com nota média, origem e tempo na etapa; arrastar para avançar
- Alternar Quadro/Lista sem perder filtros
- Card abre o perfil

**Quando usar e o que adaptar**

- Pipeline de vendas, esteira de pedidos, kanban de chamados

**Evite**

- Mudar status por botões dentro do card

## Componentes usados

`Avatar`, `Badge`, `Button`, `Column`, `DataTable`, `KanbanBoard`, `KanbanColumn`, `Modal`, `Page`, `PageHeading`, `RecordCard`, `SegmentedControl`, `Select`, `TextField`, `chartColor`, `notify`
