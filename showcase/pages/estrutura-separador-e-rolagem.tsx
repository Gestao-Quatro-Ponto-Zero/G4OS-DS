import { Avatar, Badge, Button, ScrollArea, Separator, initials } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Separador e área de rolagem",
  group: "Ações e exibição",
  order: 30,
  description: "Separator divide com 1 px (com rótulo opcional). ScrollArea dá rolagem própria a um trecho da tela, com barra fina e esmaecimento onde ainda há conteúdo.",
};

const pessoas = [
  ["Ana Ribeiro", "Executiva de contas", "Ativa"],
  ["Bruno Carvalho", "SDR", "Ativo"],
  ["Camila Duarte", "Gerente comercial", "Férias"],
  ["Diego Martins", "Executivo de contas", "Ativo"],
  ["Elisa Nunes", "Customer success", "Ativa"],
  ["Felipe Souza", "SDR", "Ativo"],
  ["Gabriela Lima", "Executiva de contas", "Ativa"],
  ["Heitor Alves", "Pré-vendas", "Ativo"],
  ["Isabela Rocha", "Customer success", "Licença"],
  ["João Pereira", "SDR", "Ativo"],
] as const;

const etapas = ["Prospecção", "Qualificação", "Diagnóstico", "Proposta", "Negociação", "Contrato", "Fechado", "Pós-venda", "Renovação"];

export default function Page() {
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Separator" rule="Divisória de 1 px em line. Prefira espaço e borda de superfície; use Separator dentro de um mesmo bloco (menu, card, formulário). Com label vira divisória rotulada.">
        <Demo
          className="grid gap-8 md:grid-cols-2"
          code={`<Separator />
<Separator label="ou continue com" />
<div className="flex h-5 items-center gap-3">
  <span>Pipeline</span><Separator orientation="vertical" /><span>Previsão</span>
</div>`}
        >
          <div className="space-y-4">
            <div>
              <p className="m-0 text-[13.5px] font-medium">Conta Acme Ltda.</p>
              <p className="m-0 text-[12.5px] text-muted">Cliente desde março de 2024</p>
            </div>
            <Separator />
            <div className="flex h-5 items-center gap-3 text-[13px] text-ink-soft">
              <span>Pipeline</span>
              <Separator orientation="vertical" />
              <span>Previsão</span>
              <Separator orientation="vertical" />
              <span>Atividades</span>
            </div>
          </div>
          <div className="space-y-4">
            <Button className="w-full">Entrar com e-mail</Button>
            <Separator label="ou continue com" />
            <Button variant="ghost" className="w-full">
              Google Workspace
            </Button>
          </div>
        </Demo>
      </DocSection>

      <DocSection title="ScrollArea" rule="Rolagem própria para um trecho: lista dentro de card, painel lateral, popover longo. A barra aparece ao passar o mouse ou rolar; as bordas esmaecem enquanto há mais conteúdo. Dê altura (className ou maxHeight) e um label para a região.">
        <Demo
          className="grid gap-6 md:grid-cols-2"
          code={`<ScrollArea maxHeight={280} label="Membros do time" className="rounded-xl border border-line bg-surface">
  {pessoas.map((p) => <Row key={p.nome} {...p} />)}
</ScrollArea>

<ScrollArea orientation="horizontal" label="Etapas">
  <div className="flex gap-2 p-1">{etapas.map((e) => <Badge key={e}>{e}</Badge>)}</div>
</ScrollArea>`}
        >
          <ScrollArea maxHeight={280} label="Membros do time" className="rounded-xl border border-line bg-surface">
            <ul className="m-0 list-none divide-y divide-line p-0">
              {pessoas.map(([nome, cargo, status]) => (
                <li key={nome} className="flex items-center gap-3 px-4 py-2.5">
                  <Avatar name={nome} initials={initials(nome)} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-medium">{nome}</div>
                    <div className="truncate text-[12px] text-muted">{cargo}</div>
                  </div>
                  <Badge>{status}</Badge>
                </li>
              ))}
            </ul>
          </ScrollArea>
          <div className="min-w-0 space-y-2">
            <p className="m-0 text-[12.5px] font-medium text-ink">Etapas do funil</p>
            <ScrollArea orientation="horizontal" label="Etapas do funil" className="rounded-xl border border-line bg-surface">
              <div className="flex gap-2 p-3">
                {etapas.map((e, i) => (
                  <span key={e} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-line bg-soft px-3 py-1.5 text-[13px]">
                    <span className="tabular-nums text-muted">{i + 1}</span>
                    {e}
                  </span>
                ))}
              </div>
            </ScrollArea>
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Uma rolagem por eixo: a página (Page) rola; ScrollArea só para um trecho com altura definida.", dont: "ScrollArea em volta da página inteira ou de outra ScrollArea na mesma direção." },
            { do: "label descritivo quando a área tem conteúdo navegável (vira região para leitor de tela e recebe foco).", dont: "Esconder conteúdo essencial numa área rolável sem indicação: o esmaecimento já sinaliza, não remova." },
            { do: "Separator para dividir itens do mesmo grupo.", dont: "Separator entre seções da página: use espaço e o título da seção." },
          ]}
        />
      </DocSection>

      <DocSection title="Props">
        <PropsTable
          rows={[
            ["Separator · orientation", '"horizontal" | "vertical"', '"horizontal"', "Vertical precisa de altura do pai (flex)."],
            ["Separator · label", "ReactNode", "—", "Texto no meio da linha (só horizontal)."],
            ["ScrollArea · orientation", '"vertical" | "horizontal" | "both"', '"vertical"', "Eixos com rolagem e barra."],
            ["ScrollArea · maxHeight", "number | string", "—", "Altura máxima. Ou use className com h-*."],
            ["ScrollArea · fade", "boolean", "true", "Esmaece a borda onde há mais conteúdo."],
            ["ScrollArea · label", "string", "—", "Nome acessível da região."],
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
