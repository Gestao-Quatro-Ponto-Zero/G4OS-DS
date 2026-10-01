# Servidor MCP em qualquer cliente

O servidor MCP vem dentro do pacote (`npx -y @g4ai/ds mcp`). Roda local, sem rede e sem dependências, e lê a versão **instalada** do DS: componentes, blocos e guias batem sempre com o que o projeto usa.

- **Transporte:** stdio (padrão). Também atende Streamable HTTP local com `--http`.
- **Protocolo:** negocia 2024-11-05, 2025-03-26, 2025-06-18 e 2025-11-25. Se o cliente pedir uma versão desconhecida, responde com a mais nova.
- **Requisito:** Node 20 ou mais novo. Não precisa de chave, conta nem variável de ambiente.
- **Schemas portáveis:** usam só `type`, `description`, `enum`, `properties` e `required`. Funcionam com Gemini, OpenAI/Codex, Cursor, Copilot e Claude sem adaptação.

## O que o servidor oferece

| Tipo | Itens |
| --- | --- |
| Ferramentas (9, todas só leitura) | `search`, `get_component`, `list_blocks`, `get_block`, `get_guide`, `get_tokens`, `theme_from_colors`, `audit`, `doctor` |
| Prompts | `adaptar-projeto`, `criar-tela`, `revisar-tela`. Aparecem como comandos `/` no Claude Code, VS Code e Zed |
| Recursos | `g4os-ds://core`, `g4os-ds://tokens`, `g4os-ds://llms`, `g4os-ds://components/{module}`, `g4os-ds://blocks/{slug}`, `g4os-ds://guides/{slug}`, com autocompletar |
| Outros | `ping`, `logging/setLevel`, `completion/complete`, paginação por `cursor` |

Respostas longas, como `get_block` com `include_source: true` ou módulos grandes, vêm em partes de cerca de 36 mil caracteres (uns 10 mil tokens). Assim ficam abaixo do limite do Claude Code e da janela de modelos menores. O fim da parte diz como continuar, por exemplo `get_block {"slug":"…","include_source":true,"offset":36012}`. Para mudar o tamanho da parte, use a variável `G4OS_DS_MCP_MAX_CHARS`.

## Configuração por cliente

O comando é sempre o mesmo: `npx -y @g4ai/ds mcp`. Se o DS já está instalado no projeto, o `npx` usa a versão de `node_modules`; fora de um projeto, baixa a última do npm.

| Cliente | Testado | Onde configurar |
| --- | --- | --- |
| Claude Code | ✓ (`claude -p`, 2.1) | `claude mcp add` ou `.mcp.json` |
| OpenAI Codex (CLI, IDE, app) | ✓ (`codex exec`, 0.159) | `~/.codex/config.toml` |
| MCP Inspector | ✓ (`--cli`) | linha de comando |
| SDK oficial (TypeScript) | ✓ (stdio e HTTP, 4 versões do protocolo) | `npm run test:mcp` |
| Claude Desktop, Cursor, VS Code/Copilot, Windsurf/Devin, Zed, Gemini CLI, Cline, Roo Code, Continue, Goose, JetBrains/Junie, opencode, Amp, Kiro | config abaixo, mesmo protocolo | ver cada seção |
| pi | sem MCP nativo: adaptador ou CLI | ver [pi](#pi) |

### Claude Code

```bash
claude mcp add g4os-ds -- npx -y @g4ai/ds mcp                  # só você, neste projeto
claude mcp add --scope project g4os-ds -- npx -y @g4ai/ds mcp  # grava .mcp.json para o time
claude mcp add --scope user g4os-ds -- npx -y @g4ai/ds mcp     # todos os projetos
```

```json
// .mcp.json na raiz do projeto
{ "mcpServers": { "g4os-ds": { "type": "stdio", "command": "npx", "args": ["-y", "@g4ai/ds", "mcp"] } } }
```

Os prompts aparecem como `/mcp__g4os-ds__criar-tela` e similares. Para conferir, use `/mcp` ou `claude mcp list`.

### Claude Desktop

Abra Configurações › Desenvolvedor › Editar configuração. O arquivo é `~/Library/Application Support/Claude/claude_desktop_config.json` no macOS e `%APPDATA%\Claude\claude_desktop_config.json` no Windows.

```json
{ "mcpServers": { "g4os-ds": { "command": "npx", "args": ["-y", "@g4ai/ds", "mcp"] } } }
```

Feche o app por completo e abra de novo. O Desktop inicia o servidor fora do seu projeto, então em `audit` e `doctor` passe o caminho **absoluto**.

### OpenAI Codex (CLI, extensão de IDE e app)

```bash
codex mcp add g4os-ds -- npx -y @g4ai/ds mcp
```

```toml
# ~/.codex/config.toml (ou .codex/config.toml num projeto confiável)
[mcp_servers.g4os-ds]
command = "npx"
args = ["-y", "@g4ai/ds", "mcp"]
startup_timeout_sec = 60   # o padrão (10 s) pode não bastar para o primeiro npx
```

Para conferir: `codex mcp list`.

### Cursor

O arquivo é `.cursor/mcp.json` no projeto ou `~/.cursor/mcp.json` para todos os projetos.

```json
{ "mcpServers": { "g4os-ds": { "type": "stdio", "command": "npx", "args": ["-y", "@g4ai/ds", "mcp"] } } }
```

O Cursor usa cerca de 40 ferramentas no total, somando todos os servidores, e o G4OS-DS ocupa 9.

### VS Code (GitHub Copilot)

O VS Code usa a chave `servers`, não `mcpServers`. O arquivo é `.vscode/mcp.json`, ou o comando "MCP: Open User Configuration" para todos os projetos.

```json
{ "servers": { "g4os-ds": { "type": "stdio", "command": "npx", "args": ["-y", "@g4ai/ds", "mcp"] } } }
```

```bash
code --add-mcp '{"name":"g4os-ds","command":"npx","args":["-y","@g4ai/ds","mcp"]}'
```

Use no modo Agent. Os prompts aparecem como `/mcp.g4os-ds.criar-tela`.

### Windsurf (Devin Desktop)

O arquivo é `~/.config/devin/mcp_config.json`, ou `.devin/mcp_config.json` no projeto. Em instalações antigas do Windsurf: `~/.codeium/windsurf/mcp_config.json`.

```json
{ "mcpServers": { "g4os-ds": { "command": "npx", "args": ["-y", "@g4ai/ds", "mcp"] } } }
```

### Zed

Em `settings.json` (comando "zed: open settings") ou `.zed/settings.json`:

```json
{ "context_servers": { "g4os-ds": { "command": "npx", "args": ["-y", "@g4ai/ds", "mcp"], "env": {} } } }
```

Versões antigas do Zed pedem `"source": "custom"` junto.

### Gemini CLI

```bash
gemini mcp add -s user g4os-ds npx -y @g4ai/ds mcp
```

```json
// ~/.gemini/settings.json (ou .gemini/settings.json no projeto)
{ "mcpServers": { "g4os-ds": { "command": "npx", "args": ["-y", "@g4ai/ds", "mcp"], "timeout": 60000 } } }
```

Para conferir: `/mcp` dentro do Gemini CLI.

### Cline e Roo Code

No painel MCP Servers › Configure, ou no arquivo `cline_mcp_settings.json`. No Roo Code também vale `.roo/mcp.json` no projeto.

```json
{ "mcpServers": { "g4os-ds": { "command": "npx", "args": ["-y", "@g4ai/ds", "mcp"], "disabled": false, "autoApprove": [] } } }
```

No Roo Code, `autoApprove` se chama `alwaysAllow`.

### Continue

Crie `.continue/mcpServers/g4os-ds.yaml`. Funciona só no modo agent.

```yaml
name: g4os-ds
version: 0.0.1
schema: v1
mcpServers:
  - name: g4os-ds
    type: stdio
    command: npx
    args: ["-y", "@g4ai/ds", "mcp"]
```

### Goose

Rode `goose configure` › Add Extension › Command-line Extension, ou edite `~/.config/goose/config.yaml`:

```yaml
extensions:
  g4os-ds:
    name: g4os-ds
    type: stdio
    cmd: npx
    args: ["-y", "@g4ai/ds", "mcp"]
    enabled: true
    timeout: 300
```

### JetBrains (AI Assistant e Junie)

No AI Assistant: Settings › Tools › AI Assistant › Model Context Protocol (MCP) › Add, e cole:

```json
{ "mcpServers": { "g4os-ds": { "command": "npx", "args": ["-y", "@g4ai/ds", "mcp"] } } }
```

No Junie, o mesmo JSON vai em `~/.junie/mcp/mcp.json` ou em `.junie/mcp/mcp.json` no projeto.

### opencode

```json
// opencode.json (projeto) ou ~/.config/opencode/opencode.json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": { "g4os-ds": { "type": "local", "command": ["npx", "-y", "@g4ai/ds", "mcp"], "enabled": true, "timeout": 30000 } }
}
```

### Amp e Kiro

```json
// Amp: ~/.config/amp/settings.json
{ "amp.mcpServers": { "g4os-ds": { "command": "npx", "args": ["-y", "@g4ai/ds", "mcp"] } } }
```

```json
// Kiro: .kiro/settings/mcp.json (ou ~/.kiro/settings/mcp.json)
{ "mcpServers": { "g4os-ds": { "command": "npx", "args": ["-y", "@g4ai/ds", "mcp"] } } }
```

### pi

O [pi](https://pi.dev) (`@mariozechner/pi-coding-agent`) não traz MCP por decisão de projeto. Há dois caminhos.

**1. Adaptador** [`pi-mcp-adapter`](https://pi.dev/packages/pi-mcp-adapter). Ele lê o mesmo `.mcp.json` do Claude Code:

```bash
pi install npm:pi-mcp-adapter
```

```json
// .mcp.json no projeto (ou ~/.config/mcp/mcp.json)
{ "mcpServers": { "g4os-ds": { "command": "npx", "args": ["-y", "@g4ai/ds", "mcp"] } } }
```

O pi passa a ver uma ferramenta `mcp` que dá acesso às 9 do DS. Por exemplo: `mcp({ tool: "search", args: { query: "funil" } })`.

**2. Sem MCP**, que é o jeito que o pi recomenda. Aponte o agente para o guia e a CLI do pacote no `AGENTS.md` do projeto. O agente lê `node_modules/@g4ai/ds/ai/core.md` e roda `npx g4os-ds audit src --fix-hints` e `npx g4os-ds doctor` pelo bash. O snippet pronto está em [`templates/AGENTS.snippet.md`](../../templates/AGENTS.snippet.md).

### Qualquer outro cliente MCP

Se o cliente aceita um servidor stdio com `command` e `args`, ele funciona com o G4OS-DS:

```json
{ "command": "npx", "args": ["-y", "@g4ai/ds", "mcp"] }
```

Se o cliente só aceita URL, use o modo HTTP (abaixo).

## Windows

Alguns clientes iniciam o processo sem shell e não acham o `npx` (que no Windows é `npx.cmd`). Nesse caso, troque o comando por `cmd /c npx`:

```json
{ "mcpServers": { "g4os-ds": { "command": "cmd", "args": ["/c", "npx", "-y", "@g4ai/ds", "mcp"] } } }
```

```bash
claude mcp add g4os-ds -- cmd /c npx -y @g4ai/ds mcp
```

Isso vale para o Claude Code nativo, Cline, Roo Code e versões antigas do Cursor. O Codex atual roda `npx` direto; em versões antigas, use o caminho completo: `command = 'C:\Program Files\nodejs\npx.cmd'`.

## Modo HTTP (Streamable HTTP)

Use o modo HTTP quando o cliente só aceita URL, ou quando vários agentes devem compartilhar um servidor. Ele mantém sessão (`Mcp-Session-Id`) e responde em JSON, sem stream SSE.

```bash
npx -y @g4ai/ds mcp --http                 # http://127.0.0.1:3845/mcp
npx -y @g4ai/ds mcp --http --port 4000     # outra porta (ou PORT=4000)
```

| Cliente | Como apontar |
| --- | --- |
| Claude Code | `claude mcp add --transport http g4os-ds http://127.0.0.1:3845/mcp` |
| VS Code | `{ "servers": { "g4os-ds": { "type": "http", "url": "http://127.0.0.1:3845/mcp" } } }` |
| Cursor, Zed, Kiro, Amp, Junie | `{ "url": "http://127.0.0.1:3845/mcp" }` |
| Codex | `[mcp_servers.g4os-ds]` com `url = "http://127.0.0.1:3845/mcp"` |
| Gemini CLI | `{ "httpUrl": "http://127.0.0.1:3845/mcp" }` (`url` significa SSE, que o servidor não usa) |
| Windsurf/Devin | `{ "serverUrl": "http://127.0.0.1:3845/mcp" }` |
| Cline | `{ "type": "streamableHttp", "url": "…" }` · Roo Code e Continue: `type: streamable-http` |
| opencode | `{ "type": "remote", "url": "…" }` · Goose: `type: streamable_http`, `uri: …` |

Por padrão o servidor escuta só em `127.0.0.1` e recusa `Origin` externa, como proteção contra DNS rebinding. `GET /health` responde `{ ok: true }`. Use `--host 0.0.0.0` só em rede confiável: o servidor não tem autenticação.

## Problemas comuns

| Sintoma | Causa e saída |
| --- | --- |
| Timeout ao iniciar na primeira vez | O `npx` está baixando o pacote. Rode `npx -y @g4ai/ds mcp --help` uma vez para aquecer o cache, ou aumente o tempo de início: `startup_timeout_sec` no Codex, `timeout` no opencode e Gemini, `MCP_TIMEOUT` no Claude Code. Com `@g4ai/ds` instalado no projeto, o início é imediato (≈ 50 ms). |
| "command not found: npx" / ENOENT | O cliente não herda o `PATH` do terminal (comum em apps de desktop com nvm ou fnm). Use o caminho absoluto: `"command": "/Users/voce/.nvm/versions/node/v22/bin/npx"` (veja com `which npx`). No Windows, use `cmd /c npx`. |
| Ferramentas não aparecem | Reinicie o cliente por completo. Confira com `claude mcp list`, `codex mcp list` ou `/mcp`. Rode `npx -y @g4ai/ds mcp --help`: se a ajuda imprime, o pacote está ok. |
| `audit`/`doctor` dizem que o caminho não existe | O servidor roda no diretório em que o cliente o iniciou, que no Desktop costuma ser `/`. Passe o caminho absoluto. |
| Resposta cortada | É de propósito: siga a dica `offset` no fim da parte. |
| Versão errada do DS | Fora de um projeto o `npx` pode reaproveitar o cache. Fixe a versão: `npx -y @g4ai/ds@0.3 mcp`. |
| Testar sem cliente | `npx @modelcontextprotocol/inspector --cli npx -y @g4ai/ds mcp --method tools/list`, ou a interface gráfica com `npx @modelcontextprotocol/inspector npx -y @g4ai/ds mcp` |

Para depurar, os logs do servidor vão para o **stderr**. O stdout é só do protocolo.

## Para quem mexe no servidor

O código está em `scripts/mcp.mjs`, sem dependências. `npm run test:mcp` (também roda em `npm run check`) testa o seguinte:

- o SDK oficial nas quatro versões do protocolo, chamando todas as ferramentas, recursos e prompts;
- o stdio cru: CRLF, BOM, pedaços parciais, lote, lixo, EOF e SIGTERM;
- o transporte HTTP: sessão, 405, 403 de Origin e 202;
- a portabilidade dos schemas.

`node scripts/test-mcp.mjs --inspector` roda também o MCP Inspector CLI. Ferramenta nova segue as mesmas regras de schema: objeto plano, tipos simples, enum só de string, sem `default` (o padrão vai na descrição).
