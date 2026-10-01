import { Bold, Building2, Copy, Italic, Link2, Mail, MapPin, Phone, Trash2, Underline, Users } from "lucide-react";
import { Avatar, Badge, EntityMark, HoverCard, IconButton, Tooltip, TooltipGroup } from "@g4os/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Tooltip e hover card",
  group: "Sobreposições",
  order: 20,
  description: "Tooltip nomeia um controle só-ícone (e mostra o atalho). HoverCard mostra a prévia de uma entidade ao passar o mouse num link — sem substituir a página dela.",
};

function PersonPreview() {
  return (
    <div>
      <div className="flex items-center gap-3">
        <Avatar initials="MC" tint="#184560" size="lg" name="Mariana Couto" />
        <div className="min-w-0">
          <div className="text-[14px] font-semibold">Mariana Couto</div>
          <div className="text-[12.5px] text-muted">Head de Vendas · Acme Logística</div>
        </div>
      </div>
      <div className="mt-3 space-y-1.5 text-[12.5px] text-ink-soft">
        <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted" /> mariana@acmelog.com.br</div>
        <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted" /> (11) 98877-1020</div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge tone="ok">Decisora</Badge>
        <Badge>2 negócios abertos</Badge>
      </div>
    </div>
  );
}

function CompanyPreview() {
  return (
    <div>
      <div className="flex items-center gap-3">
        <EntityMark name="Vértice Saúde" tint="#842e20" />
        <div className="min-w-0">
          <div className="text-[14px] font-semibold">Vértice Saúde</div>
          <div className="text-[12.5px] text-muted">Hospitais · 1.200 funcionários</div>
        </div>
      </div>
      <dl className="m-0 mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3 text-[12px]">
        <div><dt className="text-muted">Receita anual</dt><dd className="m-0 mt-0.5 font-semibold tabular-nums">R$ 480 mil</dd></div>
        <div><dt className="text-muted">Cliente desde</dt><dd className="m-0 mt-0.5 font-semibold">mar/2024</dd></div>
      </dl>
      <div className="mt-3 flex items-center gap-3 text-[12px] text-muted">
        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Belo Horizonte</span>
        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> 6 contatos</span>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Tooltip" rule="Rótulo curto em tinta. Obrigatório em botão só-ícone quando o ícone não é universal. Mostra o atalho quando existe. Envolva a barra com TooltipGroup: depois do primeiro, os vizinhos abrem sem atraso.">
        <Demo
          code={`<TooltipGroup>
  <Tooltip content="Negrito" shortcut={["⌘", "B"]}>
    <IconButton label="Negrito"><Bold /></IconButton>
  </Tooltip>
  …
</TooltipGroup>`}
        >
          <TooltipGroup>
            <div className="inline-flex items-center gap-0.5 rounded-lg border border-line p-0.5">
              <Tooltip content="Negrito" shortcut={["⌘", "B"]}><IconButton label="Negrito" size="sm"><Bold /></IconButton></Tooltip>
              <Tooltip content="Itálico" shortcut={["⌘", "I"]}><IconButton label="Itálico" size="sm"><Italic /></IconButton></Tooltip>
              <Tooltip content="Sublinhado" shortcut={["⌘", "U"]}><IconButton label="Sublinhado" size="sm"><Underline /></IconButton></Tooltip>
              <span className="mx-1 h-5 w-px bg-line" />
              <Tooltip content="Inserir link" shortcut={["⌘", "K"]}><IconButton label="Inserir link" size="sm"><Link2 /></IconButton></Tooltip>
            </div>
            <Tooltip content="Copiar ID do pedido"><IconButton label="Copiar ID"><Copy /></IconButton></Tooltip>
            <Tooltip content="Excluir rascunho" side="bottom"><IconButton label="Excluir rascunho"><Trash2 /></IconButton></Tooltip>
            <Tooltip content="Valor com impostos, convertido pela cotação de 30/09" side="right">
              <button type="button" className="rounded border-b border-dashed border-muted text-[13px] tabular-nums">R$ 12.480,00</button>
            </Tooltip>
          </TooltipGroup>
        </Demo>
      </DocSection>

      <DocSection title="HoverCard" rule="Prévia de pessoa, empresa, vaga ou pedido ao passar o mouse num link. O link continua indo para a página; no toque, a prévia não abre — então nada nela pode ser exclusivo.">
        <Demo
          code={`<HoverCard content={<PersonPreview />}>
  <a href="/contatos/mariana">Mariana Couto</a>
</HoverCard>`}
          className="block"
        >
          <p className="m-0 text-[13.5px] leading-relaxed text-ink-soft">
            <HoverCard content={<PersonPreview />}>
              <a href="#" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">Mariana Couto</a>
            </HoverCard>{" "}
            moveu o negócio de{" "}
            <HoverCard content={<CompanyPreview />} width={320}>
              <a href="#" className="inline-flex items-center gap-1 font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"><Building2 className="h-3.5 w-3.5 text-muted" />Vértice Saúde</a>
            </HoverCard>{" "}
            para Negociação há 2 horas.
          </p>
        </Demo>
        <PropsTable
          rows={[
            ["Tooltip.content", "ReactNode", "—", "Texto curto. Nunca link, botão ou informação essencial."],
            ["Tooltip.shortcut", "string[]", "—", "Teclas: ['⌘', 'K']."],
            ["Tooltip.side", '"top" | "bottom" | "left" | "right"', '"top"', "Lado preferido; troca sozinho se não couber."],
            ["Tooltip.children", "ReactElement", "—", "UM elemento que aceite ref (button, a, IconButton)."],
            ["HoverCard.content", "ReactNode", "—", "Prévia da entidade: identidade, 2–4 fatos, status."],
            ["HoverCard.width", "number", "300", "Largura do cartão."],
          ]}
        />
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Tooltip repete o aria-label de um ícone e mostra o atalho.", dont: "Esconder instrução importante num tooltip (“clique aqui para…”)." },
            { do: "HoverCard com dados que também estão na página da entidade.", dont: "Botões de ação dentro do hover card — somem quando o mouse sai." },
            { do: "Atraso de ~400 ms para não abrir sem querer.", dont: "Tooltip em cima de texto que já está visível por inteiro." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
