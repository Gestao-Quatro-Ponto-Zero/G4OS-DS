import { Filter, HelpCircle, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Badge, Button, Checkbox, FileCard, PropertyList, Sheet } from "@g4os/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Sheet",
  group: "Sobreposições",
  order: 30,
  description: "Painel temporário que entra pela borda: filtros avançados, detalhes rápidos, carrinho, ajuda contextual. No celular vira folha inferior.",
};

export default function Page() {
  const [open, setOpen] = useState<"filtros" | "pedido" | "ajuda" | null>(null);
  const [f, setF] = useState({ aberto: true, pago: false, vencido: true, cancelado: false });
  const close = () => setOpen(null);
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Exemplos" rule="Direita para detalhes e filtros; esquerda para navegação secundária; bottom para ações rápidas no celular. Abaixo de 640px, todos viram folha inferior (`responsive`).">
        <Demo
          code={`<Sheet open={open} onClose={() => setOpen(false)} title="Filtros" description="…"
  footer={<><Button variant="ghost" size="sm">Limpar</Button><Button size="sm">Aplicar</Button></>}>
  …
</Sheet>`}
        >
          <Button variant="ghost" size="sm" onClick={() => setOpen("filtros")}><Filter /> Filtros (direita)</Button>
          <Button variant="ghost" size="sm" onClick={() => setOpen("pedido")}><ShoppingCart /> Detalhe do pedido</Button>
          <Button variant="ghost" size="sm" onClick={() => setOpen("ajuda")}><HelpCircle /> Ajuda (esquerda)</Button>
        </Demo>

        <Sheet
          open={open === "filtros"}
          onClose={close}
          title="Filtrar faturas"
          description="Os filtros valem para a lista e para a exportação."
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={() => setF({ aberto: false, pago: false, vencido: false, cancelado: false })}>Limpar</Button>
              <Button size="sm" onClick={close}>Aplicar filtros</Button>
            </>
          }
        >
          <p className="m-0 mb-3 text-[12px] font-medium text-muted">Situação</p>
          <div className="flex flex-col gap-3">
            {(Object.keys(f) as (keyof typeof f)[]).map((k) => (
              <Checkbox key={k} label={k} checked={f[k]} onCheckedChange={(v) => setF({ ...f, [k]: v })}>
                {{ aberto: "Em aberto", pago: "Paga", vencido: "Vencida", cancelado: "Cancelada" }[k]}
              </Checkbox>
            ))}
          </div>
        </Sheet>

        <Sheet open={open === "pedido"} onClose={close} title="Pedido #4821" description="Criado por Bruno Takeda em 28/09/2026" width={460} footer={<Button size="sm" onClick={close}>Abrir pedido completo</Button>}>
          <div className="mb-4 flex gap-2"><Badge tone="info">Em separação</Badge><Badge>Frete CIF</Badge></div>
          <PropertyList
            items={[
              { label: "Cliente", value: "Rede Horizonte Farmácias" },
              { label: "Itens", value: "14 SKUs · 320 unidades" },
              { label: "Valor", value: <span className="font-semibold tabular-nums">R$ 38.420,00</span> },
              { label: "Previsão de entrega", value: "03/10/2026" },
              { label: "Transportadora", value: "Rápido Sul" },
              { label: "Nota fiscal" },
            ]}
          />
          <p className="m-0 mb-2 mt-6 text-[12px] font-medium text-muted">Anexos</p>
          <FileCard name="pedido-4821.pdf" size={184320} meta="Bruno" />
        </Sheet>

        <Sheet open={open === "ajuda"} onClose={close} side="left" title="Como funciona a comissão" width={380}>
          <div className="space-y-3 text-[13.5px] leading-relaxed text-ink-soft">
            <p className="m-0">A comissão é calculada sobre o valor líquido da fatura paga, no mês do pagamento.</p>
            <p className="m-0">Descontos acima de 15 % reduzem a comissão pela metade. Cancelamentos em até 30 dias estornam a comissão no mês seguinte.</p>
          </div>
        </Sheet>
      </DocSection>

      <DocSection title="Sheet × Drawer × Modal">
        <PropsTable
          rows={[
            ["Sheet", "painel leve", "direita / esquerda / baixo", "Filtros, detalhe rápido, carrinho, ajuda. Pode fechar clicando fora."],
            ["Drawer", "painel de edição", "direita, 500px", "Editar registro com formulário longo sem perder a lista. Não fecha ao arrastar para fora."],
            ["Modal", "decisão", "centro", "Poucos campos, uma decisão. Nunca formulário longo."],
          ]}
        />
        <PropsTable
          rows={[
            ["open / onClose", "boolean / () => void", "—", "Controlado."],
            ["side", '"right" | "left" | "bottom"', '"right"', "Borda de entrada no desktop."],
            ["responsive", "boolean", "true", "Abaixo de 640px vira folha inferior."],
            ["width", "number", "420", "Largura máxima (lados)."],
            ["footer", "ReactNode", "—", "Ações: secundária (ghost) antes, primária por último."],
          ]}
        />
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Um sheet por vez; dele, navegue para a página completa.", dont: "Abrir um sheet de dentro de outro sheet ou drawer." },
            { do: "Ações no rodapé fixo, visíveis sem rolar.", dont: "Botão “Aplicar” perdido no fim de um conteúdo longo." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
