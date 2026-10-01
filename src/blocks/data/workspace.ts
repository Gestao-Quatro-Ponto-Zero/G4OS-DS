/*
 * Dados compartilhados do produto de exemplo "Atlas": o workspace interno da
 * Acme (a mesma empresa que usa o Acme CRM). Pessoa logada, organização e
 * equipe — os mesmos nomes do time comercial do CRM. Usados pelas telas de
 * Aplicação, Configurações, Onboarding e IA. Troque pela sua API.
 */

export const org = {
  name: "Acme",
  product: "Atlas",
  domain: "acme.com.br",
  plan: "Business",
  seats: 15,
};

export type Role = "admin" | "membro" | "leitor";
export type Person = {
  id: string;
  name: string;
  initials: string;
  email: string;
  title: string;
  role: Role;
  status: "ativo" | "convidado";
  lastSeen: string;
  tint: string;
};

export const roleLabel: Record<Role, string> = { admin: "Administrador", membro: "Membro", leitor: "Leitor" };

// ds-audit-ignore-start hex-color: tintas de avatar (identidade da pessoa)
export const people: Person[] = [
  { id: "joana", name: "Joana Ribeiro", initials: "JR", email: "joana@acme.com.br", title: "Head de Operações", role: "admin", status: "ativo", lastSeen: "agora", tint: "#3f3f46" },
  { id: "rafael", name: "Rafael Queiroz", initials: "RQ", email: "rafael@acme.com.br", title: "Diretor comercial", role: "admin", status: "ativo", lastSeen: "há 20 min", tint: "#031a26" },
  { id: "ana", name: "Ana Lopes", initials: "AL", email: "ana@acme.com.br", title: "Executiva de contas", role: "membro", status: "ativo", lastSeen: "há 1 h", tint: "#3f3f46" },
  { id: "diego", name: "Diego Araújo", initials: "DA", email: "diego@acme.com.br", title: "Executivo de contas", role: "membro", status: "ativo", lastSeen: "há 2 h", tint: "#184560" },
  { id: "carla", name: "Carla Nogueira", initials: "CN", email: "carla@acme.com.br", title: "Executiva de contas", role: "membro", status: "ativo", lastSeen: "ontem", tint: "#842e20" },
  { id: "bruno", name: "Bruno Takeda", initials: "BT", email: "bruno@acme.com.br", title: "Executivo de contas", role: "membro", status: "ativo", lastSeen: "há 5 h", tint: "#5f7f6f" },
  { id: "elisa", name: "Elisa Monteiro", initials: "EM", email: "elisa@acme.com.br", title: "Financeiro", role: "admin", status: "ativo", lastSeen: "há 3 dias", tint: "#8c6a3a" },
  { id: "eduardo", name: "Eduardo Barros", initials: "EB", email: "eduardo@acme.com.br", title: "Suporte e SDR", role: "membro", status: "ativo", lastSeen: "há 30 min", tint: "#8c6a3a" },
  { id: "marina", name: "Marina Costa", initials: "MC", email: "marina@acme.com.br", title: "Auditoria interna", role: "leitor", status: "ativo", lastSeen: "há 1 semana", tint: "#5f7f6f" },
  { id: "beatriz", name: "beatriz@acme.com.br", initials: "B", email: "beatriz@acme.com.br", title: "", role: "membro", status: "convidado", lastSeen: "convite há 2 dias", tint: "#a3a7b0" },
  { id: "thiago", name: "thiago@parceiro.com", initials: "T", email: "thiago@parceiro.com", title: "", role: "leitor", status: "convidado", lastSeen: "convite há 6 dias", tint: "#a3a7b0" },
];
// ds-audit-ignore-end

/** Pessoa logada. */
export const me = people[0];

export const personById = (id: string) => people.find((p) => p.id === id);
