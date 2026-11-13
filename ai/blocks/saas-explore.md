# Explorar dados

- Arquivo: `src/blocks/saas-explore.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: SaaS
- Preview: showcase `#/frame/saas-explore` (`?theme=dark` para o escuro)

Tabela dinâmica self-service: arraste região, canal, plano e trimestre para linhas e colunas, escolha o que somar e exporte o recorte.

## Conceito

**Objetivo:** Responder perguntas que o painel não previu (receita do Pro no Nordeste por canal, desconto médio por segmento) sem pedir relatório ao time de dados.

**Padrões aplicados**

- Anatomia B · Painel: cabeçalho fixo + um card de trabalho que ocupa a página
- PivotBuilder: campos como chips, quatro áreas (Filtros, Colunas, Linhas, Valores), arrastar ou menu do campo
- Subtotais por grupo recolhível, total geral fixo no rodapé, sombreamento por intensidade
- Visões salvas como ponto de partida; Exportar CSV do recorte

**Quando usar e o que adaptar**

- Financeiro: lançamentos por centro de custo × mês
- ATS: candidaturas por vaga × etapa × origem
- ERP: pedidos por produto × UF × trimestre

**Evite**

- Usar o pivô para editar ou abrir registros: isso é DataGrid
- Pivô como resposta de uma pergunta fixa e recorrente: vire um gráfico no painel
- Mais de duas dimensões em Colunas: a tabela fica larga demais para ler

## Componentes usados

`Menu`, `Page`, `PageHeading`, `PivotBuilder`, `PivotBuilderField`, `PivotLayout`, `PivotRecord`, `Skeleton`
