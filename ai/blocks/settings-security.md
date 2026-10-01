# Segurança

- Arquivo: `src/blocks/settings-security.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Configurações
- Preview: showcase `#/frame/settings-security` (`?theme=dark` para o escuro)

Senha, verificação em duas etapas com código, sessões ativas com encerramento e chaves de API mostradas uma única vez.

## Conceito

**Objetivo:** Proteger a conta: senha, 2FA, sessões e chaves de API.

**Padrões aplicados**

- Anatomia D · Configurações: título 'Configurações' fixo e subnavegação colada abaixo (SettingsLayout)
- 2FA com código em modal (OtpInput)
- Sessões ativas com encerramento
- Chave de API mostrada uma única vez

**Quando usar e o que adaptar**

- Segurança de portal do cliente, acesso de parceiros

**Evite**

- Mostrar a chave de API de novo depois de criada

## Componentes usados

`Badge`, `Button`, `Callout`, `Column`, `ConfirmDialog`, `CopyButton`, `DataTable`, `Modal`, `OtpInput`, `PasswordField`, `SettingsSection`, `TextField`, `notify`
