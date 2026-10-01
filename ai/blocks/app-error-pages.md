# Páginas de erro

- Arquivo: `src/blocks/app-error-pages.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Aplicação
- Preview: showcase `#/frame/app-error-pages` (`?theme=dark` para o escuro)

404, 500, 403, sem conexão e manutenção dentro da casca do app, cada uma com saída clara. Troque o estado no topo.

## Conceito

**Objetivo:** Dar saída clara quando algo dá errado (404, 500, 403, offline, manutenção) sem tirar a pessoa do app.

**Padrões aplicados**

- Estados de tela dentro da casca: a navegação continua disponível
- Cada estado com causa em linguagem simples e uma ação de saída
- Estado linkável (?estado=) para testar

**Quando usar e o que adaptar**

- Use os mesmos estados em qualquer produto; troque textos e destinos das ações

**Evite**

- Tela de erro sem caminho de volta

## Componentes usados

`Banner`, `Button`, `ErrorState`, `ForbiddenState`, `MaintenanceState`, `NotFoundState`, `OfflineState`, `SegmentedControl`, `notify`
