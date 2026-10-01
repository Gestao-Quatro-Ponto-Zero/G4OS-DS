import { useState } from "react";
import { Button, CitationChip, LimitDialog, RateLimitNotice, SourceList, SystemMessage, TokenUsageMeter } from "@g4os/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { sources } from "./_ia-data";

export const meta: PageMeta = {
  title: "Avisos, limites e fontes",
  group: "IA e interação",
  order: 30,
  description: "SystemMessage para avisos do sistema dentro da conversa, RateLimitNotice e LimitDialog para limites de uso, TokenUsageMeter para consumo, CitationChip e SourceList para fontes.",
};

export default function Page() {
  const [limit, setLimit] = useState(false);
  return (
    <DocPage title={meta.title} kicker={meta.group} description={meta.description}>
      <DocSection title="SystemMessage" rule="Não é fala do assistente: é o sistema explicando algo (contexto trocado, ferramenta fora do ar, resposta cortada). Quatro tons, ação opcional.">
        <Demo
          className="block space-y-2"
          code={`<SystemMessage tone="warn" title="ERP fora do ar" action={<Button size="sm" variant="ghost">Tentar de novo</Button>}>
  Respondi sem os dados de faturas.
</SystemMessage>`}
        >
          <SystemMessage tone="info">Contexto alterado para o negócio Grupo Aurora · Licenças anuais.</SystemMessage>
          <SystemMessage tone="warn" title="ERP fora do ar" action={<Button size="sm" variant="ghost">Tentar de novo</Button>}>
            Respondi sem os dados de faturas. O valor em aberto pode estar desatualizado.
          </SystemMessage>
          <SystemMessage tone="error" title="Resposta interrompida" onDismiss={() => undefined}>
            A conexão caiu no meio da resposta. O texto acima está incompleto.
          </SystemMessage>
          <SystemMessage tone="success">E-mail enviado para renata.farias@aurora.com.br e registrado no negócio.</SystemMessage>
        </Demo>
      </DocSection>
      <DocSection title="Limites de uso" rule="Diga o motivo, quanto falta e qual a saída. Inline para limite curto (segundos/minutos); diálogo quando a ação pedida não pode continuar.">
        <Demo className="block space-y-4" code={`<RateLimitNotice retryIn={75} onRetry={reenviar} action={<Button size="sm" variant="ghost">Ver planos</Button>} />`}>
          <RateLimitNotice retryIn={75} onRetry={() => undefined} />
          <TokenUsageMeter used={8420} limit={10000} resetsIn="em 3 dias" />
          <TokenUsageMeter used={10000} limit={10000} label="Créditos do time" resetsIn="em 1º de outubro" />
        </Demo>
        <Demo code={`<LimitDialog open={aberto} onClose={fechar} retryIn={42} usage={{ used: 500, limit: 500, unit: "solicitações/hora" }} onUpgrade={verPlanos} onRetry={reenviar} />`}>
          <Button onClick={() => setLimit(true)}>Simular limite atingido</Button>
          <LimitDialog open={limit} onClose={() => setLimit(false)} retryIn={42} usage={{ used: 500, limit: 500, unit: "solicitações por hora" }} onUpgrade={() => setLimit(false)} onRetry={() => undefined} />
        </Demo>
        <PropsTable
          rows={[
            ["retryIn", "number (s)", "—", "Tempo até liberar. Vira contagem MM:SS."],
            ["onRetry", "fn", "—", "Habilitado quando a contagem chega a zero."],
            ["onUpgrade · upgradeLabel", "fn · string", "“Ver planos”", "Saída comercial (LimitDialog)."],
            ["usage", "{ used, limit, unit }", "—", "Mostra o consumo que causou o limite."],
          ]}
        />
      </DocSection>
      <DocSection title="Fontes e citações" rule="Número no texto (CitationChip) e lista no fim (SourceList) com a mesma numeração. Registros internos abrem o registro; web abre em nova aba.">
        <Demo className="block space-y-4" code={`<p>… proposta de R$ 460,8 mil <CitationChip index={1} source={fontes[0]} /></p>\n<SourceList sources={fontes} />`}>
          <p className="m-0 text-[13.5px] leading-relaxed">
            A proposta está em R$ 460,8 mil para 240 usuários
            <CitationChip index={1} source={sources[0]} /> com implantação em 60 dias
            <CitationChip index={2} source={sources[1]} />. O win rate do segmento é 27 %
            <CitationChip index={3} source={sources[2]} />.
          </p>
          <SourceList sources={sources} />
          <SourceList sources={sources} compact title="Fontes (compacto)" />
        </Demo>
      </DocSection>
      <DocSection title="Regras">
        <Rules items={[{ do: "“Libera em 01:15” + saída clara.", dont: "“Erro 429” ou “Too many requests”." }, { do: "Fonte clicável para todo número vindo de dado.", dont: "Citação decorativa que não abre nada." }]} />
      </DocSection>
    </DocPage>
  );
}
