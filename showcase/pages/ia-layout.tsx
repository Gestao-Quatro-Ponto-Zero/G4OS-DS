import { FolderKanban, History, MessagesSquare, Settings, Sparkles } from "lucide-react";
import { IconRail, ResizableSplit } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = { title: "Layout: painéis e trilho", group: "IA e interação", order: 24, description: "ResizableSplit (dois painéis com divisor arrastável e acessível) e IconRail (navegação só com ícones para telas de trabalho focado)." };

export default function Page() {
  return (
    <DocPage title={meta.title} kicker="IA e interação" description={meta.description}>
      <DocSection title="ResizableSplit + IconRail" rule="Arraste o divisor, ou foque nele (Tab) e use ← →, Shift para passos maiores, Home/End, duplo clique volta ao padrão. O tamanho fica salvo.">
        <Demo
          bare
          code={`<AppShell sidebar={({ mobileOpen }) => <IconRail groups={grupos} currentPath={rota} mobileOpen={mobileOpen} mark={<Logo />} />} …>
  <ResizableSplit storageKey="minha-tela" defaultSize={0.46} min={0.28} max={0.72}
    left={<Conversa />} right={<ArtifactPanel …/>} rightOpen={aberto} />
</AppShell>`}
        >
          <div className="flex h-[320px] overflow-hidden rounded-xl border border-line bg-page">
            <IconRail
              currentPath="#ws"
              mark={
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-on-primary">
                  <Sparkles className="h-4 w-4" />
                </span>
              }
              groups={[
                [
                  { href: "#ws", label: "Workspace", icon: Sparkles },
                  { href: "#proj", label: "Projetos", icon: FolderKanban, dot: true },
                  { href: "#conv", label: "Conversas", icon: MessagesSquare },
                ],
                [{ href: "#hist", label: "Execuções", icon: History }],
                [{ href: "#cfg", label: "Configurações", icon: Settings }],
              ]}
            />
            <ResizableSplit
              storageKey="doc-demo"
              mobileLayout="stack"
              left={<div className="p-4 text-[13px] text-muted">Painel esquerdo (conversa)</div>}
              right={<div className="h-full bg-soft/60 p-4 text-[13px] text-muted">Painel direito (artefatos)</div>}
            />
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["ResizableSplit.defaultSize / min / max", "number (0–1)", "0.46 / 0.28 / 0.72", "Largura do painel ESQUERDO."],
            ["ResizableSplit.storageKey", "string", "—", "Persiste o tamanho por tela."],
            ["ResizableSplit.rightOpen", "boolean", "true", "Fechado = esquerdo ocupa tudo. No celular, aberto = direito em tela cheia."],
            ["IconRail.groups", "RailItem[][]", "—", "Grupos separados por linha. RailItem: href, label, icon, dot?, badge?."],
            ["IconRail.mobileOpen", "boolean", "false", "Repasse do AppShell: vira gaveta com rótulos."],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "IconRail em telas de trabalho focado (agente, editor, canvas); Sidebar no resto.", dont: "Trilho de ícones num back-office com 15 seções (ninguém decora 15 ícones)." },
            { do: "Todo ícone do trilho com tooltip e aria-label.", dont: "Ícone sem nome." },
            { do: "No celular, o painel secundário abre por cima com um × claro.", dont: "Dois painéis espremidos em 390px." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
