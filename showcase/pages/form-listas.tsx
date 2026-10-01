import { CalendarCheck, FlaskConical, Home, LogOut, Users } from "lucide-react";
import { useState } from "react";
import { Button, Checkbox, CheckboxGroup, Combobox, DatePicker, FieldBlock, MultiSelect, NativeSelect, Select, Sidebar, ToggleGroup } from "@g4ai/ds";
import { Demo, DocPage, DocSection, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Listas e seleção múltipla",
  group: "Formulários",
  order: 12,
  description: "Select, Combobox, MultiSelect, CheckboxGroup e NativeSelect: qual usar, rótulo visível, estados (desabilitado com motivo, erro, vazio) e o comportamento no celular.",
};

const cargos = [
  { value: "exec", label: "Executivo de Vendas" },
  { value: "sdr", label: "SDR" },
  { value: "coord", label: "Coordenador Comercial", description: "Informa o forecast de toda a hierarquia" },
  { value: "gerente", label: "Gerente Comercial", description: "Informa o forecast de toda a hierarquia" },
  { value: "cs", label: "Customer Success", disabledReason: "Sem pessoas ativas" },
];

const pessoas = [
  "Amanda Buonacorsi", "Ana Matias", "Ana Moraes", "Anna Batista", "Anna Lua", "Anne Matos", "Arthur Godinho", "Beatriz Fonseca",
  "Beatriz Resende", "Benício Borges", "Breno Soares", "Brunna Arraes", "Caio Prado", "Camila Duarte", "Carla Nunes", "Diego Torres",
].map((n) => ({ value: n.toLowerCase().replace(/\s+/g, "-"), label: n }));

const equipes = [
  { value: "sp", label: "Squad Paulista", group: "Sudeste" },
  { value: "rj", label: "Squad Carioca", group: "Sudeste" },
  { value: "mg", label: "Squad Mineiro", group: "Sudeste" },
  { value: "poa", label: "Squad Gaúcho", group: "Sul" },
  { value: "cwb", label: "Squad Curitiba", group: "Sul" },
  { value: "rec", label: "Squad Recife", group: "Nordeste" },
  { value: "ssa", label: "Squad Salvador", group: "Nordeste", disabledReason: "Em implantação" },
  { value: "for", label: "Squad Fortaleza", group: "Nordeste" },
];

const dias = [
  { value: "1", label: "Seg" },
  { value: "2", label: "Ter" },
  { value: "3", label: "Qua" },
  { value: "4", label: "Qui" },
  { value: "5", label: "Sex" },
  { value: "6", label: "Sáb" },
  { value: "0", label: "Dom" },
];

export default function Page() {
  const [status, setStatus] = useState("aberto");
  const [pessoa, setPessoa] = useState("");
  const [nativa, setNativa] = useState("");
  const [sel, setSel] = useState<string[]>(["exec", "coord", "gerente"]);
  const [times, setTimes] = useState<string[]>(["sp", "rj", "poa"]);
  const [chips, setChips] = useState<string[]>(["ana-matias", "breno-soares"]);
  const [weekdays, setWeekdays] = useState(["1", "2", "3", "4", "5"]);
  const [date, setDate] = useState("");
  const [tried, setTried] = useState(false);
  const [ok, setOk] = useState(true);

  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Qual usar" rule="Escolha pela quantidade de valores, pelo tamanho da lista e por onde a pessoa está (celular).">
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
            <thead className="bg-soft text-[12px] text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Situação</th>
                <th className="px-3 py-2 font-medium">Use</th>
                <th className="px-3 py-2 font-medium">shadcn/ui equivalente</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Um valor, lista curta e fixa (status, prioridade) com ícone/descrição", "Select", "Select"],
                ["Um valor, lista de entidades (pessoas, clientes) com busca", "Combobox", "Combobox"],
                ["Vários valores, até ~8 opções que cabem na tela", "CheckboxGroup", "Checkbox + FieldSet"],
                ["Vários valores, lista longa, grupos, busca, “Selecionar todos”", "MultiSelect", "Combobox (multiple)"],
                ["Um valor, lista longa e simples no celular, ou formulário sem JS", "NativeSelect", "Native Select"],
                ["Dias da semana, filtros rápidos, formatação", "ToggleGroup", "Toggle Group"],
                ["Data", "DatePicker / DateInput (nunca <input type=\"date\">)", "Date Picker"],
              ].map(([a, b, c]) => (
                <tr key={a} className="border-t border-line">
                  <td className="px-3 py-2 text-ink-soft">{a}</td>
                  <td className="px-3 py-2 font-medium">{b}</td>
                  <td className="px-3 py-2 text-muted">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection
        title="Rótulo visível por padrão"
        rule="Em todos os campos do DS, `label` é o rótulo visível acima e o nome acessível. Dentro de FieldBlock o rótulo é do FieldBlock (não repete). `hideLabel` só em toolbar, célula de tabela e filtro."
      >
        <Demo
          className="grid gap-x-6 gap-y-5 sm:grid-cols-2"
          code={`<Select label="Status" options={…} value={status} onValueChange={setStatus} />
<Combobox label="Vendedor" options={pessoas} value={pessoa} onValueChange={setPessoa} placeholder="Selecione um vendedor" />
<FieldBlock label="Data" hint="Vazio = hoje.">
  <DatePicker label="Data" value={date} onValueChange={setDate} placeholder="Hoje (padrão)" clearable />
</FieldBlock>
<Select size="compact" label="Fase" … />   // toolbar: rótulo só acessível`}
        >
          <Select
            label="Status"
            value={status}
            onValueChange={setStatus}
            options={[
              { value: "aberto", label: "Em aberto" },
              { value: "pago", label: "Pago" },
              { value: "vencido", label: "Vencido" },
            ]}
          />
          <Combobox label="Vendedor" options={pessoas} value={pessoa} onValueChange={setPessoa} placeholder="Selecione um vendedor" />
          <FieldBlock label="Data das vendas" hint="Vazio = hoje.">
            <DatePicker label="Data das vendas" value={date} onValueChange={setDate} placeholder="Hoje (padrão)" clearable />
          </FieldBlock>
          <div>
            <p className="m-0 mb-1.5 text-[12.5px] text-muted">Toolbar (rótulo só acessível)</p>
            <Select size="compact" label="Fase" value="exec" onValueChange={() => undefined} options={[{ value: "exec", label: "Execução" }, { value: "plan", label: "Planejamento" }]} />
          </div>
        </Demo>
      </DocSection>

      <DocSection title="CheckboxGroup" rule="Vários valores com tudo visível. Opção indisponível diz o porquê. “Selecionar todos” vira caixa tri-estado.">
        <Demo
          className="block"
          code={`<CheckboxGroup
  label="Cargos que recebem o pedido"
  hint="Gestores informam o forecast de toda a hierarquia."
  columns={2}
  selectAll
  options={[
    { value: "exec", label: "Executivo de Vendas" },
    { value: "coord", label: "Coordenador Comercial", description: "Informa a hierarquia" },
    { value: "cs", label: "Customer Success", disabledReason: "Sem pessoas ativas" },
  ]}
  value={cargos}
  onValueChange={setCargos}
/>`}
        >
          <CheckboxGroup
            label="Cargos que recebem o pedido"
            hint="Gestores selecionados informam o forecast de toda a hierarquia e não entram de novo no total dos vendedores."
            columns={2}
            selectAll
            options={cargos}
            value={sel}
            onValueChange={setSel}
          />
        </Demo>
      </DocSection>

      <DocSection title="MultiSelect" rule="Lista longa, grupos ou busca. O gatilho resume (“Ana, Bruno” ou “5 selecionados”); chips quando cada escolha precisa ficar à vista.">
        <Demo
          className="grid gap-x-6 gap-y-5 sm:grid-cols-2"
          code={`<MultiSelect label="Equipes" options={equipes /* { value, label, group?, disabledReason? } */} value={times} onValueChange={setTimes} />
<MultiSelect label="Pessoas" display="chips" max={5} options={pessoas} value={sel} onValueChange={setSel} />`}
        >
          <MultiSelect label="Equipes" options={equipes} value={times} onValueChange={setTimes} />
          <MultiSelect label="Pessoas avisadas" display="chips" max={5} options={pessoas} value={chips} onValueChange={setChips} placeholder="Escolha até 5 pessoas" />
        </Demo>
      </DocSection>

      <DocSection
        title="NativeSelect"
        rule="O seletor do sistema com a aparência do DS. Melhor no celular (roda de opções do iOS/Android) e em listas longas sem busca. Não use para status com ícone (Select) nem para entidades com busca (Combobox)."
      >
        <Demo
          className="grid gap-x-6 gap-y-5 sm:grid-cols-2"
          code={`<NativeSelect label="Pessoa" placeholder="Todas as pessoas" options={pessoas} value={pessoa} onValueChange={setPessoa} />
<NativeSelect label="Estado" options={[{ label: "Sudeste", options: [{ value: "SP", label: "São Paulo" }, …] }]} … />`}
        >
          <NativeSelect label="Pessoa" placeholder="Todas as pessoas" options={pessoas} value={nativa} onValueChange={setNativa} />
          <NativeSelect
            label="Estado"
            value="SP"
            onValueChange={() => undefined}
            disabled
            hint="Desabilitado continua legível."
            options={[
              { label: "Sudeste", options: [{ value: "SP", label: "São Paulo" }, { value: "RJ", label: "Rio de Janeiro" }] },
              { label: "Sul", options: [{ value: "PR", label: "Paraná" }] },
            ]}
          />
        </Demo>
      </DocSection>

      <DocSection title="Estados" rule="Desabilitado continua legível e, quando importa, diz por quê. Erro troca a ajuda e pinta a borda. Vazio mostra o que acontece sem valor.">
        <Demo
          className="grid gap-x-6 gap-y-5 sm:grid-cols-2"
          code={`<Select label="Origem" error={tried && !origem ? "Escolha a origem." : undefined} … />
<Checkbox label="Executivo de Vendas" checked disabled />
<ToggleGroup multiple label="Dias" disabled value={dias} … />
<Button variant="ghost" disabled disabledReason="Indisponível na demonstração">Salvar cargos</Button>`}
        >
          <Select
            label="Origem"
            value=""
            onValueChange={() => undefined}
            error={tried ? "Escolha a origem do lead." : undefined}
            hint="De onde veio o contato."
            options={[{ value: "site", label: "Site" }, { value: "indicacao", label: "Indicação" }]}
          />
          <DatePicker label="Vencimento" value="" onValueChange={() => undefined} disabled placeholder="Sem vencimento" />
          <div className="space-y-2">
            <Checkbox label="Executivo de Vendas" checked onCheckedChange={() => undefined} disabled />
            <Checkbox label="SDR" checked={false} onCheckedChange={() => undefined} disabled description="Sem pessoas ativas" />
            <Checkbox label="Coordenador Comercial" checked={ok} onCheckedChange={setOk} />
          </div>
          <div className="space-y-3">
            <ToggleGroup multiple label="Dias em que pede forecast" size="sm" value={weekdays} onChange={setWeekdays} options={dias} />
            <ToggleGroup multiple label="Dias (desabilitado)" size="sm" disabled value={weekdays} onChange={setWeekdays} options={dias} />
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => setTried(true)}>
                Validar
              </Button>
              <Button variant="ghost" size="sm" disabled disabledReason="Indisponível na demonstração: nenhuma ação grava dados.">
                Salvar cargos
              </Button>
              <Button size="sm" disabled>
                Rodar agora
              </Button>
            </div>
          </div>
        </Demo>
      </DocSection>

      <DocSection
        title="No celular"
        rule="Abaixo de 640px, Select e DatePicker abrem como folha inferior (por cima da barra inferior, com área segura); Combobox e MultiSelect ocupam a largura da tela ancorados ao campo, porque a busca sobe o teclado. presentation=&quot;popover&quot; mantém o popover."
      >
        <Demo code={`<Select presentation="auto" … />      // padrão: folha inferior < 640px
<DatePicker presentation="popover" … /> // sempre ancorado`}>
          <p className="m-0 text-[13px] text-muted">Abra o showcase em 390px (ícone de celular no topo do bloco) e toque nos campos acima.</p>
        </Demo>
      </DocSection>

      <DocSection title="Rodapé da Sidebar" rule="O rodapé (`footer`) tem o mesmo respiro da navegação; um Button ali ocupa a largura do trilho sem vazar.">
        <Demo
          bare
          code={`<Sidebar … footer={<Button variant="ghost" size="sm" onClick={logout}><LogOut /> Sair da demonstração</Button>} user={{ … }} />`}
        >
          <div className="hidden h-[460px] overflow-hidden rounded-xl border border-line md:flex">
            <Sidebar
              product="Radar de Forecast"
              currentPath="/hoje"
              groups={[
                {
                  label: "Forecast",
                  items: [
                    { label: "Hoje", href: "#/p/form-listas", match: "/hoje", icon: Home },
                    { label: "Equipe", href: "#/p/form-listas?e", match: "/equipe", icon: Users },
                    { label: "Automações", href: "#/p/form-listas?a", match: "/automacoes", icon: CalendarCheck },
                    { label: "Testes", href: "#/p/form-listas?t", match: "/testes", icon: FlaskConical },
                  ],
                },
              ]}
              footer={
                <Button variant="ghost" size="sm">
                  <LogOut /> Sair da demonstração
                </Button>
              }
              user={{ name: "Admin Exemplo", initials: "AE", role: "Admin" }}
            />
            <div className="flex-1 bg-page" />
          </div>
          <p className="m-0 text-[12.5px] text-muted md:hidden">A Sidebar aparece a partir de 768px (no celular ela abre pelo menu).</p>
        </Demo>
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "label em todo campo; o DS desenha o rótulo acima.", dont: "Rótulo feito à mão (<p>) acima de um Select com label escondido." },
            { do: "CheckboxGroup para 2–8 opções; MultiSelect acima disso ou com grupos.", dont: "Lista de Checkbox soltos sem rótulo do grupo." },
            { do: "NativeSelect quando o seletor do sistema é melhor (celular, lista longa simples).", dont: "<select> cru estilizado à mão (a auditoria acusa native-select)." },
            { do: "DatePicker com placeholder que diz o padrão (“Hoje (padrão)”) e clearable.", dont: "<input type=\"date\">: no iPhone abre em inglês e carrega vazio." },
            { do: "Botão desabilitado com disabledReason quando o motivo não é óbvio.", dont: "Botão apagado (opacidade 40%) sem explicação." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
