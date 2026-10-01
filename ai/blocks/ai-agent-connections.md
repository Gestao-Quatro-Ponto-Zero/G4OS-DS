# Agente e conexões

- Arquivo: `src/blocks/ai-agent-connections.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-agent-connections` (`?theme=dark` para o escuro)

Página do agente: o que ele acessa (conexões), quem ele aciona (subagentes com estado), o que entrega (resultados), gatilhos e instruções.

## Conceito

**Objetivo:** Mostrar de uma vez o que um agente acessa, quem ele aciona e o que entrega, para o dono do agente confiar e ajustar permissões.

**Padrões aplicados**

- Anatomia C · Registro: cabeçalho fixo com Testar/Pausar, conteúdo à esquerda e cartão de conexões fixo à direita
- ConnectionsCard em três blocos: conexões (✓/Conectar), subagentes com estado, resultados
- Conectar acontece no lugar, com desfazer
- Gatilhos com switch: liga/desliga sem formulário

**Quando usar e o que adaptar**

- Página de integração de um usuário, bot de atendimento, robô de cobrança
- Troque 'subagentes' por 'etapas' quando o agente for uma automação linear

**Evite**

- Esconder permissões de escrita no meio da lista de leitura

## Componentes usados

`AgentConnection`, `AppIcon`, `Button`, `ConnectionsCard`, `Page`, `PageHeading`, `Subagent`, `Switch`, `notify`
