# Receita: Portal do cliente

Área para o **cliente externo** acompanhar o serviço contratado: status, entregas, documentos, faturas, solicitações.

## Diferenças para um app interno

- Menos densidade, mais explicação: descrições de página visíveis, `NextStep` em destaque, linguagem sem jargão interno.
- Sidebar com 4–6 itens ou barra superior simples. Sem configurações de sistema.
- Nada de ações em massa, filtros avançados ou quadros editáveis.
- Tudo que o cliente precisa decidir aparece na primeira tela (aprovar, pagar, responder).

## Entidades vistas pelo cliente

| Entidade | O que o cliente faz |
| --- | --- |
| Projeto / serviço | acompanha progresso e próximos marcos |
| Entrega | aprova ou pede ajuste (aceite) |
| Documento | baixa, envia |
| Fatura | vê, paga, baixa nota |
| Solicitação | abre e acompanha |

## Telas e componentes

| Tela | Componentes-chave |
| --- | --- |
| Início | saudação + `NextStep` (o que depende dele), `Stepper` ou `StagePath` do projeto, `ListPanel` "Aguardando você", próximas reuniões |
| Entregas | `Card`/`LinkedCard` por entrega com status em palavra; aceite em `Modal` (Aprovar / Pedir ajuste com `TextareaField` obrigatório) |
| Documentos | lista com ícone por tipo, `FileDropzone` para envio |
| Faturas | `DataTable` simples: competência, valor, vencimento, status, "Baixar" |
| Solicitações | lista + formulário curto em `Drawer` |

Base: `auth-login` (link mágico), `auth-otp` (código), `onboarding-checklist`, `app-notifications`, `app-file-manager` (documentos).

## Regras específicas

- Autenticação sem senha preferida (link por e-mail ou código `OtpInput`).
- Tom mais explicativo; toda página com descrição de uma frase.
- Aprovar é ação primária em destaque; pedir ajuste é secundária, nunca escondida.
- Nunca exponha nomes internos de status ("Em revisão interna") — traduza para o que importa ao cliente ("Em preparação").
