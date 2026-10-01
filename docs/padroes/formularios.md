# Formulários

## Estrutura

- **Rótulo sempre visível, acima do campo.** Placeholder é exemplo ("Ex.: Diretor comercial"), nunca rótulo.
- **Regra do `label` (igual em todos os campos do DS):** `label` vira o rótulo visível acima do campo e o nome acessível (`TextField`, `Select`, `Combobox`, `MultiSelect`, `NativeSelect`, `CheckboxGroup`, `DatePicker`, `DateInput`, `Checkbox` ao lado da caixa). Dentro de `<FieldBlock label=…>` o rótulo é do FieldBlock e o campo não repete. `hideLabel` deixa só o nome acessível: use em toolbar, célula de tabela e filtro. Controles de barra (`Select size="compact"`, `ToggleGroup`, `SegmentedControl`) já escondem por padrão. Nunca faça um `<p>` de rótulo à mão acima de um campo.
- Uma coluna por padrão. `FieldGrid` põe pares curtos lado a lado (cidade + UF, início + fim) a partir de 640 px; no celular volta a uma coluna.
- Agrupe em seções com título quando passar de ~8 campos. Formulário longo mora em página ou drawer, em `ReadingColumn` (620 px).
- Ajuda abaixo do campo em uma frase; erro substitui a ajuda, em `text-rose`, específico e com exemplo.
- Obrigatório é o padrão; marque "(opcional)".

## Escolha do controle

| Situação | Controle |
| --- | --- |
| Texto curto | `input` com `fieldClass` / `TextField` |
| Texto longo | `textarea` com `areaClass` / `TextareaField` (cresce com o conteúdo) |
| Lista curta (≤ 7) de opções fixas | `Select` (Base UI). **Nunca `<select>` cru.** No celular abre como folha inferior. |
| Lista longa e simples em que o seletor do sistema é melhor (celular, sem busca, formulário sem JS) | `NativeSelect` (o `<select>` do sistema com a aparência do DS; aceita grupos) |
| 2–4 opções visíveis e mutuamente exclusivas | `SegmentedControl` ou `RadioGroup` |
| Escolha com descrição (plano, tipo de conta) | `ChoiceCards` / cards de escolha |
| Entidade (pessoa, empresa, produto) ou lista longa | `Combobox` com busca |
| Vários valores, 2–8 opções que cabem na tela | `CheckboxGroup` (tudo visível, "Selecionar todos" tri-estado, `disabledReason`) |
| Vários valores, lista longa, com grupos ou busca | `MultiSelect` (resumo "Ana, Bruno" / "5 selecionados", ou `display="chips"`; `max`) |
| Múltiplas entidades, poucas escolhidas | `Combobox` múltiplo (chips abaixo) |
| Etiquetas livres | `TagInput` |
| Liga/desliga com efeito imediato | `Switch` |
| Aceitar / marcar concluído | `Checkbox` |
| Data | `DatePicker` (botão + calendário) ou `DateInput` (digitável). Nunca `<input type="date">`: no iPhone abre em inglês e carrega vazio. Vazio mostra um placeholder que diz o padrão ("Hoje (padrão)"); `clearable` volta para vazio. |
| Número com passo | `NumberField` |
| Dinheiro | `CurrencyField` (R$, centavos) |
| CPF, CNPJ, CEP, telefone | `MaskedField mask={masks.cpf}` (`masks`: cpf, cnpj, cep, phone, date; CPF/CNPJ validam dígito) |
| Senha | `PasswordField` (mostrar/ocultar + força na criação) |
| Código de verificação | `OtpInput` (6 dígitos, colar preenche tudo) |
| Faixa de valores | `Slider` |
| Arquivo | `FileDropzone` |
| Nota / avaliação | `Rating` |

Edição inline de um campo: `InlineEdit`. Grupo de alternância com ícones: `ToggleGroup`. Todos os controles de `inputs.tsx` estão no showcase em **Formulários**.

## Desabilitado

- Desabilitado continua **legível** (texto `muted` sobre fundo suave, borda visível); só os preenchidos (primário, perigo) esmaecem.
- Quando o motivo não é óbvio, diga por quê: `<Button disabled disabledReason="Indisponível na demonstração">`. O botão continua focável (`aria-disabled`), não dispara e mostra o motivo em tooltip e para leitor de tela.
- Opção indisponível numa lista diz o porquê na própria opção (`disabledReason` em `CheckboxGroup` e `MultiSelect`).

## Celular

- `Select` e `DatePicker` abrem como **folha inferior** abaixo de 640 px (largura total, fundo escurecido, por cima da barra inferior, área segura do iPhone). `Combobox` e `MultiSelect` têm busca (o teclado sobe), então ficam ancorados ao campo com a largura da tela. `presentation="popover"` mantém o popover.
- Itens de lista com 44 px de altura mínima no toque.

## Envio

- Um primário no rodapé com o verbo ("Criar contato"), secundário "Cancelar" antes dele. Em drawer/modal, rodapé fixo.
- **Enquanto salva, o botão informa** ("Salvando…") e fica desabilitado; o formulário continua visível. Use `useOperation` + `OperationButton`.
- **Toast só depois que terminou**, nunca no clique.
- Falha vira bloco no topo do formulário (`OperationFeedback`) com saída: "Tentar de novo" (recusa) ou "Verificar alteração" (resposta incerta). Os dados digitados **nunca** se perdem.
- Validação: no blur do campo e no envio. Não valide enquanto a pessoa digita a primeira vez.
- Foco vai para o primeiro campo com erro no envio.

## Edição

| Quanto editar | Onde |
| --- | --- |
| Um campo (título, status, dono) | inline no próprio registro (selo que abre menu, clique para editar) |
| Formulário curto sem sair da lista | `Drawer` (500 px) |
| Decisão curta com 1–3 campos | `Modal` |
| Formulário longo ou com etapas | página própria; com etapas, `Stepper` no topo |

- Status é **controle inline** (selo que abre menu), nunca um `Select` por linha de tabela.
- Fechar um drawer com alterações não salvas pede confirmação.

## Máscaras e formatos brasileiros

- CPF `000.000.000-00`, CNPJ `00.000.000/0000-00`, CEP `00000-000`, telefone `(00) 00000-0000`.
- Moeda: digite só números, o campo formata `R$ 1.234,56`. Guarde em centavos (inteiro).
- Data: `dd/mm/aaaa` na tela, ISO `aaaa-mm-dd` no dado (`toIso`, `formatIsoDate`).
- Aceite colar com ou sem pontuação.

## Acessibilidade

- Todo campo tem `label` associado (os componentes fazem; em `input` cru, use `FieldBlock`).
- Erro ligado por `aria-describedby`, campo com `aria-invalid`.
- Grupo de rádios/checkbox dentro de `fieldset` com `legend`.
- Não desabilite o botão de envio para "forçar" preenchimento: deixe enviar e mostre os erros.
