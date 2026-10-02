# Construtor de agentes

- Arquivo: `src/blocks/ai-agent-builder.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-agent-builder` (`?theme=dark` para o escuro)

Conversa com o agente à esquerda e a ficha dele à direita: gatilhos, propriedades (ferramentas, entrada, saída, verificações), instruções em editor rico com “Melhorar”, testar e publicar. Abre qualquer agente da frota (?id=), uma cópia (?de=), um modelo (?modelo=) ou um pedido (?pedido=).

## Conceito

**Objetivo:** Definir o que um agente faz sem sair da conversa com ele: quem configura automações monta gatilhos, ferramentas e instruções e testa na hora.

**Padrões aplicados**

- Anatomia G · App de altura total: conversa à esquerda, ficha à direita (ResizableSplit)
- Ficha em seções: Gatilhos → Propriedades → Instruções, cada uma com '+ Adicionar'
- Uma ação primária no topo: Publicar (estado rascunho/publicado/alterado)
- Testar roda dentro da conversa com RunSummary, sem trocar de tela
- Instruções em editor rico com 'Melhorar com IA'

**Quando usar e o que adaptar**

- Construtor de automações, regras de CRM, playbooks de atendimento: troque os tipos de gatilho e propriedade
- No celular, alterne Ficha/Conversa em vez de dividir a tela

**Evite**

- Publicar sem estado visível (rascunho × publicado)
- Instruções em textarea sem estrutura para agentes complexos

## Componentes usados

`AddPropertyMenu`, `AgentComposer`, `AgentHeader`, `AgentInstructions`, `AgentMessage`, `AgentStatus`, `BuilderSection`, `Button`, `ChipPicker`, `MenuEntry`, `Modal`, `PropertyRow`, `PublishBar`, `ResizableSplit`, `RunStatus`, `RunSummary`, `TextField`, `ToolGlyph`, `TriggerList`, `notify`
