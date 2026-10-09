# Cenários manuais — cabeçalho estável durante a rolagem

Este roteiro valida o GD-612 pela experiência real do G4 OS. Ele foi escrito para uma pessoa que nunca usou o produto e não exige terminal, DevTools ou conhecimento técnico.

Referência: [GD-612](https://g4educacao.atlassian.net/browse/GD-612) · branch `fix/gd-612-stable-page-heading`.

## Antes de começar

O responsável pelo teste deve entregar:

- uma versão instalada do G4 OS que use a versão candidata do `@g4ai/ds` com o GD-612;
- um workspace temporário com pelo menos 9 projetos;
- uma biblioteca de Documentos com itens suficientes para rolar a página;
- acesso às telas Ferramentas, Automações, Marketplace, Configurações e Shared Brain;
- um mouse com roda e, no macOS, um trackpad.

Não use dados pessoais, informações de clientes ou um workspace de produção. Não exclua nem edite projetos importantes.

Em cada cenário, registre:

- sistema operacional e versão do G4 OS;
- tamanho aproximado da janela;
- dispositivo usado para rolar: trackpad, roda do mouse ou teclado;
- `Passou` ou `Falhou`;
- etapa em que ocorreu a falha;
- uma captura ou gravação curta da tela, se houver tremor, salto ou conteúdo inacessível.

## Resultado geral esperado

- a página rola continuamente, sem voltar sozinha ao topo;
- o cabeçalho grande sai da tela sem alterar a posição da lista;
- o cabeçalho compacto aparece uma vez depois que o título sai da tela e desaparece ao voltar ao topo;
- o último item da página pode ser alcançado;
- botões visíveis continuam respondendo;
- nenhum botão invisível recebe foco;
- a aplicação não fecha, congela nem mostra uma tela vazia.

## Cenário 01 — Rolar Projetos com o trackpad

**Objetivo:** confirmar que passos pequenos de rolagem não fazem o cabeçalho tremer nem devolvem a lista ao topo.

**Pré-condição:** use um Mac com trackpad e um workspace com pelo menos 9 projetos.

**Passos:**

1. Abra o G4 OS.
2. No menu lateral, clique em **Projetos**.
3. Ajuste a altura da janela para que a última linha de projetos fique parcialmente fora da tela.
4. Apoie dois dedos no trackpad e role para baixo bem devagar, com movimentos curtos.
5. Continue até o último projeto ficar visível.
6. Role devagar de volta ao topo.

**Passa quando:**

- cada movimento para baixo faz a lista avançar ou permanecer no fim;
- a tela não volta ao topo entre movimentos;
- o título grande não alterna rapidamente com o título compacto;
- o último projeto fica totalmente visível;
- o cabeçalho grande reaparece ao voltar ao topo.

**Falha típica:** o título e a descrição piscam, a lista sobe cerca de uma linha ou o indicador de rolagem volta ao início.

## Cenário 02 — Rolar Projetos com a roda do mouse

**Objetivo:** verificar o mesmo comportamento com passos maiores de uma roda física.

**Pré-condição:** mantenha a tela **Projetos** preparada no cenário 01 e conecte um mouse com roda.

**Passos:**

1. Volte ao topo da página **Projetos**.
2. Gire a roda um passo por vez para baixo.
3. Pare quando o cabeçalho compacto aparecer.
4. Clique em **Novo projeto** no cabeçalho compacto.
5. Feche a tela de criação sem salvar.
6. Continue rolando até o fim e depois volte ao topo.

**Passa quando:**

- a rolagem avança a cada passo e alcança o fim;
- o cabeçalho compacto aparece sem empurrar os projetos;
- **Novo projeto** pode ser acionado no cabeçalho compacto;
- fechar a criação devolve a pessoa ao mesmo ponto da lista;
- o cabeçalho compacto desaparece ao voltar ao topo.

## Cenário 03 — Manter os filtros de Documentos abaixo do cabeçalho

**Objetivo:** confirmar que a barra de filtros continua presa no lugar correto sem saltar sobre o conteúdo.

**Pré-condição:** a biblioteca de Documentos deve ter itens suficientes para rolar.

**Passos:**

1. No menu lateral, clique em **Documentos**.
2. Observe o título e a barra com busca ou filtros.
3. Role lentamente para baixo até o título grande sair da tela.
4. Continue rolando por mais duas linhas de documentos.
5. Use um filtro visível ou digite na busca.
6. Role de volta ao topo.

**Passa quando:**

- o cabeçalho compacto aparece no topo;
- a barra de filtros fica logo abaixo dele, sem espaço excessivo nem sobreposição;
- documentos não mudam de posição quando o cabeçalho compacto aparece;
- busca e filtros continuam clicáveis;
- voltar ao topo restaura o cabeçalho completo.

## Cenário 04 — Conferir as demais telas que usam o cabeçalho

**Objetivo:** verificar que a correção compartilhada não introduziu regressão nas outras áreas do aplicativo.

**Pré-condição:** use a mesma instalação e o workspace temporário.

**Passos:**

1. Abra **Ferramentas** e role a página para baixo e para cima.
2. Repita em **Automações**.
3. Repita em **Marketplace**.
4. Repita em **Configurações**.
5. Repita em **Shared Brain**.
6. Em cada tela, acione uma ação visível do cabeçalho compacto, se houver, e feche a tela aberta sem salvar alterações.

**Passa quando:**

- nenhuma das telas treme ou volta sozinha ao topo;
- o título compacto corresponde à tela aberta;
- ações visíveis continuam funcionando;
- não aparecem títulos duplicados ou barras sobrepostas.

## Cenário 05 — Redimensionar a janela e navegar pelo teclado

**Objetivo:** confirmar estabilidade em largura estreita e garantir que controles ocultos não recebem foco.

**Pré-condição:** abra **Projetos** no topo da página.

**Passos:**

1. Reduza a largura da janela até a descrição do cabeçalho ocupar mais de uma linha.
2. Role lentamente até o cabeçalho compacto aparecer.
3. Pressione `Tab` repetidamente até passar por todas as ações visíveis do cabeçalho.
4. Continue pressionando `Tab` por mais três controles.
5. Aumente a janela novamente e role ao topo.

**Passa quando:**

- redimensionar não cria rolagem horizontal na página;
- a rolagem continua estável mesmo com a descrição mais alta;
- o foco aparece somente em controles visíveis;
- cada ação do cabeçalho compacto recebe foco no máximo uma vez;
- o título da página não aparece duplicado visualmente.

## Checklist final

- [ ] Projetos rolou até o fim com trackpad, sem tremor.
- [ ] Projetos rolou até o fim com roda do mouse, sem voltar ao topo.
- [ ] A ação principal funcionou no cabeçalho compacto.
- [ ] A barra de filtros de Documentos ficou abaixo do cabeçalho compacto.
- [ ] Ferramentas, Automações, Marketplace, Configurações e Shared Brain não regrediram.
- [ ] A janela estreita não criou salto nem rolagem horizontal.
- [ ] O teclado não alcançou controles invisíveis ou duplicados.
- [ ] Sistema operacional, versão, resultado e evidências foram registrados.

## Se algo falhar

1. Pare de rolar e grave uma captura curta mostrando o título, a lista e a barra de rolagem.
2. Anote a tela, o tamanho aproximado da janela e se usou trackpad, roda ou teclado.
3. Feche e abra novamente a mesma tela para confirmar se a falha se repete.
4. Não altere nem apague dados para tentar destravar a página.
5. Envie a gravação, a etapa e a versão do G4 OS para a pessoa responsável pelo GD-612.
