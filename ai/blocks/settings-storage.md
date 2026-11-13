# Armazenamento

- Arquivo: `src/blocks/settings-storage.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Configurações
- Preview: showcase `#/frame/settings-storage` (`?theme=dark` para o escuro)

Uso da cota de 1 TB do workspace por categoria, com varredura ao abrir, barra segmentada ligada à legenda, recomendações de limpeza uma por vez (com confirmação quando é irreversível), maiores arquivos e uso por equipe.

## Conceito

**Objetivo:** Mostrar o que ocupa a cota e liberar espaço com segurança, sem o administrador ter de caçar arquivo por arquivo.

**Padrões aplicados**

- Anatomia D · Configurações: título 'Configurações' fixo e subnavegação colada abaixo (SettingsLayout)
- CapacityBreakdown: total, linha de status, barra segmentada e legenda ligadas pelo mesmo realce
- Uma recomendação por vez, com o tamanho na frase e verbo + objeto no botão; a próxima aparece quando a anterior termina
- Irreversível (versões antigas, lixeira) passa por ConfirmDialog; reversível (arquivo frio) vai direto e o toast oferece Desfazer
- Maiores arquivos com filtro por equipe e uso por equipe em BarList, para achar quem cuidar

**Quando usar e o que adaptar**

- Cota de e-mails ou de envio (SaaS)
- Assentos por plano (Configurações › Plano)
- Espaço do portal do cliente

**Evite**

- Mais de 6 categorias com cor (agrupe em Outros)
- Usar a barra para série temporal
- Apagar sem dizer quanto e o quê

## Componentes usados

`ActionMenu`, `BarList`, `Button`, `CapacityBreakdown`, `CapacitySegment`, `CapacitySuggestion`, `Empty`, `ErrorState`, `FileCard`, `Select`, `Skeleton`, `formatStorage`, `notify`
