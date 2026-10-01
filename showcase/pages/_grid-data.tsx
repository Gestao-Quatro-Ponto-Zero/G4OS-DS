// Dados de exemplo das páginas do DataGrid (determinísticos: sem Math.random).
import { Badge, formatCurrency, formatDate, type GridColumn } from "@g4os/ds";

export type Conta = {
  id: string;
  empresa: string;
  contato: string;
  email: string;
  dono: string;
  status: "ativa" | "risco" | "trial" | "cancelada";
  segmento: "Enterprise" | "Mid-market" | "PME";
  mrr: number;
  usuarios: number;
  ultimoContato: string;
  cidade: string;
};

const empresas = ["Grupo Aurora", "Vértice Logística", "Metalúrgica Santa Clara", "Clínica Bem Viver", "Rede Horizonte", "Agro Cerrado", "Farmácias Sol", "Pátria Seguros", "Construtora Pilar", "Escola Novo Saber", "TecnoAgro", "Café Aurora", "Imobiliária Lar", "Studio Norte", "Hospital São Lucas", "Distribuidora Norte Sul", "Óticas Visão Clara", "Mercado Bom Dia", "Nortesul Log", "Atlas Engenharia"];
const pessoas = ["Renata Farias", "Paulo Menezes", "Luíza Prado", "Marcos Tavares", "Júlia Campos", "Rafael Lima", "Camila Rocha", "Eduardo Nunes", "Beatriz Alves", "Tiago Moreira"];
const donos = ["Ana Lopes", "Bruno Takeda", "Carla Nogueira", "Diego Araújo"];
const cidades = ["São Paulo, SP", "Campinas, SP", "Goiânia, GO", "Curitiba, PR", "Recife, PE", "Belo Horizonte, MG", "Porto Alegre, RS", "Salvador, BA"];
const statuses: Conta["status"][] = ["ativa", "ativa", "ativa", "risco", "trial", "ativa", "cancelada", "ativa"];
const segs: Conta["segmento"][] = ["Enterprise", "Mid-market", "PME", "PME", "Mid-market"];

export function makeContas(n: number): Conta[] {
  return Array.from({ length: n }, (_, i) => {
    const seg = segs[i % segs.length];
    const base = seg === "Enterprise" ? 32000 : seg === "Mid-market" ? 9000 : 1800;
    const d = new Date(2026, 8, 30 - ((i * 7) % 75));
    const pessoa = pessoas[(i * 3) % pessoas.length];
    return {
      id: `c${i + 1}`,
      empresa: i < empresas.length ? empresas[i] : `${empresas[i % empresas.length]} ${Math.floor(i / empresas.length) + 1}`,
      contato: pessoa,
      email: `${pessoa.split(" ")[0].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}@empresa.com.br`,
      dono: donos[i % donos.length],
      status: statuses[i % statuses.length],
      segmento: seg,
      mrr: Math.round(base * (0.6 + ((i * 37) % 100) / 100)),
      usuarios: Math.round((base / 160) * (0.5 + ((i * 13) % 10) / 10)),
      ultimoContato: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      cidade: cidades[i % cidades.length],
    };
  });
}

export const statusLabel: Record<Conta["status"], string> = { ativa: "Ativa", risco: "Em risco", trial: "Trial", cancelada: "Cancelada" };
export const statusTone = { ativa: "ok", risco: "warn", trial: "info", cancelada: "neutral" } as const;
export const donoOptions = donos.map((d) => ({ value: d, label: d }));
export const statusOptions = (Object.keys(statusLabel) as Conta["status"][]).map((s) => ({ value: s, label: statusLabel[s] }));

export const brl = (n: number) => formatCurrency(n, { cents: false });

export const contaColumns: GridColumn<Conta>[] = [
  { key: "empresa", header: "Empresa", value: (r) => r.empresa, width: 220, pinned: "left", hideable: false, mobile: "title" },
  { key: "contato", header: "Contato", value: (r) => r.contato, width: 170, mobile: "subtitle" },
  { key: "status", header: "Situação", value: (r) => statusLabel[r.status], width: 130, cell: (r) => <Badge tone={statusTone[r.status]}>{statusLabel[r.status]}</Badge> },
  { key: "segmento", header: "Segmento", value: (r) => r.segmento, width: 130 },
  { key: "mrr", header: "MRR", value: (r) => r.mrr, width: 130, align: "right", cell: (r) => <span className="tabular-nums">{brl(r.mrr)}</span>, footer: (rows) => brl(rows.reduce((s, r) => s + r.mrr, 0)), tooltip: "Receita recorrente mensal da conta" },
  { key: "usuarios", header: "Usuários", value: (r) => r.usuarios, width: 110, align: "right" },
  { key: "dono", header: "Responsável", value: (r) => r.dono, width: 160 },
  { key: "ultimoContato", header: "Último contato", value: (r) => r.ultimoContato, width: 140, cell: (r) => <span className="tabular-nums text-ink-soft">{formatDate(r.ultimoContato)}</span> },
  { key: "cidade", header: "Cidade", value: (r) => r.cidade, width: 170, defaultHidden: true },
  { key: "email", header: "E-mail", value: (r) => r.email, width: 220, defaultHidden: true },
];
