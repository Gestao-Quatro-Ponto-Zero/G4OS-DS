import { Prose } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Tipografia de texto longo",
  group: "Ações e exibição",
  order: 32,
  description: "Prose aplica a escala do DS a texto corrido: markdown renderizado, termos de uso, artigos de ajuda, notas e respostas de IA. Na interface, use os utilitários de texto (text-body, text-section, text-title…).",
};

export default function Page() {
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Prose" rule="Envolva HTML que você não estiliza elemento a elemento (markdown, editor rico, CMS). Largura de leitura de 68 caracteres; wide remove o limite.">
        <Demo
          code={`<Prose>
  <h2>Política de reembolso</h2>
  <p>Pedidos cancelados em até <strong>7 dias</strong> são reembolsados integralmente…</p>
  <ul><li>…</li></ul>
  <blockquote>…</blockquote>
</Prose>

// markdown já convertido em HTML (sanitize antes!)
<Prose><div dangerouslySetInnerHTML={{ __html: html }} /></Prose>`}
        >
          <Prose>
            <h2>Política de reembolso</h2>
            <p>
              Pedidos cancelados em até <strong>7 dias</strong> após a compra são reembolsados integralmente na mesma forma de pagamento. Depois desse prazo, o valor proporcional ao período não utilizado vira crédito na próxima fatura.
            </p>
            <h3>Como pedir</h3>
            <ol>
              <li>
                Abra <a href="#/p/estrutura-tipografia">Configurações › Plano e uso</a>.
              </li>
              <li>Escolha a assinatura e clique em Cancelar.</li>
              <li>Confirme o motivo; o reembolso aparece em até 10 dias úteis.</li>
            </ol>
            <blockquote>Contratos anuais com desconto seguem a cláusula 8 do contrato assinado.</blockquote>
            <p>
              Integrações usam a chave <code>billing.refund_window_days</code>, com padrão de 7.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Plano</th>
                  <th>Prazo</th>
                  <th>Forma</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Mensal</td>
                  <td>7 dias</td>
                  <td>Mesma forma de pagamento</td>
                </tr>
                <tr>
                  <td>Anual</td>
                  <td>30 dias</td>
                  <td>Crédito ou estorno</td>
                </tr>
              </tbody>
            </table>
            <hr />
            <p>Última atualização em 1º de outubro de 2026.</p>
          </Prose>
        </Demo>
      </DocSection>

      <DocSection title="Escala da interface" rule="Fora de texto longo, não use Prose: aplique o utilitário de tamanho que tem o papel certo.">
        <div className="overflow-hidden rounded-xl border border-line">
          {[
            ["text-title", "25 px", "Título da página"],
            ["text-section", "18 px", "Título de seção"],
            ["text-value", "15 px", "Valor em destaque"],
            ["text-input", "14 px", "Texto digitado"],
            ["text-body", "13.5 px", "Texto de leitura da interface"],
            ["text-control", "13 px", "Botões e controles"],
            ["text-label", "12.5 px", "Rótulos e descrições"],
            ["text-caption", "12 px", "Legendas e metadados"],
            ["text-meta", "11 px", "Meta densa"],
          ].map(([cls, px, use]) => (
            <div key={cls} className="flex items-baseline gap-4 border-b border-line px-4 py-2.5 last:border-0">
              <code className="w-28 shrink-0 font-mono text-[12px] text-muted">{cls}</code>
              <span className="w-16 shrink-0 text-[12px] tabular-nums text-muted">{px}</span>
              <span className={cls}>{use}</span>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Sanitize HTML vindo de usuário ou de IA antes de renderizar dentro de Prose.", dont: "Prose em volta de telas inteiras, formulários ou tabelas de dados." },
            { do: "Títulos do conteúdo em h2/h3 (o h1 é o título da página).", dont: "Sobrescrever a escala com tamanhos fora da lista." },
          ]}
        />
      </DocSection>

      <DocSection title="Props">
        <PropsTable
          rows={[
            ["children", "ReactNode", "—", "HTML de texto: h1–h3, p, listas, a, strong, blockquote, code, pre, hr, img, table."],
            ["wide", "boolean", "false", "Sem limite de 68 caracteres."],
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
