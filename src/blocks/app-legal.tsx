import { useEffect, type ReactNode } from "react";
import { Callout, SectionNav, Tabs, formatDate, type NavSection, type NavSubItem } from "@g4ai/ds";
import { org } from "./data/workspace";
import { authRoutes } from "./shells/auth-shell";
import { frameHref, goTo, useFrameParam } from "./shells/frame-route";
import { SiteShell } from "./shells/site-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Termos e privacidade",
  description: "Página legal pública com Termos de uso e Política de privacidade: alternância entre os dois documentos, SectionNav com as seções, data de vigência e saídas para exportar dados e falar com o encarregado.",
  category: "Aplicação",
  order: 40,
  height: 900,
  concept: {
    goal: "Deixar termos e privacidade legíveis e fáceis de citar, para quem vai criar conta ou precisa responder a uma dúvida jurídica.",
    patterns: [
      "Anatomia I · Público: cabeçalho do site fixo, o documento rola, sem casca de app",
      "Dois documentos irmãos em abas; cada seção tem endereço próprio (?p=termos/pagamento) para citar e compartilhar",
      "SectionNav fixo na lateral no desktop; no celular vem antes do texto",
      "Data de vigência no topo e resumo em linguagem simples antes do texto formal",
    ],
    adapt: ["Política de cookies, SLA, contrato de processamento de dados (DPA), código de conduta"],
    avoid: ["PDF como única versão", "Texto sem data de vigência", "Link de Termos que leva à home"],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Conteúdo de exemplo (troque pelo texto aprovado pelo jurídico)      */
/* ------------------------------------------------------------------ */

type Doc = "termos" | "privacidade";
type Section = { id: string; title: string; body: ReactNode };

const effective = new Date(2026, 7, 1);
const p = (t: ReactNode) => <p className="m-0">{t}</p>;

const docs: Record<Doc, { title: string; summary: string; sections: Section[] }> = {
  termos: {
    title: "Termos de uso",
    summary: `Você é dono dos seus dados; nós cuidamos do serviço. A assinatura renova sozinha e pode ser cancelada a qualquer momento, com acesso até o fim do ciclo pago.`,
    sections: [
      { id: "aceitacao", title: "Aceitação", body: p(`Ao criar uma conta ou usar o ${org.product}, você concorda com estes termos em nome próprio ou da empresa que representa. Se não concordar, não use o serviço.`) },
      { id: "conta", title: "Conta e acesso", body: p("Cada pessoa usa o próprio login. Você é responsável por manter a senha em sigilo, ativar a verificação em duas etapas quando exigida e avisar o suporte se suspeitar de acesso indevido.") },
      { id: "uso", title: "Uso permitido", body: p("Não use o serviço para enviar spam, armazenar conteúdo ilegal, tentar acessar dados de outros clientes ou sobrecarregar a infraestrutura de propósito. Contas que violarem esta seção podem ser suspensas.") },
      { id: "pagamento", title: "Planos e pagamento", body: p("Os preços por licença estão na página de preços. A cobrança é mensal ou anual, por cartão ou boleto. Mudanças de plano no meio do ciclo são calculadas proporcionalmente na próxima fatura.") },
      { id: "dados", title: "Seus dados", body: p("Os dados que você cadastra continuam seus. Usamos esses dados só para prestar o serviço, conforme a Política de privacidade. Você pode exportar tudo a qualquer momento em Configurações › Dados e privacidade.") },
      { id: "cancelamento", title: "Cancelamento", body: p("Você pode cancelar quando quiser em Configurações › Plano e cobrança. O acesso continua até o fim do ciclo pago; depois disso o workspace fica só leitura por 30 dias e então é excluído.") },
      { id: "responsabilidade", title: "Limitação de responsabilidade", body: p("Mantemos disponibilidade mensal de 99,9 %. Em caso de indisponibilidade acima disso, o crédito é proporcional ao tempo fora do ar, limitado ao valor pago no mês.") },
      { id: "alteracoes", title: "Alterações nestes termos", body: p("Avisamos por e-mail e no próprio produto com 30 dias de antecedência sempre que uma mudança afetar seus direitos.") },
    ],
  },
  privacidade: {
    title: "Política de privacidade",
    summary: "Coletamos o mínimo para o serviço funcionar, não vendemos dados e você pode pedir cópia ou exclusão a qualquer momento, como prevê a LGPD.",
    sections: [
      { id: "coleta", title: "O que coletamos", body: p("Dados de cadastro (nome, e-mail, empresa), dados que você insere no produto, registros de acesso (IP, navegador, data e hora) e informações de pagamento, que ficam com o provedor de pagamento.") },
      { id: "uso", title: "Como usamos", body: p("Para prestar e melhorar o serviço, dar suporte, cobrar a assinatura, prevenir fraudes e cumprir obrigações legais. Não usamos seus dados de clientes para treinar modelos de terceiros.") },
      { id: "compartilhamento", title: "Com quem compartilhamos", body: p("Só com fornecedores necessários para operar (hospedagem, e-mail, pagamento), sob contrato e com as mesmas obrigações de proteção. Nunca vendemos dados pessoais.") },
      { id: "retencao", title: "Por quanto tempo guardamos", body: p("Enquanto a conta estiver ativa e por até 30 dias após o cancelamento. Registros de auditoria ficam por 2 anos; documentos fiscais, pelo prazo exigido por lei.") },
      {
        id: "direitos",
        title: "Seus direitos (LGPD)",
        body: (
          <>
            {p("Você pode confirmar se tratamos seus dados, acessar, corrigir, pedir portabilidade, anonimização ou exclusão, e revogar consentimentos.")}
            <Callout tone="info" title="Pedir cópia ou exclusão">
              Administradores fazem isso em{" "}
              <a href={frameHref("settings-data")} className="font-medium text-ink underline underline-offset-2">
                Configurações › Dados e privacidade
              </a>
              . Demais pessoas podem escrever para o encarregado.
            </Callout>
          </>
        ),
      },
      { id: "seguranca", title: "Segurança", body: p("Criptografia em trânsito e em repouso, backups diários, acesso interno com registro e verificação em duas etapas, e testes de invasão anuais.") },
      { id: "cookies", title: "Cookies", body: p("Usamos cookies essenciais para manter a sessão e cookies de medição anônimos para entender o uso. Você pode recusar os de medição sem perder nenhuma função.") },
      {
        id: "encarregado",
        title: "Encarregado de dados",
        body: p(
          <>
            Fale com a encarregada de proteção de dados, Marina Costa, em{" "}
            <a href="mailto:privacidade@atlas.app" className="font-medium text-ink underline underline-offset-2">
              privacidade@atlas.app
            </a>
            . Respondemos em até 15 dias.
          </>,
        ),
      },
    ],
  },
};

const docOrder: Doc[] = ["termos", "privacidade"];
const navSections: NavSection[] = docOrder.map((d) => ({
  label: docs[d].title,
  href: frameHref("app-legal", { p: d }),
  items: docs[d].sections.map((s): NavSubItem => ({ href: frameHref("app-legal", { p: `${d}/${s.id}` }), match: `/${d}/${s.id}`, label: s.title })),
}));

/* ------------------------------------------------------------------ */

export default function LegalBlock() {
  const path = useFrameParam("p", "termos");
  const [docParam, sectionParam] = path.split("/");
  const doc: Doc = docParam === "privacidade" ? "privacidade" : "termos";
  const data = docs[doc];
  const sectionId = data.sections.some((s) => s.id === sectionParam) ? sectionParam : data.sections[0].id;

  // Seção no endereço: rola até ela (link compartilhado, item do SectionNav).
  useEffect(() => {
    if (!sectionParam) return;
    const t = setTimeout(() => document.getElementById(`${doc}-${sectionParam}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    return () => clearTimeout(t);
  }, [doc, sectionParam]);

  return (
    <SiteShell current="legal">
      <div className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8 sm:py-14">
        <p className="m-0 text-[12px] font-medium uppercase tracking-[0.1em] text-muted">Legal</p>
        <h1 className="m-0 mt-2 text-[30px] font-semibold tracking-[-0.03em]">{data.title}</h1>
        <p className="m-0 mt-2 text-[13.5px] text-muted">Em vigor desde {formatDate(effective)}</p>
        <Tabs
          label="Documento"
          className="mt-6 border-b border-line"
          value={doc}
          onChange={(v) => goTo(frameHref("app-legal", { p: v }))}
          items={docOrder.map((d) => ({ id: d, label: docs[d].title }))}
        />

        <div className="mt-8 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
          <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100dvh-8rem)] lg:self-start lg:overflow-y-auto">
            <SectionNav sections={navSections} currentPath={`/${doc}/${sectionId}`} label="Seções" />
          </aside>

          <article className="min-w-0 max-w-[720px]">
            <div className="rounded-xl border border-line bg-soft/60 p-4 text-[14px] leading-relaxed text-ink-soft">
              <p className="m-0 mb-1 text-[12px] font-medium text-muted">Resumo em linguagem simples</p>
              {data.summary}
            </div>
            <ol className="m-0 mt-8 list-none space-y-8 p-0">
              {data.sections.map((s, i) => (
                <li key={s.id} id={`${doc}-${s.id}`} className="scroll-mt-24">
                  <h2 className="m-0 text-[18px] font-semibold tracking-[-0.01em]">
                    <a href={frameHref("app-legal", { p: `${doc}/${s.id}` })} className="hover:underline">
                      {i + 1}. {s.title}
                    </a>
                  </h2>
                  <div className="mt-2 space-y-3 text-[14px] leading-relaxed text-ink-soft">{s.body}</div>
                </li>
              ))}
            </ol>
            <p className="m-0 mt-12 border-t border-line pt-6 text-[13px] text-muted">
              {doc === "termos" ? (
                <>
                  Veja também a <a href={authRoutes.privacy} className="font-medium text-ink underline underline-offset-2">Política de privacidade</a>.
                </>
              ) : (
                <>
                  Veja também os <a href={authRoutes.terms} className="font-medium text-ink underline underline-offset-2">Termos de uso</a>.
                </>
              )}{" "}
              Dúvidas: <a href="mailto:juridico@atlas.app" className="font-medium text-ink underline underline-offset-2">juridico@atlas.app</a>
            </p>
          </article>
        </div>
      </div>
    </SiteShell>
  );
}
