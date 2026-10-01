# Redefinir senha

- Arquivo: `src/blocks/auth-forgot-password.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Autenticação
- Preview: showcase `#/frame/auth-forgot-password` (`?theme=dark` para o escuro)

Fluxo completo em uma tela: pedir link → conferir e-mail → nova senha com confirmação → pronto. Mensagem neutra que não revela se o e-mail existe.

## Conceito

**Objetivo:** Recuperar o acesso sem fricção e sem revelar se um e-mail existe.

**Padrões aplicados**

- Anatomia H · Fluxo focado: uma coluna, quatro estados na mesma tela
- Mensagem neutra após pedir o link (segurança)
- Nova senha com confirmação e força visível

**Quando usar e o que adaptar**

- Qualquer produto com login próprio; troque o painel de marca

**Evite**

- Dizer 'e-mail não encontrado' (vaza a base de usuários)

## Componentes usados

`Button`, `PasswordField`, `TextField`
