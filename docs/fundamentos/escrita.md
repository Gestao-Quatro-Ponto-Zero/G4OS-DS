# Escrita de interface (pt-BR)

A interface fala como um colega competente: direta, específica, sem jargão interno e sem exclamação.

## Tom

- **Direto.** "Salvar contato", não "Clique aqui para salvar as informações do contato".
- **Específico.** "3 faturas vencem esta semana", não "Há itens que requerem sua atenção".
- **Sem culpa.** "Não encontramos esse CNPJ na Receita" em vez de "Você digitou um CNPJ inválido".
- **Sem jargão de sistema.** Nada de "registro", "entidade", "payload", "sincronização falhou (500)". Fale do objeto do usuário: contato, vaga, pedido.
- **Tratamento:** você (implícito). Nada de "o usuário".
- **Sem exclamação e sem emoji** em texto de produto.

## Maiúsculas

Só a primeira letra da frase e nomes próprios: "Nova fatura", "Configurações da equipe". Nunca Title Case ("Nova Fatura") nem CAIXA ALTA (exceto `overline`).

## Botões e ações

- **Verbo no infinitivo + objeto**: "Criar negócio", "Enviar proposta", "Agendar entrevista", "Emitir nota".
- O botão diz **o que vai acontecer**, não "OK", "Sim", "Confirmar", "Enviar" solto.
- Mesmo verbo do começo ao fim: se o botão é "Arquivar vaga", o toast é "Vaga arquivada" e o desfazer é "Desfazer".
- Enquanto executa, o botão informa no gerúndio: "Salvando…", "Emitindo nota…" (`OperationButton` faz isso com `busyLabel`).
- Destrutivo nomeia o objeto: "Excluir 3 contatos".

## Títulos

- Página: substantivo curto, igual ao item da sidebar ("Negócios", "Vagas", "Contas a pagar").
- Modal / drawer: a ação ou o objeto ("Novo contato", "Editar vaga").
- Card de gráfico: a pergunta ("Onde perdemos candidatos?"), descrição com período e unidade.

## Confirmações (`ConfirmDialog`)

- Título = pergunta com o objeto: **"Excluir a vaga Designer Sênior?"**
- Descrição = consequência concreta: "Os 42 candidatos continuam no banco de talentos. Esta ação não pode ser desfeita."
- Botão = o verbo: **"Excluir vaga"**. Secundário: "Cancelar".
- Se dá para desfazer, não confirme: execute e ofereça "Desfazer" no toast.

## Toasts (`notify`)

- Particípio + objeto: "Contato salvo", "Proposta enviada para Ana Lopes", "3 faturas marcadas como pagas".
- Uma linha. Sem "com sucesso" (é redundante).
- Com "Desfazer" quando reversível.

## Estados vazios (`Empty`)

Diga **o que falta** e **a próxima ação**:

- Título: "Nenhum negócio neste funil"
- Dica: "Crie um negócio ou importe uma planilha de oportunidades."
- Ação: botão "Criar negócio"

Com filtro ativo, o vazio é outro: "Nenhum contato com esses filtros" + "Limpar filtros".

## Erros

Três partes: **o que aconteceu, por quê (se souber), o que fazer.**

- Campo: abaixo do campo, específico, com exemplo: "Informe um e-mail válido, como nome@empresa.com."
- Operação: "Não foi possível emitir a nota. A prefeitura não respondeu. Tente de novo em alguns minutos." + botão "Tentar de novo".
- Resultado incerto (timeout depois de enviar): diga que não se sabe e como verificar: "Não sabemos se o pagamento foi registrado. Confira o extrato antes de tentar de novo." (`UncertainFailure`).
- Nunca mostre código técnico sozinho. Se precisar, depois da frase e em `text-muted`: "(código 504)".

## Rótulos de campo

- Substantivo, sem dois-pontos: "E-mail do contato", "Salário pretendido".
- Obrigatório é o padrão; marque o **opcional**: "Telefone (opcional)".
- Placeholder é exemplo, não rótulo: `Ex.: Diretor comercial`.
- Ajuda abaixo do campo, uma frase: "Aparece na proposta enviada ao cliente."

## Números, datas e unidades

- `formatCurrency`, `formatNumber`, `formatPercent`, `formatDate`, `formatRelative` (em `lib/format.ts`).
- Datas relativas até 30 dias ("há 5 min", "ontem", "em 3 dias"); depois, data curta ("12 set") ou completa ("12/09/2026").
- Plural correto com `plural(n, "tarefa")` → "1 tarefa", "3 tarefas".
- Espaço antes de % (padrão pt-BR do Intl): "12,5 %".

## Glossário por produto

Cada app define **um** nome por conceito e usa em toda parte (sidebar, título, botão, toast, e-mail). Exemplos:

| App | Use | Evite misturar com |
| --- | --- | --- |
| CRM | Negócio, Contato, Empresa, Atividade, Funil | oportunidade/deal/lead no mesmo app |
| ATS | Vaga, Candidato, Etapa, Entrevista, Proposta | job/aplicação/processo |
| ERP | Pedido, Produto, Estoque, Fornecedor, Nota fiscal | ordem/item/SKU na interface |
| Financeiro | Conta a pagar, Conta a receber, Lançamento, Conciliação | título/boleto como sinônimos |
