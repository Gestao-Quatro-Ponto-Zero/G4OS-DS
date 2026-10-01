# E-mail com IA

- Arquivo: `src/blocks/ai-compose-email.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-compose-email` (`?theme=dark` para o escuro)

Rascunhos preparados pelo agente: destinatários com busca e sugestões, modelo, estado RASCUNHO e envio com agendamento.

## Conceito

**Objetivo:** Revisar e enviar e-mails que o agente rascunhou, com controle humano sobre destinatários, texto e horário.

**Padrões aplicados**

- Anatomia F · Mestre-detalhe: rascunhos à esquerda, composer à direita (dialog no celular)
- Estado do rascunho sempre visível (Rascunho, Agendado, Enviado)
- Destinatários com busca e sugestões; enviar com desfazer; agendar no botão dividido

**Quando usar e o que adaptar**

- Respostas de atendimento, follow-up de vendas, convites de entrevista no ATS

**Evite**

- Enviar automaticamente sem passar por revisão

## Componentes usados

`AiBadge`, `Button`, `ComposeEmail`, `ComposeEmailDialog`, `ComposeStatus`, `MenuEntry`, `Page`, `PageHeading`, `Person`, `notify`
