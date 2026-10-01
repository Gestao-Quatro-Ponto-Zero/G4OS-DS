# Formato da resposta de revisão

```markdown
# Revisão G4OS-DS · <tela ou escopo>

**Resumo**: <1–2 frases: está no padrão? o que mais pesa?>
Audit: <E> erros · <W> avisos (antes) → <E'> · <W'> (depois, se corrigiu) · tsc: <ok/falha> · Verificado em: <1440/390, claro/escuro | só leitura de código>

## Alta (quebra regra, acessibilidade ou tema)
1. `arquivo.tsx:42` — <problema>. **Corrigir**: <componente/token do DS>. Ref.: `docs/padroes/…`

## Média (padrão, estado faltando, escrita)
1. …

## Baixa (polimento)
1. …

## Fora do escopo / dúvidas
- …
```

Cada item aponta arquivo:linha, diz o problema em uma frase e a correção concreta no vocabulário do DS. Não liste o que está certo. Não afirme verificação que não fez.
