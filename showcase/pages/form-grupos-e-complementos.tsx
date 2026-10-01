import { useState } from "react";
import { ArrowUp, AtSign, Copy, Globe, Paperclip, Search } from "lucide-react";
import {
  CopyButton,
  FieldGroup,
  FieldSeparator,
  FieldSet,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
  Kbd,
  Label,
  Switch,
  TextField,
} from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Grupos de campos e complementos",
  group: "Formulários",
  order: 28,
  description: "FieldSet agrupa campos com legenda; FieldGroup e FieldSeparator dão o ritmo do formulário; Label rotula controles soltos; InputGroup coloca ícone, texto, botão ou atalho dentro do campo.",
};

export default function Page() {
  const [rua, setRua] = useState("Av. Paulista, 1000");
  const [cidade, setCidade] = useState("São Paulo");
  const [cep, setCep] = useState("01310-100");
  const [avisos, setAvisos] = useState({ etapa: true, tarefa: true, proposta: false });
  const [slug, setSlug] = useState("rede-horizonte");
  const [valor, setValor] = useState("12.500,00");
  const [msg, setMsg] = useState("");
  const link = `https://app.g4os.com.br/convite/${slug}`;
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="FieldSet, FieldGroup e FieldSeparator" rule="FieldSet (fieldset + legend nativos) dá nome a um grupo: endereço, cobrança, permissões. variant label para grupos de radios/checkboxes. FieldGroup empilha com o espaçamento padrão; disabled no FieldSet desliga tudo de dentro.">
        <Demo
          className="max-w-xl"
          code={`<FieldGroup>
  <FieldSet legend="Endereço de cobrança" description="Aparece na nota fiscal.">
    <FieldGroup gap="sm">
      <TextField label="Rua e número" value={rua} onChange={setRua} />
      <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
        <TextField label="Cidade" value={cidade} onChange={setCidade} />
        <TextField label="CEP" value={cep} onChange={setCep} />
      </div>
    </FieldGroup>
  </FieldSet>
  <FieldSeparator />
  <FieldSet variant="label" legend="Avisar por e-mail quando">
    <Switch label="Um negócio muda de etapa" checked={avisos.etapa} onCheckedChange={…} />
    <Switch label="Uma tarefa vence hoje" checked={avisos.tarefa} onCheckedChange={…} />
  </FieldSet>
</FieldGroup>`}
        >
          <FieldGroup>
            <FieldSet legend="Endereço de cobrança" description="Aparece na nota fiscal.">
              <FieldGroup gap="sm">
                <TextField label="Rua e número" value={rua} onChange={setRua} />
                <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                  <TextField label="Cidade" value={cidade} onChange={setCidade} />
                  <TextField label="CEP" value={cep} onChange={setCep} />
                </div>
              </FieldGroup>
            </FieldSet>
            <FieldSeparator />
            <FieldSet variant="label" legend="Avisar por e-mail quando" description="Vale para os negócios em que você é responsável.">
              <div className="flex flex-col gap-3">
                <Switch label="Um negócio muda de etapa" checked={avisos.etapa} onCheckedChange={(v) => setAvisos({ ...avisos, etapa: v })} />
                <Switch label="Uma tarefa vence hoje" checked={avisos.tarefa} onCheckedChange={(v) => setAvisos({ ...avisos, tarefa: v })} />
                <Switch label="O cliente responde a proposta" checked={avisos.proposta} onCheckedChange={(v) => setAvisos({ ...avisos, proposta: v })} />
              </div>
            </FieldSet>
          </FieldGroup>
        </Demo>
      </DocSection>

      <DocSection title="InputGroup" rule="Complementos dentro do campo: InputGroupAddon com align inline-start/inline-end (na linha) ou block-start/block-end (faixa acima/abaixo). Dentro: InputGroupText, InputGroupButton, ícone, Kbd. O contêiner mostra o foco. Ícone, prefixo e sufixo simples: TextField já tem.">
        <Demo
          className="grid gap-6 md:grid-cols-2"
          code={`<Label htmlFor="slug">Endereço do convite</Label>
<InputGroup>
  <InputGroupAddon><InputGroupText>app.g4os.com.br/</InputGroupText></InputGroupAddon>
  <InputGroupInput id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
  <InputGroupAddon align="inline-end"><CopyButton value={link} label="Copiar link" iconOnly /></InputGroupAddon>
</InputGroup>

<InputGroup>
  <InputGroupAddon><Search /></InputGroupAddon>
  <InputGroupInput aria-label="Buscar negócios" placeholder="Buscar negócios" />
  <InputGroupAddon align="inline-end"><Kbd>/</Kbd></InputGroupAddon>
</InputGroup>

<InputGroup>
  <InputGroupTextarea aria-label="Mensagem" placeholder="Escreva para o time…" />
  <InputGroupAddon align="block-end">
    <InputGroupButton label="Anexar"><Paperclip /></InputGroupButton>
    <InputGroupButton label="Mencionar"><AtSign /></InputGroupButton>
    <InputGroupButton variant="primary" label="Enviar" className="ml-auto"><ArrowUp /></InputGroupButton>
  </InputGroupAddon>
</InputGroup>`}
        >
          <div className="space-y-1.5">
            <Label htmlFor="ig-slug">Endereço do convite</Label>
            <InputGroup>
              <InputGroupAddon>
                <Globe />
                <InputGroupText>app.g4os.com.br/convite/</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput id="ig-slug" value={slug} onChange={(e) => setSlug(e.target.value)} className="pl-1" />
              <InputGroupAddon align="inline-end">
                <CopyButton value={link} label="Copiar link do convite" iconOnly />
              </InputGroupAddon>
            </InputGroup>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ig-valor" required>
              Valor da proposta
            </Label>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>R$</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput id="ig-valor" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} className="pl-2 tabular-nums" />
              <InputGroupAddon align="inline-end">
                <InputGroupText>/mês</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ig-busca">Buscar</Label>
            <InputGroup>
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput id="ig-busca" placeholder="Negócios, contatos, empresas" />
              <InputGroupAddon align="inline-end">
                <Kbd>/</Kbd>
              </InputGroupAddon>
            </InputGroup>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ig-token" optional>
              Chave de API (somente leitura)
            </Label>
            <InputGroup>
              <InputGroupInput id="ig-token" readOnly value="g4_live_••••••••••••3f9a" className="font-mono text-[13px]" />
              <InputGroupAddon align="inline-end">
                <InputGroupButton variant="ghost">
                  <Copy /> Copiar
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="ig-msg">Comentário</Label>
            <InputGroup>
              <InputGroupTextarea id="ig-msg" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Escreva para o time. Use @ para mencionar." />
              <InputGroupAddon align="block-end">
                <InputGroupButton label="Anexar arquivo">
                  <Paperclip />
                </InputGroupButton>
                <InputGroupButton label="Mencionar pessoa">
                  <AtSign />
                </InputGroupButton>
                <InputGroupText className="ml-auto pr-1">{msg.length}/500</InputGroupText>
                <InputGroupButton variant="primary" label="Enviar comentário" disabled={!msg.trim()}>
                  <ArrowUp />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Todo InputGroupInput com nome: Label htmlFor (preferido) ou aria-label.", dont: "Usar o placeholder como rótulo." },
            { do: "Botões só-ícone com label (vira aria-label e title).", dont: "Mais de dois botões na linha do campo: mova ações para a faixa block-end." },
            { do: "FieldSet para grupos com significado (endereço, permissões).", dont: "FieldSet para cada campo ou como moldura visual." },
          ]}
        />
      </DocSection>

      <DocSection title="Props">
        <PropsTable
          rows={[
            ["Label · htmlFor", "string", "—", "id do controle (obrigatório)."],
            ["Label · required / optional", "boolean", "false", "Asterisco com texto acessível / \"(opcional)\"."],
            ["FieldSet · legend / description", "ReactNode", "—", "Nome e explicação do grupo."],
            ["FieldSet · variant", '"section" | "label"', '"section"', "Título de seção ou rótulo de grupo."],
            ["FieldGroup · gap", '"sm" | "md" | "lg"', '"md"', "Espaço entre campos/grupos."],
            ["InputGroup · invalid / size", "boolean / \"sm\" | \"md\"", "— / md", "Borda de erro; altura 32 ou 40 px."],
            ["InputGroupAddon · align", '"inline-start" | "inline-end" | "block-start" | "block-end"', '"inline-start"', "Posição do complemento."],
            ["InputGroupButton · variant / label", '"quiet" | "ghost" | "primary" / string', "quiet", "label obrigatório quando só ícone."],
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
