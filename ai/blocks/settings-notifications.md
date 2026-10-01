# Notificações

- Arquivo: `src/blocks/settings-notifications.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Configurações
- Preview: showcase `#/frame/settings-notifications` (`?theme=dark` para o escuro)

Matriz evento × canal (e-mail, push, Slack) agrupada por módulo, resumo diário, horário de silêncio e pausa geral. Salva sozinho.

## Conceito

**Objetivo:** Deixar cada pessoa escolher onde quer ser avisada de quê, sem ruído.

**Padrões aplicados**

- Anatomia D · Configurações: título 'Configurações' fixo e subnavegação colada abaixo (SettingsLayout)
- Matriz evento × canal por módulo
- Resumo diário, horário de silêncio e pausa geral
- Salva sozinho (efeito imediato, sem botão)

**Quando usar e o que adaptar**

- Preferências de qualquer produto

**Evite**

- Botão Salvar para switches de efeito imediato

## Componentes usados

`Button`, `Checkbox`, `RadioGroup`, `Select`, `SettingsSection`, `Switch`, `notify`
