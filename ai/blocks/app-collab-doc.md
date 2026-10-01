# Conversa do time + documento

- Arquivo: `src/blocks/app-collab-doc.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Aplicação
- Preview: showcase `#/frame/app-collab-doc` (`?theme=dark` para o escuro)

Conversa entre pessoas ao lado de um documento em tipografia de leitura: mensagens com nome e hora, separador de data, “digitando”, faixa de ação obrigatória com envio de arquivo e índice do documento.

## Conceito

**Objetivo:** Discutir um documento com o time ao lado do próprio texto, com pendências claras (ex.: documento obrigatório que falta).

**Padrões aplicados**

- Anatomia G · App de altura total: conversa à esquerda, documento à direita
- Mensagens com nome e hora, separador de data e 'digitando'
- Faixa de ação obrigatória com envio de arquivo que se resolve sozinha
- Documento em tipografia de leitura com índice que acompanha

**Quando usar e o que adaptar**

- Due diligence, contratos, compliance (LGPD), revisão de propostas

**Evite**

- Comentários soltos sem vínculo com o documento

## Componentes usados

`ActionRequiredBanner`, `AvatarGroup`, `DateSeparator`, `ReadingDocument`, `SegmentedControl`, `TeamComposer`, `TeamMessage`, `TypingIndicator`, `notify`
