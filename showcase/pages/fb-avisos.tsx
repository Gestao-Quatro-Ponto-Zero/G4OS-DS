import { Bell, Inbox, MessageSquare } from "lucide-react";
import { useState } from "react";
import { AlertCard, Banner, Button, Callout, CountBadge, InlineMessage, NotificationDot } from "@g4os/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Banners e alertas",
  group: "Feedback e estados",
  order: 30,
  description: "Avisos que ficam na tela até serem resolvidos: faixa de página (Banner), aviso no conteúdo (Callout), lista de problemas (AlertCard), status em linha (InlineMessage) e contadores.",
};

export default function Page() {
  const [shown, setShown] = useState(true);
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Qual usar" rule="Escolha pelo alcance do aviso, não pela gravidade.">
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-line bg-soft/60 text-[12px] text-muted">
              <tr>
                <th className="px-4 py-2.5">Componente</th>
                <th className="px-4 py-2.5">Alcance</th>
                <th className="px-4 py-2.5">Exemplo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[
                ["Banner", "App ou página inteira", "Fatura em atraso; período de teste acaba em 3 dias; novidade de produto"],
                ["Callout", "Uma seção do conteúdo", "Integração desconectada, acima da lista que depende dela"],
                ["AlertCard", "Vários itens com ação cada", "Importação com 4 linhas inválidas; checklist de pendências"],
                ["InlineMessage", "Um campo, botão ou linha", "“Salvo há 2 min”, “Sincronizando…”, “E-mail já cadastrado”"],
                ["Toast (notify)", "Ação que acabou de terminar", "“Negócio movido para Proposta” + Desfazer"],
              ].map(([a, b, c]) => (
                <tr key={a}>
                  <td className="px-4 py-2.5 font-medium">{a}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{b}</td>
                  <td className="px-4 py-2.5 text-muted">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection title="Banner" rule="Faixa no topo do app ou da página. Uma por vez. `accent` (navy) é para novidade de produto; os outros tons para estado da conta. Só é dispensável se não for bloqueante.">
        <Demo
          bare
          code={`<Banner tone="warn" title="Sua fatura de setembro está em aberto." action={<a href="/cobranca">Pagar agora</a>}>
  O acesso será limitado em 5 dias.
</Banner>
<Banner tone="accent" title="Novo: previsão de receita." action={<a href="/novidades">Conhecer</a>} onDismiss={fechar}>
  Veja o forecast do trimestre direto no pipeline.
</Banner>`}
        >
          <div className="space-y-2 overflow-hidden rounded-xl border border-line bg-surface [&>div]:rounded-none">
            {shown && (
              <Banner tone="accent" title="Novo: previsão de receita." action={<a href="#">Conhecer</a>} onDismiss={() => setShown(false)}>
                Veja o forecast do trimestre direto no pipeline.
              </Banner>
            )}
            <Banner tone="info" title="Manutenção programada no sábado, 04/10, das 22h às 23h." />
            <Banner tone="warn" title="Sua fatura de setembro está em aberto." action={<a href="#">Pagar agora</a>}>
              O acesso será limitado em 5 dias.
            </Banner>
            <Banner tone="bad" title="Não conseguimos sincronizar com o ERP." action={<button type="button">Ver detalhes</button>}>
              Pedidos criados depois das 14h podem não aparecer.
            </Banner>
            <Banner tone="ok" title="Domínio verificado." onDismiss={() => undefined}>
              E-mails agora saem de vendas@suaempresa.com.br.
            </Banner>
            {!shown && (
              <div className="px-4 py-3">
                <Button size="sm" variant="ghost" onClick={() => setShown(true)}>
                  Mostrar banner dispensado
                </Button>
              </div>
            )}
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Callout" rule="Aviso fixo dentro do conteúdo, perto do que ele afeta. Já existia no DS; continua sendo a escolha para uma frase + ação.">
        <Demo className="block space-y-3" code={`<Callout tone="warn" title="Integração com Google desconectada" action={<Button size="sm" variant="ghost">Reconectar</Button>}>…</Callout>`}>
          <Callout tone="warn" title="Integração com Google Agenda desconectada" action={<Button size="sm" variant="ghost">Reconectar</Button>}>
            Reuniões novas não entram automaticamente na linha do tempo dos contatos.
          </Callout>
          <Callout tone="info">Os valores estão em reais, sem impostos.</Callout>
        </Demo>
      </DocSection>

      <DocSection title="AlertCard" rule="Quando há uma lista de problemas e cada um tem solução própria. O rodapé leva as ações do conjunto.">
        <Demo
          className="block"
          code={`<AlertCard
  tone="warn"
  title="4 linhas não foram importadas"
  description="Corrija e reenvie só estas linhas; as outras 1.200 já estão no CRM."
  items={[{ id: "12", label: "Linha 12 · e-mail inválido", action: <button>Corrigir</button> }, …]}
  actions={<><Button variant="ghost" size="sm">Baixar CSV</Button><Button size="sm">Revisar tudo</Button></>}
/>`}
        >
          <AlertCard
            tone="warn"
            title="4 linhas não foram importadas"
            description="Corrija e reenvie só estas linhas; as outras 1.200 já estão no CRM."
            items={[
              { id: "12", label: "Linha 12 · Rafael Moura", hint: "E-mail inválido: rafael@@acme.com", action: <button type="button" className="font-medium text-blue hover:underline">Corrigir</button> },
              { id: "88", label: "Linha 88 · Júlia Prado", hint: "CNPJ com 13 dígitos", action: <button type="button" className="font-medium text-blue hover:underline">Corrigir</button> },
              { id: "301", label: "Linha 301 · Pedro Sá", hint: "Estágio “Negociaçao” não existe", action: <button type="button" className="font-medium text-blue hover:underline">Mapear</button> },
              { id: "940", label: "Linha 940 · Ana Lima", hint: "Duplicado da linha 12", action: <button type="button" className="font-medium text-blue hover:underline">Ignorar</button> },
            ]}
            actions={
              <>
                <Button size="sm" variant="ghost">Baixar CSV com erros</Button>
                <Button size="sm">Revisar tudo</Button>
              </>
            }
          />
          <AlertCard tone="ok" className="mt-3" title="Conta pronta para faturar" description="CNPJ validado, certificado digital instalado e série de NF-e configurada." onDismiss={() => undefined} />
        </Demo>
      </DocSection>

      <DocSection title="InlineMessage" rule="Status curto em linha, colado ao que descreve. `busy` troca o ícone por spinner.">
        <Demo code={`<InlineMessage tone="ok">Salvo há 2 min</InlineMessage>
<InlineMessage busy>Sincronizando…</InlineMessage>`}>
          <InlineMessage tone="ok">Salvo há 2 min</InlineMessage>
          <InlineMessage busy>Sincronizando…</InlineMessage>
          <InlineMessage tone="warn">3 campos obrigatórios vazios</InlineMessage>
          <InlineMessage tone="bad">E-mail já cadastrado</InlineMessage>
          <InlineMessage tone="info">Visível só para a sua equipe</InlineMessage>
          <InlineMessage>Última edição por Carla</InlineMessage>
        </Demo>
      </DocSection>

      <DocSection title="Contadores e ponto de notificação" rule="Contador só para o que pede ação (não lidas, pendências), nunca para total. Acima de 99 vira “99+”.">
        <Demo code={`<CountBadge count={3} />
<CountBadge count={128} tone="ink" />
<span className="relative"><Bell /><NotificationDot pulse /></span>`}>
          <span className="inline-flex items-center gap-2 text-[13px]"><Inbox className="h-4 w-4 text-muted" /> Caixa de entrada <CountBadge count={3} /></span>
          <span className="inline-flex items-center gap-2 text-[13px]"><MessageSquare className="h-4 w-4 text-muted" /> Menções <CountBadge count={128} tone="ink" /></span>
          <span className="inline-flex items-center gap-2 text-[13px]">Faturas vencidas <CountBadge count={2} tone="bad" /></span>
          <span className="inline-flex items-center gap-2 text-[13px]">Novidades <CountBadge count={1} tone="accent" /></span>
          <button type="button" aria-label="Notificações (3 não lidas)" className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-soft">
            <Bell className="h-4 w-4" />
            <NotificationDot pulse />
          </button>
        </Demo>
        <PropsTable
          rows={[
            ["Banner.tone", '"info" | "warn" | "bad" | "ok" | "accent"', '"info"', "accent = novidade (fundo navy)."],
            ["Banner.onDismiss", "() => void", "—", "Mostra o X. Omita em avisos bloqueantes."],
            ["AlertCard.items", "{ id, label, hint?, action? }[]", "—", "Um item por problema, cada um com sua ação."],
            ["InlineMessage.busy", "boolean", "false", "Spinner no lugar do ícone."],
            ["CountBadge.tone", '"neutral" | "ink" | "bad" | "accent"', '"neutral"', "bad só para o que exige ação imediata."],
          ]}
        />
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Um banner por vez; o mais grave ganha.", dont: "Empilhar três faixas coloridas no topo do app." },
            { do: "Ação no próprio aviso (“Pagar agora”, “Reconectar”).", dont: "Aviso que manda a pessoa procurar a solução em outro lugar." },
            { do: "Cor sempre com ícone e texto.", dont: "Só uma borda vermelha para indicar erro." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
