# Mural · publicar comunicado

- Arquivo: `src/blocks/comms-compose.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Comunicação
- Preview: showcase `#/frame/comms-compose` (`?theme=dark` para o escuro)

Criar comunicado oficial: editor de texto rico, público por área, cidade e cargo com estimativa de alcance, canais (app, e-mail, WhatsApp), leitura obrigatória com prazo, agendamento, pré-visualização no computador e no celular e aprovação antes de publicar.

## Conceito

**Objetivo:** Escrever um comunicado oficial que chega a quem precisa, pelo canal certo, e só sai depois de aprovado.

**Padrões aplicados**

- Anatomia C · Registro em edição: trilha + título + Salvar rascunho / Enviar para aprovação fixos; pré-visualização fixa à direita
- Stepper do ciclo (rascunho → aprovação → agendado → publicado) logo abaixo do cabeçalho
- Público por MultiSelect (áreas, cidades, cargos) com estimativa de alcance ao vivo
- Leitura obrigatória com prazo; agendamento com DateTimePicker (fuso visível)
- Pré-visualização computador/celular com notificação e o que chega em cada canal
- Envio com useOperation: botão informa, erro em bloco, rascunho nunca se perde

**Quando usar e o que adaptar**

- Campanha de e-mail para clientes, aviso a franqueados, comunicado a fornecedores

**Evite**

- Publicar direto sem aprovação quando o público é a empresa toda
- WhatsApp como canal padrão: só para quem não tem e-mail corporativo ou para urgências

## Componentes usados

`Avatar`, `Badge`, `Button`, `Callout`, `CheckboxGroup`, `Combobox`, `DatePicker`, `DateTimePicker`, `MultiSelect`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `RadioGroup`, `RichTextEditor`, `RichTextView`, `SegmentedControl`, `Select`, `SplitLayout`, `Step`, `Stepper`, `Switch`, `TextField`, `TextareaField`, `formatDate`, `formatNumber`, `useOperation`
