# Criar conta

- Arquivo: `src/blocks/auth-signup.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Autenticação
- Preview: showcase `#/frame/auth-signup` (`?theme=dark` para o escuro)

Cadastro em duas etapas (você → empresa), senha com força visível, aceite de termos e SSO. Coluna única centrada.

## Conceito

**Objetivo:** Criar a conta com o mínimo de campos e sem dúvida sobre a senha.

**Padrões aplicados**

- Anatomia H · Fluxo focado: coluna única centrada em duas etapas (você → empresa)
- Stepper discreto; senha com força visível
- Plano vindo da página de preços (?plan=) aparece como selo

**Quando usar e o que adaptar**

- Cadastro de parceiro, convite de cliente para portal

**Evite**

- Pedir dados de cobrança no cadastro

## Componentes usados

`Badge`, `Button`, `Checkbox`, `PasswordField`, `Select`, `Stepper`, `TextField`
