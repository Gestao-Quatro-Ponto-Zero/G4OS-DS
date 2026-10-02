# Organização

- Arquivo: `src/blocks/settings-organization.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Configurações
- Preview: showcase `#/frame/settings-organization` (`?theme=dark` para o escuro)

Dados da empresa e do workspace: nome, razão social, CNPJ, logo, domínios verificados, fuso, idioma, moeda e início do ano fiscal, com barra de alterações não salvas.

## Conceito

**Objetivo:** Manter num só lugar a identidade da empresa que aparece em documentos, e-mails e relatórios do workspace.

**Padrões aplicados**

- Anatomia D · Configurações: título 'Configurações' fixo e subnavegação colada abaixo (SettingsLayout)
- Seções rótulo-à-esquerda; barra de alterações não salvas no rodapé
- Domínio com status por ponto + texto e verificação sob demanda
- Logo por FileDropzone com prévia

**Quando usar e o que adaptar**

- Dados fiscais do ERP, perfil da empresa no portal do cliente, conta de cliente no SaaS

**Evite**

- Salvar cada campo sozinho em formulário longo
- Domínio sem dizer o que falta para verificar

## Componentes usados

`ActionMenu`, `Badge`, `Button`, `Combobox`, `ConfirmDialog`, `CopyButton`, `EntityMark`, `FileDropzone`, `HealthDot`, `MaskedField`, `Modal`, `Select`, `SettingsSection`, `TextField`, `UploadItem`, `formatRelative`, `masks`, `notify`
