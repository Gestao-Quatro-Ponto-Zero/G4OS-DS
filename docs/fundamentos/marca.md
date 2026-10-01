# Marca G4 na interface

A paleta do manual de marca (Navy Blue, Royal Gold, Royal Silver e secundárias) **não** é traduzida diretamente para a interface: o tema G4 continua neutro e o modo escuro continua cinza neutro, não navy. A marca aparece em três níveis.

| Nível | Onde | Como |
| --- | --- | --- |
| 1 · Toque (padrão) | Todos os produtos | Marcador Royal Gold no item ativo da navegação (`--ds-nav-marker`), progresso dourado, selos (`BrandBadge`). |
| 2 · Momento | Login, fim de onboarding, capa de relatório, saudação da IA, conquista | `BrandPanel` (navy `--ds-brand`, texto Royal Silver `--ds-on-brand`, brilho Royal Gold `--ds-brand-accent`), `BrandButton`, `AchievementCard`. **No máximo um por tela.** |
| 3 · Institucional | Apresentações, portais, páginas públicas | `<html data-brand="g4-institucional">`: neutros quentes (Warm White, Royal Silver, Light Gray, Charcoal), Navy na ação, Gold no destaque, escuro neutro com Silver na ação e semânticas do manual. |

## Paleta → tokens

| Nome | Hex | Primitivo | Semântico |
| --- | --- | --- | --- |
| Navy Blue | `#001F35` | `--g4-navy-blue` | `--ds-brand`; `--ds-primary` no Institucional |
| Royal Gold | `#B9915B` | `--g4-royal-gold` | `--ds-accent`, `--ds-brand-accent`, `--ds-nav-marker` |
| Royal Silver | `#F5F4F3` | `--g4-royal-silver` | `--ds-on-brand`; `--ds-soft` no Institucional |
| Maua Blue | `#031A26` | `--g4-maua-blue` | `--ds-navy` (painéis profundos, slides) |
| Scaling Blue | `#184560` | `--g4-scaling-blue` | `--ds-blue` (links) |
| Founders Red | `#441B1B` | `--g4-founders-red` | `--ds-founders` (só Founders) |
| Ground Clay | `#842E20` | `--g4-ground-clay` | `--ds-clay`, série 4 |
| Warm White · Light Gray · Mid Gray · Dark Gray · Charcoal | `#FAFAF9` `#E8E6E3` `#9A9895` `#4A4845` `#2A2826` | `--g4-warm-white` … `--g4-charcoal` | neutros do Institucional |

## Regras

- Navy só em momentos de marca; nunca como fundo de app nem como modo escuro.
- Royal Gold preenche e marca; texto dourado usa `accent-deep` (o `#B9915B` sobre branco tem 2,6:1 e reprova AA).
- Royal Silver é texto sobre navy e superfície suave no Institucional; nunca texto sobre branco.
- Mid Gray como texto só escurecido (`#6E6B67`, 5,1:1); o original fica para ícones.
- Founders Red só em conteúdo Founders; erro é rose.
- Gráficos no Institucional: Navy e Gold como séries 1 e 2; no máximo 3 cores de marca por gráfico.

Exemplos vivos: showcase › Fundamentos › Marca G4 na interface (`#/p/fund-marca`).
