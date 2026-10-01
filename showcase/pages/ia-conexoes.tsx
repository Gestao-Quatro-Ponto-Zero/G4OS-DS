import { useState } from "react";
import { Box, GitBranch, Globe, Hash, Mail, Megaphone, Package, ShoppingBag, Sparkles, Target, Wand2 } from "lucide-react";
import {
  AccountRow,
  AppGrid,
  AppIcon,
  AppTile,
  ConnectionStatus,
  ConnectionsCard,
  DataSyncTable,
  HalftoneBand,
  MarketplaceHero,
  QuickActionsField,
  SidebarProgressCard,
  ToolPermissionList,
  TrialBanner,
  notify,
  type ToolPermission,
} from "@g4os/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Conexões e apps",
  group: "IA e interação",
  order: 40,
  description: "Marketplace de integrações, detalhe da conexão com permissões por conta e o cartão do agente (o que ele acessa, quem ele aciona, o que entrega).",
};

// ds-audit-ignore-start hex-color: cores de marca nos dados de exemplo
const demoApps = [
  { id: "slack", name: "Slack", description: "Resumir canais, responder e avisar o time.", icon: Hash, color: "#7c3aed" },
  { id: "github", name: "GitHub", description: "Issues, pull requests e revisões de código.", icon: GitBranch, color: "var(--ds-ink)" },
  { id: "gmail", name: "Gmail", description: "Ler, rascunhar e organizar e-mails.", icon: Mail, color: "#d93025" },
  { id: "shopify", name: "Shopify", description: "Loja, produtos, coleções e pedidos.", icon: ShoppingBag, color: "#5e8e3e" },
];
// ds-audit-ignore-end

const seedPerms: ToolPermission[] = [
  { id: "r1", title: "Ler produtos e pedidos", description: "Consulta catálogo, estoque e pedidos para análises.", scope: "read", enabled: true },
  { id: "w1", title: "Publicar imagens tratadas", description: "Adiciona as imagens melhoradas pela IA à galeria do produto.", scope: "write", enabled: true },
  { id: "w2", title: "Editar o tema da loja", description: "Lê e altera o tema da vitrine (textos, banners).", scope: "write", enabled: false },
];

export default function Page() {
  const [connected, setConnected] = useState<Record<string, boolean>>({ slack: true, gmail: true });
  const [perms, setPerms] = useState(seedPerms);
  const [shopify, setShopify] = useState(false);
  return (
    <DocPage title={meta.title} kicker="IA e interação" description={meta.description}>
      <DocSection title="Marketplace" rule="Faixa de exemplos (o que dá para pedir), busca, categorias e grade de apps. Conectado = check discreto; disponível = botão quadrado “+”. O nome leva ao detalhe.">
        <Demo
          bare
          code={`<HalftoneBand />
<MarketplaceHero prompts={[{ app: slack, text: "Resumir as atualizações das conversas recentes", onClick }]} />
<AppGrid>
  {apps.map((a) => (
    <AppTile key={a.id} app={a} connected={connected[a.id]} href={\`/apps/\${a.id}\`} onConnect={() => connect(a.id)} />
  ))}
</AppGrid>`}
        >
          <div className="relative overflow-hidden rounded-2xl border border-line bg-page p-5">
            <HalftoneBand className="absolute inset-x-0 top-0" height={80} />
            <p className="relative m-0 pt-4 text-center text-[18px] font-medium">Conecte as ferramentas que seu time já usa</p>
            <MarketplaceHero
              className="mt-4"
              height={150}
              prompts={[
                { app: demoApps[0], text: "Resumir as atualizações das conversas recentes", onClick: () => notify("Abriria uma conversa com esse pedido", undefined, "info") },
                { app: demoApps[1], text: "Revisar issues e PRs abertos" },
                { app: demoApps[2], text: "Rascunhar respostas para os e-mails atrasados" },
              ]}
            />
            <AppGrid className="mt-4">
              {demoApps.map((a) => (
                <AppTile
                  key={a.id}
                  app={a}
                  connected={connected[a.id]}
                  onOpen={() => notify(`Abriria o detalhe do ${a.name}`, undefined, "info")}
                  onConnect={() => {
                    setConnected((c) => ({ ...c, [a.id]: true }));
                    notify(`${a.name} conectado`, () => setConnected((c) => ({ ...c, [a.id]: false })));
                  }}
                  badge={a.id === "shopify" ? <span className="text-[11.5px] font-medium text-rose">Novo</span> : undefined}
                />
              ))}
            </AppGrid>
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["AppIcon", "icon | letter, color, size xs–xl, variant tile | soft | plain", "tile, md", "Ícone de app. color aceita token ou cor de marca; marcas pretas usam var(--ds-ink)."],
            ["AppTile", "app, connected?, href? | onOpen?, onConnect?, badge?", "—", "Linha do marketplace com link esticado e ação à direita."],
            ["MarketplaceHero", "prompts[{ app, text, onClick? }], height?", "172", "Degradê de tokens (accent, info, série 2) com até 3 PromptPill."],
            ["PromptPill", "app, children, onClick?", "—", "Pílula “[App] pedido” — inicia conversa já com o pedido."],
            ["HalftoneBand", "height?", "96", "Faixa decorativa pontilhada acima de títulos (aria-hidden)."],
          ]}
        />
      </DocSection>

      <DocSection title="Detalhe da conexão" rule="Estado com palavra, o que está sincronizado (números levam à lista), contas conectadas e, dentro de cada conta, permissões separadas em leitura e escrita.">
        <Demo
          bare
          code={`<ConnectionStatus status="connected" />
<DataSyncTable rows={[{ label: "Produtos sincronizados", value: 15, icon: Package, href: "/produtos?origem=shopify" }]} />
<AccountRow name="Acme Store" url="acme-store.myshopify.com" mark={<AppIcon letter="A" color={cor} variant="soft" />}>
  <ToolPermissionList appName="Shopify" items={perms} onChange={(id, on) => …} />
</AccountRow>`}
        >
          <div className="space-y-5 rounded-2xl border border-line bg-page p-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <AppIcon icon={ShoppingBag} color={demoApps[3].color} size="lg" label="Shopify" />
              <span className="text-[18px] font-semibold">Shopify</span>
              <ConnectionStatus status="connected" />
              <ConnectionStatus status="pending" />
              <ConnectionStatus status="error" />
              <ConnectionStatus status="disconnected" />
            </div>
            <DataSyncTable
              rows={[
                { label: "Produtos sincronizados", value: "15", icon: Package, onClick: () => notify("Abriria os 15 produtos", undefined, "info") },
                { label: "Coleções sincronizadas", value: "12", icon: Box, onClick: () => notify("Abriria as 12 coleções", undefined, "info") },
              ]}
            />
            <div className="overflow-hidden rounded-xl border border-line bg-surface">
              <AccountRow name="Acme Store" url="acme-store.myshopify.com" defaultOpen meta={`${perms.filter((p) => p.enabled).length} de ${perms.length} permissões`} mark={<AppIcon letter="A" color={demoApps[3].color} size="sm" variant="soft" />}>
                <ToolPermissionList
                  appName="Shopify"
                  items={perms}
                  onChange={(id, v) => {
                    const before = perms;
                    setPerms((list) => list.map((p) => (p.id === id ? { ...p, enabled: v } : p)));
                    notify(v ? "Permissão concedida" : "Permissão revogada", () => setPerms(before));
                  }}
                />
              </AccountRow>
            </div>
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["ConnectionStatus", '"connected" | "pending" | "error" | "disconnected"', "—", "Selo com palavra (Conectado, Aguardando autorização…)."],
            ["DataSyncTable", "rows[{ label, value, icon?, href? | onClick?, hint? }]", "—", "Chave/valor; valor sublinhado leva à lista filtrada."],
            ["AccountRow", "name, url?, mark?, meta?, children?, defaultOpen?, actions?", "—", "Conta conectada; children = conteúdo expansível (permissões)."],
            ["ToolPermissionList", "items[{ id, title, description, scope: read | write, enabled }], onChange, appName?", "—", "Agrupa Leitura e Escrita; escrita marcada “altera dados”."],
          ]}
        />
      </DocSection>

      <DocSection title="Cartão do agente" rule="Três perguntas num cartão: o que ele acessa (conexões), quem ele aciona (subagentes, com estado ao vivo) e o que ele entrega (resultados).">
        <Demo
          bare
          code={`<ConnectionsCard
  name="Williams" scope="Global" avatar={<AppIcon icon={Sparkles} color="var(--ds-accent)" variant="soft" />}
  connections={[{ id: "meta", name: "Meta Ads", icon: Infinity, color, status: "connected" }, { id: "shop", name: "Shopify", status: "available", onConnect }]}
  subagents={[{ id: "brand", name: "Pesquisa de marca", status: "running" }]}
  results={[{ id: "doc", name: "Relatório semanal", fileName: "relatorio.docx" }]}
/>`}
        >
          <div className="grid gap-6 rounded-2xl border border-line bg-page p-5 md:grid-cols-[380px_minmax(0,1fr)]">
            <ConnectionsCard
              name="Williams"
              scope="Global"
              avatar={<AppIcon icon={Sparkles} color="var(--ds-accent)" variant="soft" />}
              connections={[
                { id: "meta", name: "Meta Ads", icon: Megaphone, color: "var(--ds-info)", status: "connected" },
                { id: "site", name: "acme.com.br", icon: Globe, color: "var(--ds-accent)", status: "active" },
                {
                  id: "shop",
                  name: "Shopify",
                  icon: ShoppingBag,
                  color: demoApps[3].color,
                  status: shopify ? "connected" : "available",
                  onConnect: () => {
                    setShopify(true);
                    notify("Shopify liberado para o Williams", () => setShopify(false));
                  },
                },
              ]}
              subagents={[
                { id: "brand", name: "Pesquisa de marca", icon: Target, color: "var(--ds-amber)", status: "running" },
                { id: "creative", name: "Arquiteto de criativos", icon: Wand2, color: "var(--ds-rose)", status: "done" },
              ]}
              results={[
                { id: "doc", name: "Relatório semanal de mídia", fileName: "relatorio.docx", meta: "hoje" },
                { id: "pdf", name: "Plano de criativos Q4", fileName: "plano.pdf", meta: "ontem" },
              ]}
            />
            <div className="min-w-0 space-y-3 text-[13px] leading-relaxed text-ink-soft">
              <p className="m-0">
                <strong className="text-ink">Conexões:</strong> check verde = acesso liberado; linha tingida = em uso agora; “Conectar” = disponível mas ainda não autorizado para este agente.
              </p>
              <p className="m-0">
                <strong className="text-ink">Subagentes:</strong> ponto âmbar pulsando = executando, verde = concluído, cinza = parado, rosa = falhou. Sempre com rótulo acessível.
              </p>
              <p className="m-0">
                <strong className="text-ink">Resultados:</strong> o que o agente entregou, com tipo de arquivo e quando.
              </p>
            </div>
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Peças de sidebar" rule="Ações rápidas (⌘K), progresso de “Primeiros passos” e o teste grátis no rodapé.">
        <Demo className="block max-w-[280px] space-y-3 bg-rail" code={`<QuickActionsField onOpen={() => setPalette(true)} />\n<SidebarProgressCard done={2} total={5} href="/primeiros-passos" />\n<TrialBanner daysLeft={14} onUpgrade={() => router.push("/assinatura")} />`}>
          <QuickActionsField onOpen={() => notify("Abriria a paleta de comandos", undefined, "info")} />
          <SidebarProgressCard done={2} total={5} onClick={() => notify("Abriria os primeiros passos", undefined, "info")} />
          <TrialBanner daysLeft={14} onUpgrade={() => notify("Abriria a assinatura", undefined, "info")} />
        </Demo>
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Mostre o que o app permite ANTES de conectar (leitura e escrita).", dont: "Pedir “acesso total” sem dizer para quê." },
            { do: "Permissão por conta: a loja principal pode ter escrita e o outlet só leitura.", dont: "Uma chave liga/desliga para o app inteiro." },
            { do: "Escrita destacada (“altera dados”) e aprovada na primeira vez de cada tipo de ação.", dont: "Escrever no app de origem sem nenhum aviso." },
            { do: "Desconectar e revogar sempre com desfazer; desconectar pede confirmação.", dont: "Ações irreversíveis escondidas num menu sem confirmação." },
            { do: "Número sincronizado leva à lista filtrada daquela origem.", dont: "Números soltos que não levam a lugar nenhum." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
