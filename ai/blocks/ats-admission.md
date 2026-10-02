# Admissões

- Arquivo: `src/blocks/ats-admission.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ATS
- Preview: showcase `#/frame/ats-admission` (`?theme=dark` para o escuro)

Do aceite ao primeiro dia: lista de contratados com progresso e, ao lado, o checklist por grupo (documentos, exame, contrato, acessos, primeiro dia) com responsável, alerta de prazo e conclusão. ?id=<candidato> abre a admissão (cria se ainda não existir).

## Conceito

**Objetivo:** Garantir que cada contratado chegue no primeiro dia com documentos, contrato e acessos prontos.

**Padrões aplicados**

- Anatomia F · Mestre-detalhe: contratados à esquerda, checklist à direita; seleção no endereço (?id=)
- Progresso por pessoa e alerta quando faltam itens perto da data de início
- Checklist agrupado com responsável por item; concluir só com tudo marcado (motivo no botão)
- Vem da proposta aceita (Iniciar admissão) já com a pessoa selecionada
- Cinco estados: ?estado=carregando|vazio|erro simula

**Quando usar e o que adaptar**

- Onboarding de clientes (portal), implantação (SaaS), homologação de fornecedor (ERP)

**Evite**

- Checklist sem dono por item (ninguém cobra)
- Concluir com pendências sem dizer quais

## Componentes usados

`Avatar`, `Badge`, `Button`, `Callout`, `Checkbox`, `ConfirmDialog`, `Empty`, `Meter`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PropertyList`, `Tabs`, `formatDate`, `notify`, `plural`, `useOperation`
