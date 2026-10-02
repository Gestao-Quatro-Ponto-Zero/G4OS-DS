# Termos e privacidade

- Arquivo: `src/blocks/app-legal.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Aplicação
- Preview: showcase `#/frame/app-legal` (`?theme=dark` para o escuro)

Página legal pública com Termos de uso e Política de privacidade: alternância entre os dois documentos, SectionNav com as seções, data de vigência e saídas para exportar dados e falar com o encarregado.

## Conceito

**Objetivo:** Deixar termos e privacidade legíveis e fáceis de citar, para quem vai criar conta ou precisa responder a uma dúvida jurídica.

**Padrões aplicados**

- Anatomia I · Público: cabeçalho do site fixo, o documento rola, sem casca de app
- Dois documentos irmãos em abas; cada seção tem endereço próprio (?p=termos/pagamento) para citar e compartilhar
- SectionNav fixo na lateral no desktop; no celular vem antes do texto
- Data de vigência no topo e resumo em linguagem simples antes do texto formal

**Quando usar e o que adaptar**

- Política de cookies, SLA, contrato de processamento de dados (DPA), código de conduta

**Evite**

- PDF como única versão
- Texto sem data de vigência
- Link de Termos que leva à home

## Componentes usados

`Callout`, `NavSection`, `NavSubItem`, `SectionNav`, `Tabs`, `formatDate`
