# Entrar

- Arquivo: `src/blocks/auth-login.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Autenticação
- Preview: showcase `#/frame/auth-login` (`?theme=dark` para o escuro)

Login com e-mail e senha, SSO Google/Microsoft, link mágico e painel de marca navy à direita (some no celular).

## Conceito

**Objetivo:** Entrar rápido pelo caminho que a pessoa já usa: senha, SSO ou link mágico.

**Padrões aplicados**

- Anatomia H · Fluxo focado: formulário à esquerda, painel de marca navy à direita (some no celular)
- SSO Google/Microsoft e link mágico além da senha
- Erro no lugar do campo, sem limpar o que foi digitado

**Quando usar e o que adaptar**

- Portal do cliente, app interno, área de parceiros

**Evite**

- Painel de marca ocupando a tela no celular

## Componentes usados

`Button`, `Callout`, `Checkbox`, `PasswordField`, `TextField`
