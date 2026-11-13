# Descobrir agentes

- Arquivo: `src/blocks/ai-agent-templates.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-agent-templates` (`?theme=dark` para o escuro)

Galeria de modelos de agente por categoria: apps que cada um usa, modelo, nota, instalações e quem criou. 'Ver exemplo' mostra uma execução de 3 passos; 'Instalar' abre um fluxo curto (espaço de trabalho → acesso app a app → confirmação); 'Usar modelo' abre o construtor; campo de pedido para começar do zero.

## Conceito

**Objetivo:** Quem ainda não sabe o que automatizar encontra um ponto de partida testado por outras equipes e sai com um agente instalado (ou um rascunho para personalizar) em minutos.

**Padrões aplicados**

- Anatomia A · Lista (galeria): cabeçalho fixo + PageToolbar com abas de categoria e busca por agente ou app (só com 12 modelos ou mais)
- Cartão = apps (glifos) e modelo, nome, uma frase, nota e instalações (formatCompact) e autor
- Ver exemplo em Popover: uma execução real em 3 passos antes de decidir
- Instalar em Drawer de 3 etapas (Stepper): espaço de trabalho (Select) → acesso app a app (AppAccessList) → confirmação com 'Abrir agente'
- Instalação com useOperation/OperationButton: erro vira OperationFeedback com 'Tentar novamente'; Cancelar aborta a instalação em andamento
- Instalado vira selo 'Instalado' + 'Abrir'; 'Usar modelo' segue abrindo o construtor (?modelo=) como rascunho

**Quando usar e o que adaptar**

- Galeria de automações, integrações, modelos de relatório, playbooks de atendimento

**Evite**

- Cartões com ilustração genérica no lugar dos apps reais
- Instalar pedindo todas as permissões de uma vez sem dizer o que o agente faz com cada app
- Abrir outro drawer de dentro do fluxo de instalação

## Componentes usados

`AgentComposer`, `AppAccessItem`, `AppAccessList`, `Badge`, `Button`, `Drawer`, `Empty`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PageToolbar`, `Popover`, `Select`, `Stepper`, `TableSearch`, `Tabs`, `ToolGlyph`, `collectionThresholds`, `formatCompact`, `formatNumber`, `normalize`, `useOperation`
