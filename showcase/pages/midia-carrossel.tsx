import { ArrowUpRight } from "lucide-react";
import { AspectFrame, Badge, Carousel } from "@g4os/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { art } from "./_media-data";

export const meta: PageMeta = {
  title: "Carrossel",
  group: "Mídia e conteúdo",
  order: 10,
  description: "Rolagem nativa com encaixe (arrasta no toque, funciona no trackpad), setas, pontos e ←/→. Para conteúdo equivalente e opcional: destaques, fotos, modelos.",
};

const templates = [
  { t: "Pipeline de vendas B2B", d: "7 etapas, motivos de perda e SLA por etapa", tag: "CRM" },
  { t: "Recrutamento de tecnologia", d: "Triagem, teste técnico, 2 entrevistas, proposta", tag: "ATS" },
  { t: "Contas a receber", d: "Régua de cobrança com e-mails automáticos", tag: "Financeiro" },
  { t: "Onboarding de clientes", d: "Checklist de 30 dias com marcos e responsáveis", tag: "CS" },
  { t: "Compras e aprovações", d: "Requisição → cotação → aprovação → pedido", tag: "ERP" },
  { t: "Pesquisa NPS trimestral", d: "Envio, lembretes e painel de resultados", tag: "CS" },
];

export default function Page() {
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Destaque único" rule="Um item por vez, 16:9. Autoplay só aqui e opcional: pausa no hover/foco e desliga com “reduzir movimento”.">
        <Demo bare code={`<Carousel label="Novidades" autoplay={6000}>
  <AspectFrame><img src={…} alt="…" /></AspectFrame>
  …
</Carousel>`}>
          <Carousel label="Novidades do produto" autoplay={6000}>
            {["Previsão de receita no pipeline", "Scorecards de entrevista", "Conciliação bancária automática"].map((t, i) => (
              <AspectFrame key={t} ratio={21 / 8}>
                <img src={art(i * 3)} alt="" />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-navy/80 via-navy/20 to-transparent p-6 text-white">
                  <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-accent">Novo</span>
                  <span className="mt-1 text-[22px] font-semibold tracking-tight">{t}</span>
                </div>
              </AspectFrame>
            ))}
          </Carousel>
        </Demo>
      </DocSection>

      <DocSection title="Vários por vez" rule="`perView` no desktop, `perViewMobile` abaixo de 640px. Os pontos andam por posição, não por página.">
        <Demo bare code={`<Carousel label="Modelos" perView={3} perViewMobile={1.15} arrows>
  {modelos.map((m) => <Card …/>)}
</Carousel>`}>
          <Carousel label="Modelos prontos" perView={3} perViewMobile={1}>
            {templates.map((m, i) => (
              <a key={m.t} href="#" className="surface-card surface-interactive block h-full overflow-hidden rounded-xl border border-line bg-surface hover:border-line-strong">
                <AspectFrame ratio={16 / 9} className="rounded-none border-0 border-b">
                  <img src={art(i + 1)} alt="" />
                </AspectFrame>
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge>{m.tag}</Badge>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
                  </div>
                  <div className="mt-2 text-[14px] font-medium">{m.t}</div>
                  <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-muted">{m.d}</p>
                </div>
              </a>
            ))}
          </Carousel>
        </Demo>
        <PropsTable
          rows={[
            ["label", "string", "—", "Nome do conjunto (aria-label)."],
            ["perView / perViewMobile", "number", "1 / 1", "Itens visíveis por vez."],
            ["gap", "number", "12", "Espaço entre itens (px)."],
            ["autoplay", "number (ms)", "—", "Avança sozinho; pausa em hover/foco e com movimento reduzido."],
            ["arrows / dots", "boolean", "true", "Setas (só ≥ 640px) e pontos."],
          ]}
        />
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Itens equivalentes e opcionais (modelos, fotos, destaques).", dont: "Esconder num carrossel preço, prazo ou ação principal." },
            { do: "Mostrar parte do próximo item no celular para indicar que rola.", dont: "Autoplay rápido com texto para ler." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
