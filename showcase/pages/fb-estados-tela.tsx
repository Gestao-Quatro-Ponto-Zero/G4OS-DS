import { ArrowLeft, FileSearch, Home, LifeBuoy, Plus } from "lucide-react";
import { useState } from "react";
import {
  Button,
  Empty,
  ErrorState,
  ForbiddenState,
  MaintenanceState,
  NotFoundState,
  OfflineState,
  SegmentedControl,
  StateView,
  SuccessState,
} from "@g4os/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Estados de tela",
  group: "Feedback e estados",
  order: 20,
  description: "Quando uma área inteira não tem o que mostrar: página inexistente, erro, sem acesso, sem conexão, manutenção, sucesso. Todo estado diz o que aconteceu e oferece uma saída.",
};

const presets = ["404", "500", "403", "offline", "manutenção", "sucesso"] as const;

export default function Page() {
  const [kind, setKind] = useState<(typeof presets)[number]>("404");
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection
        title="Presets"
        rule="Seis situações cobrem quase tudo. Cada preset já traz ícone, tom, título e descrição em pt-BR; sobrescreva qualquer prop quando o contexto pedir (ex.: “Não encontramos este candidato”)."
      >
        <Demo
          bare
          code={`<NotFoundState action={<Button href="/">Voltar ao início</Button>} />
<ErrorState onRetry={recarregar} details={erro.stack} />
<ForbiddenState action={<Button>Pedir acesso</Button>} />
<OfflineState />
<MaintenanceState until="14h (horário de Brasília)" />
<SuccessState title="Importação concluída" description="1.204 contatos importados." />`}
        >
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <div className="flex items-center justify-between gap-3 border-b border-line bg-soft/50 px-4 py-2.5">
              <SegmentedControl label="Estado" value={kind} onChange={setKind} options={presets.map((p) => ({ value: p, label: p }))} />
            </div>
            {kind === "404" && (
              <NotFoundState
                action={<Button size="sm"><Home /> Voltar ao início</Button>}
                secondaryAction={<Button size="sm" variant="ghost"><ArrowLeft /> Página anterior</Button>}
              />
            )}
            {kind === "500" && (
              <ErrorState
                onRetry={() => undefined}
                secondaryAction={<Button size="sm" variant="ghost"><LifeBuoy /> Falar com o suporte</Button>}
                details={"GET /api/negocios?pipeline=vendas-b2b → 502 Bad Gateway\nrequest-id: 7f3a-91c2-4be0\n2026-09-30T18:42:11Z"}
              />
            )}
            {kind === "403" && <ForbiddenState action={<Button size="sm">Pedir acesso</Button>} />}
            {kind === "offline" && <OfflineState action={<Button size="sm" variant="ghost">Tentar agora</Button>} />}
            {kind === "manutenção" && <MaintenanceState until="14h (horário de Brasília)" />}
            {kind === "sucesso" && (
              <SuccessState
                title="Importação concluída"
                description="1.204 contatos importados. 12 linhas foram ignoradas por e-mail duplicado."
                action={<Button size="sm">Ver contatos</Button>}
                secondaryAction={<Button size="sm" variant="ghost">Baixar relatório</Button>}
              />
            )}
          </div>
        </Demo>
      </DocSection>

      <DocSection title="StateView: a base" rule="Use direto quando nenhum preset serve. Três tamanhos: `page` ocupa a tela inteira, `md` um painel, `sm` um card.">
        <div className="grid gap-4 md:grid-cols-2">
          <Demo title="Tamanho md, tom neutro" code={`<StateView icon={<FileSearch />} title="Nenhum relatório salvo" … />`} className="block p-0">
            <StateView
              icon={<FileSearch />}
              title="Nenhum relatório salvo"
              description="Relatórios salvos aparecem aqui para toda a equipe. Comece por um modelo."
              action={<Button size="sm"><Plus /> Novo relatório</Button>}
            />
          </Demo>
          <Demo title="Tamanho sm (dentro de card)" code={`<StateView size="sm" tone="warn" … />`} className="block p-0">
            <StateView size="sm" tone="warn" icon={<LifeBuoy />} title="Integração pausada" description="O token do ERP expirou há 2 dias." action={<Button size="sm" variant="ghost">Reconectar</Button>} />
          </Demo>
        </div>
        <PropsTable
          rows={[
            ["title", "string", "—", "O que aconteceu, em linguagem de gente."],
            ["description", "ReactNode", "—", "O que fazer agora. Até 2 linhas."],
            ["icon / illustration", "ReactNode", "—", "Ícone lucide em moldura, ou ilustração própria."],
            ["tone", '"neutral" | "info" | "ok" | "warn" | "bad"', '"neutral"', "Pinta só a moldura do ícone. `bad` vira role=alert."],
            ["code", "string", "—", "Código curto acima do título (404, 500)."],
            ["action / secondaryAction", "ReactNode", "—", "Primária à direita; secundária (ghost) à esquerda."],
            ["size", '"sm" | "md" | "page"', '"md"', "Altura mínima e escala do título."],
            ["children", "ReactNode", "—", "Extra abaixo das ações (detalhes técnicos, links)."],
          ]}
        />
      </DocSection>

      <DocSection title="Estado de tela × vazio de coleção" rule="Estado de tela = a área não funciona ou não existe. Vazio (Empty) = a área funciona, só não tem itens ainda. Não troque um pelo outro.">
        <div className="grid gap-4 md:grid-cols-2">
          <Demo title="Empty — coleção sem itens" className="block">
            <Empty title="Nenhum negócio neste estágio" hint="Arraste um card para cá ou crie um novo negócio." action={<Button size="sm" variant="ghost"><Plus /> Novo negócio</Button>} />
          </Demo>
          <Demo title="ErrorState — a coleção não carregou" className="block p-0">
            <ErrorState size="sm" onRetry={() => undefined} />
          </Demo>
        </div>
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Título diz o que aconteceu (“Você não tem acesso a esta área”).", dont: "“Ops!”, “Algo deu errado :(”, ou só o código “Erro 403”." },
            { do: "Sempre uma saída: tentar de novo, voltar, pedir acesso, falar com o suporte.", dont: "Tela sem nenhum botão — a pessoa fica presa." },
            { do: "Dizer que nada foi perdido quando for verdade. Reduz ansiedade.", dont: "Mostrar stack trace aberto. Detalhes técnicos ficam recolhidos." },
            { do: "Manutenção e offline dizem até quando / o que acontece depois.", dont: "Culpar a pessoa (“Você fez algo errado”)." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
