import { BadgeCheck, Bot, LogOut, Plus, Search, Settings, ShieldCheck, User } from "lucide-react";
import {
  Avatar,
  AvatarGroup,
  Button,
  IconButton,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Kbd,
  KbdGroup,
  Menu,
  Tooltip,
  notify,
} from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { art } from "./_media-data";

export const meta: PageMeta = {
  title: "Avatar e teclas",
  group: "Ações e exibição",
  order: 35,
  description:
    "Avatar com foto e iniciais de reserva, tamanhos, ponto de presença, selo e forma quadrada; AvatarGroup lado a lado ou empilhado com +N e ação. Kbd e KbdGroup para atalhos, com ⌘ no Mac e Ctrl nos outros sistemas.",
  shadcn: ["avatar", "kbd"],
};

const team = [
  { name: "Ana Lopes", tint: "#184560", src: art(3) },
  { name: "Bruno Reis", tint: "#5f7f6f" },
  { name: "Carla Mendes", tint: "#842e20", src: art(5) },
  { name: "Diego Alves", tint: "#3f3f46" },
  { name: "Elisa Prado", tint: "#b9915b" },
  { name: "Fábio Nunes", tint: "#031a26" },
  { name: "Gabi Torres", tint: "#184560" },
];

export default function Page() {
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Avatar" rule="Foto quando houver (`src`); se não houver ou falhar, iniciais calculadas do nome sobre a tinta da pessoa. Sempre com `name` (nome acessível).">
        <Demo code={`<Avatar name="Ana Lopes" src={foto} />\n<Avatar name="Bruno Reis" tint="#5f7f6f" />\n<Avatar name="Conta quebrada" src="/nao-existe.png" />`}>
          <div className="flex flex-wrap items-center gap-3">
            <Avatar name="Ana Lopes" src={art(3)} tint="#184560" />
            <Avatar name="Bruno Reis" tint="#5f7f6f" />
            <Avatar name="Carla Mendes" src="/imagem-que-nao-existe.png" tint="#842e20" />
            <Avatar name="Robô de cobrança" shape="square" tint="#031a26" initials="RC" />
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Tamanhos" rule="`xs` 20 px (dentro de texto e chips), `sm` 28 (listas, tabelas), `md` 32 (padrão), `lg` 40 (cabeçalho de registro), `xl` 56 (perfil).">
        <Demo code={`<Avatar name="Ana Lopes" size="xs" /> … <Avatar name="Ana Lopes" size="xl" />`}>
          <div className="flex flex-wrap items-end gap-3">
            {(["xs", "sm", "md", "lg", "xl"] as const).map((s) => (
              <div key={s} className="flex flex-col items-center gap-1.5">
                <Avatar name="Ana Lopes" src={art(3)} tint="#184560" size={s} />
                <code className="font-mono text-[11px] text-muted">{s}</code>
              </div>
            ))}
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Presença e selo" rule="`status` é presença (online, ausente, ocupado, offline) e entra no nome acessível. `badge` é um selo de ícone (verificado, admin, bot). Um ou outro.">
        <Demo code={`<Avatar name="Ana Lopes" status="online" />\n<Avatar name="Bruno Reis" badge={<BadgeCheck />} />`}>
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name="Ana Lopes" src={art(3)} tint="#184560" status="online" size="lg" />
            <Avatar name="Bruno Reis" tint="#5f7f6f" status="away" size="lg" />
            <Avatar name="Carla Mendes" src={art(5)} tint="#842e20" status="busy" size="lg" />
            <Avatar name="Diego Alves" tint="#3f3f46" status="offline" size="lg" />
            <Avatar name="Elisa Prado" tint="#b9915b" badge={<BadgeCheck />} size="lg" />
            <Avatar name="Assistente" shape="square" tint="#031a26" initials="IA" badge={<Bot />} size="lg" />
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Grupo" rule="Lado a lado em listas; `stacked` (empilhado) em cards e cabeçalhos. `total` quando a lista é amostra; `action` para convidar.">
        <Demo
          code={`<AvatarGroup people={time} max={4} />
<AvatarGroup people={time} max={3} stacked total={18} />
<AvatarGroup people={time} max={3} stacked action={<IconButton label="Convidar pessoa" size="sm"><Plus /></IconButton>} />`}
        >
          <div className="flex flex-col gap-4">
            <AvatarGroup people={team} max={4} />
            <AvatarGroup people={team} max={3} stacked size="md" total={18} />
            <AvatarGroup
              people={team.slice(0, 3)}
              stacked
              size="md"
              action={
                <IconButton label="Convidar pessoa" size="sm" onClick={() => notify("Convidar", undefined, "info")}>
                  <Plus />
                </IconButton>
              }
            />
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Avatar como gatilho de menu" rule="Menu com `triggerVariant=&quot;bare&quot;` e um cabeçalho com a conta logada.">
        <Demo
          code={`<Menu label="Conta de Ana Lopes" triggerVariant="bare" trigger={<Avatar name="Ana Lopes" src={foto} status="online" />} align="end" width={240} items={[
  { type: "header", content: <…nome e e-mail…/> },
  { label: "Perfil", icon: <User />, shortcut: ["mod", "P"] },
  { label: "Configurações", icon: <Settings /> },
  { type: "separator" },
  { label: "Sair", icon: <LogOut /> },
]} />`}
        >
          <Menu
            label="Conta de Ana Lopes"
            triggerVariant="bare"
            trigger={<Avatar name="Ana Lopes" src={art(3)} tint="#184560" status="online" />}
            width={240}
            items={[
              {
                type: "header",
                content: (
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-medium">Ana Lopes</div>
                    <div className="truncate text-[12px] text-muted">ana@acme.com.br</div>
                  </div>
                ),
              },
              { label: "Perfil", icon: <User />, shortcut: ["mod", "P"], onSelect: () => notify("Perfil", undefined, "info") },
              { label: "Segurança", icon: <ShieldCheck />, onSelect: () => notify("Segurança", undefined, "info") },
              { label: "Configurações", icon: <Settings />, shortcut: ["mod", ","], onSelect: () => notify("Configurações", undefined, "info") },
              { type: "separator" },
              { label: "Sair", icon: <LogOut />, onSelect: () => notify("Sair", undefined, "info") },
            ]}
          />
        </Demo>
      </DocSection>

      <DocSection title="Kbd e KbdGroup" rule='Teclas por nome em `keys`: "mod" vira ⌘ no Mac e Ctrl no Windows/Linux; o mesmo para "shift", "alt", "enter". Em botão, dica e campo de busca.'>
        <Demo
          code={`<KbdGroup keys={["mod", "K"]} />
<KbdGroup keys={["mod", "shift", "P"]} />
<Kbd>Esc</Kbd>
<Button>Salvar <KbdGroup keys={["mod", "S"]} /></Button>
<Tooltip content="Buscar" shortcut={["mod", "K"]}>…</Tooltip>`}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-[13px] text-ink-soft">
              <span className="inline-flex items-center gap-2">
                Abrir busca <KbdGroup keys={["mod", "K"]} />
              </span>
              <span className="inline-flex items-center gap-2">
                Paleta <KbdGroup keys={["mod", "shift", "P"]} />
              </span>
              <span className="inline-flex items-center gap-2">
                Fechar <Kbd>Esc</Kbd>
              </span>
              <span className="inline-flex items-center gap-2">
                Tamanho md <KbdGroup keys={["mod", "enter"]} size="md" />
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="ghost" onClick={() => notify("Rascunho salvo", undefined, "info")}>
                Salvar rascunho <KbdGroup keys={["mod", "S"]} className="ml-1" />
              </Button>
              <Tooltip content="Buscar no CRM" shortcut={["⌘", "K"]}>
                <IconButton label="Buscar no CRM">
                  <Search />
                </IconButton>
              </Tooltip>
              <div className="w-64">
                <InputGroup>
                  <InputGroupAddon>
                    <Search />
                  </InputGroupAddon>
                  <InputGroupInput aria-label="Buscar" placeholder="Buscar…" />
                  <InputGroupAddon align="inline-end">
                    <KbdGroup keys={["mod", "K"]} />
                  </InputGroupAddon>
                </InputGroup>
              </div>
            </div>
          </div>
        </Demo>
      </DocSection>

      <DocSection title="API">
        <PropsTable
          rows={[
            ["Avatar.name / initials", "string", "iniciais do nome", "Nome acessível; iniciais opcionais."],
            ["Avatar.src", "string", "—", "Foto; se falhar, as iniciais."],
            ["Avatar.size", '"xs" | "sm" | "md" | "lg" | "xl"', '"md"', "20 / 28 / 32 / 40 / 56 px."],
            ["Avatar.status / badge", '"online" | "away" | "busy" | "offline" / ReactNode', "—", "Presença ou selo no canto."],
            ["Avatar.shape", '"circle" | "square"', '"circle"', "Quadrado para bots e contas de serviço."],
            ["AvatarGroup.stacked / total / action / size", "boolean / number / ReactNode / AvatarSize", 'false / — / — / "sm"', "Pilha, contagem real, ação no fim."],
            ["KbdGroup.keys", "string[]", "—", '"mod", "shift", "alt", "enter"… por plataforma.'],
            ["Kbd.size", '"sm" | "md"', '"sm"', "md ao lado de texto corrido."],
          ]}
        />
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Pessoa = Avatar; empresa, produto ou registro = EntityMark.", dont: "Avatar redondo com logo de empresa." },
            { do: "Atalho com KbdGroup e nomes de tecla (\"mod\").", dont: "Escrever “Ctrl+K” fixo: no Mac é ⌘K." },
            { do: "Presença só quando muda decisão (atendimento, chat).", dont: "Ponto verde em toda lista de pessoas." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
