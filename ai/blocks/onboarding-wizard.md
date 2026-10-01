# Assistente de configuração

- Arquivo: `src/blocks/onboarding-wizard.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Onboarding
- Preview: showcase `#/frame/onboarding-wizard` (`?theme=dark` para o escuro)

Onboarding em 4 passos (espaço → módulos → equipe → dados) com trilha lateral, rodapé fixo, pular etapa e tela de conclusão.

## Conceito

**Objetivo:** Configurar o espaço de trabalho em poucos passos guiados, com a opção de pular.

**Padrões aplicados**

- Anatomia H · Fluxo focado: trilha lateral de passos + rodapé fixo Voltar/Continuar
- Um assunto por passo (espaço, módulos, equipe, dados)
- Pular etapa sempre disponível; tela de conclusão leva ao checklist

**Quando usar e o que adaptar**

- Implantação de módulo, importação de dados, configuração de integração

**Evite**

- Mais de 5 passos ou passos obrigatórios que podiam ser depois

## Componentes usados

`Button`, `ChoiceCards`, `FileDropzone`, `ProductMark`, `Select`, `TagInput`, `TextField`, `UploadItem`
