import { ArrowLeft, Home, LifeBuoy, RotateCw } from "lucide-react";
import {
  Banner,
  Button,
  ErrorState,
  ForbiddenState,
  MaintenanceState,
  NotFoundState,
  OfflineState,
  SegmentedControl,
  notify } from "@g4os/ds";
import { AtlasShell, atlasRoutes } from "./shells/atlas-shell";
import { setFrameQuery, useFrameQuery } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Páginas de erro",
  description: "404, 500, 403, sem conexão e manutenção dentro da casca do app, cada uma com saída clara. Troque o estado no topo.",
  category: "Aplicação",
  order: 1,
  height: 720,
  concept: {
    goal: "Dar saída clara quando algo dá errado (404, 500, 403, offline, manutenção) sem tirar a pessoa do app.",
    patterns: [
      "Estados de tela dentro da casca: a navegação continua disponível",
      "Cada estado com causa em linguagem simples e uma ação de saída",
      "Estado linkável (?estado=) para testar",
    ],
    adapt: [
      "Use os mesmos estados em qualquer produto; troque textos e destinos das ações",
    ],
    avoid: [
      "Tela de erro sem caminho de volta",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

type Kind = "404" | "500" | "403" | "offline" | "manutencao";
const kinds: { value: Kind; label: string }[] = [
  { value: "404", label: "404" },
  { value: "500", label: "500" },
  { value: "403", label: "403" },
  { value: "offline", label: "Offline" },
  { value: "manutencao", label: "Manutenção" },
];
const errorDetails = "GET /api/pedidos/4821 → 502 Bad Gateway\nrequest-id: 7f3a-91c2-4be0\n2026-09-30T18:42:11-03:00";

/* ------------------------------------------------------------------ */

export default function ErrorPagesBlock() {
  // Estado na URL (?estado=500): dá para linkar direto para cada tela de erro.
  const query = useFrameQuery();
  const kind = (kinds.find((k) => k.value === query.get("estado"))?.value ?? "404") as Kind;
  const setKind = (k: Kind) => setFrameQuery({ estado: k });
  const back = (
    <Button size="sm" variant="ghost" onClick={() => history.back()}>
      <ArrowLeft /> Voltar
    </Button>
  );
  const home = (
    <Button size="sm" href={atlasRoutes.home}>
      <Home /> Ir para o início
    </Button>
  );
  return (
    <AtlasShell current={atlasRoutes.status} banner={kind === "offline" ? <Banner tone="warn" title="Sem conexão.">Tentando reconectar a cada 10 segundos.</Banner> : undefined}>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-2.5">
        <span className="text-[12px] text-muted">Pré-visualizar estado</span>
        <SegmentedControl label="Estado" value={kind} onChange={setKind} options={kinds} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto" data-ds-content="">
        {kind === "404" && <NotFoundState size="page" title="Não encontramos o pedido #4821" description="Ele pode ter sido excluído ou o link está incompleto. Busque pelo número na busca geral." action={home} secondaryAction={back} />}
        {kind === "500" && (
          <ErrorState
            size="page"
            onRetry={() => notify("Recarregando…", undefined, "info")}
            details={errorDetails}
            secondaryAction={
              <Button size="sm" variant="ghost" href="mailto:suporte@atlas.app">
                <LifeBuoy /> Falar com o suporte
              </Button>
            }
          />
        )}
        {kind === "403" && (
          <ForbiddenState
            size="page"
            title="Você não tem acesso ao Financeiro"
            description="Quem administra o Financeiro é Elisa Monteiro. Peça acesso e avisamos quando for liberado."
            action={<Button size="sm" onClick={() => notify("Pedido de acesso enviado para Elisa Monteiro")}>Pedir acesso</Button>}
            secondaryAction={back}
          />
        )}
        {kind === "offline" && (
          <OfflineState
            size="page"
            action={
              <Button size="sm" variant="ghost" onClick={() => notify("Ainda sem conexão", undefined, "bad")}>
                <RotateCw /> Tentar agora
              </Button>
            }
          />
        )}
        {kind === "manutencao" && <MaintenanceState size="page" until="14h (horário de Brasília)" action={<Button size="sm" variant="ghost" onClick={() => window.open("https://status.atlas.app", "_blank", "noopener")}>Ver página de status</Button>} />}
      </div>
    </AtlasShell>
  );
}
