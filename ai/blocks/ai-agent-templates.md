# Descobrir agentes

- Arquivo: `src/blocks/ai-agent-templates.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-agent-templates` (`?theme=dark` para o escuro)

Galeria de modelos de agente por categoria (Vendas, Financeiro, Suporte, Pessoas, Operações): ferramentas que cada um usa, quantas equipes usam, quem criou e tempo para configurar. 'Usar modelo' abre o construtor; campo de pedido para começar do zero.

## Conceito

**Objetivo:** Quem ainda não sabe o que automatizar encontra um ponto de partida testado por outras equipes e sai com um agente em rascunho em minutos.

**Padrões aplicados**

- Anatomia A · Lista (galeria): cabeçalho fixo + PageToolbar com categorias e busca
- Cartão = ferramentas (glifos), nome, uma frase, prova social (equipes) e autor
- Um primário por cartão: 'Usar modelo' abre o construtor com ?modelo=
- Pedido livre no topo para quem prefere descrever do zero

**Quando usar e o que adaptar**

- Galeria de automações, modelos de relatório, playbooks de atendimento

**Evite**

- Cartões com ilustração genérica no lugar das ferramentas reais
- Usar modelo publicando direto (sempre nasce rascunho)

## Componentes usados

`AgentComposer`, `Badge`, `Button`, `Empty`, `FilterChip`, `Page`, `PageHeading`, `PageToolbar`, `TableSearch`, `ToolGlyph`, `formatNumber`, `normalize`
