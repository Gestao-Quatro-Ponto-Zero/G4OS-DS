# Verificar código

- Arquivo: `src/blocks/auth-otp.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Autenticação
- Preview: showcase `#/frame/auth-otp` (`?theme=dark` para o escuro)

Confirmação por código de 6 dígitos: colar o código inteiro, verificação automática, erro com tentativas restantes e reenvio com contagem.

## Conceito

**Objetivo:** Confirmar a identidade com um código de 6 dígitos sem atrito.

**Padrões aplicados**

- Anatomia H · Fluxo focado: cartão central
- Colar o código inteiro; verificação automática no último dígito
- Erro com tentativas restantes; reenviar com contagem

**Quando usar e o que adaptar**

- 2FA em configurações de segurança, confirmação de telefone, aprovação de pagamento

**Evite**

- Botão 'Verificar' obrigatório quando os 6 dígitos já estão preenchidos

## Componentes usados

`Button`, `OtpInput`, `Spinner`
