---
"@g4ai/ds": minor
---

Componentes de histórico, progresso e presença, gestão de agentes de IA e três produtos de exemplo novos.

- Novos: `RevisionTimeline` (revisões navegáveis por dia), `ProjectProgressCard` (projeto com marcos e próximo passo), `StackedList` (destaque + diretório no mesmo cartão), `LocationTag` (lugar e hora local), `MiniBarChart` (barrinhas interativas).
- `AgentPlan` ganha modo rico: `collapsible`, e passos com `content` expansível, `durationMs`, `icon` e `defaultOpen`.
- `Timeline` ganha `leading` (coluna de versão e data: changelog) e `current`.
- Blocos de gestão de agentes (painel da frota, catálogo, registro do agente com versões, execuções, aprovações, avaliações, modelos e governança).
- Produtos de exemplo novos: ERP de serviços, comunicação interna e gestão de contratos.
- ERP com produtos, compras, recebimento, expedição e movimentações; CRM, ATS, SaaS, Atlas e Configurações com fluxos de criar e editar, telas que faltavam e os cinco estados de dados.
- `formatPercent` e `formatDelta` agora põem espaço inseparável antes do % ("12,5 %"), como pede o guia de escrita; antes saía "12,5%" (o Intl pt-BR cola o sinal). Se o seu app compara esses textos em testes, atualize as expectativas.
- `RichTextView`: mostra HTML de usuário só para leitura, higienizado por lista de permissões (no lugar de `dangerouslySetInnerHTML`).
- Painéis de exemplo com estados de carregando e erro; "Precisa de você" padronizado em `ListPanel tone="attention"`.
- `notify(message, { undo, action: { label, onClick }, tone })`: toast com ação que leva ao resultado ("Ver em Contas a pagar"); `useOperation` aceita `action` no sucesso. A forma antiga `notify(message, undo, tone)` continua valendo.
