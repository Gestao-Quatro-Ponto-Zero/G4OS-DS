// Imagens de exemplo geradas em SVG (offline, na paleta do DS). Só para o showcase.
const palettes = [
  ["#031a26", "#184560", "#b9915b"],
  ["#842e20", "#b9915b", "#f5eee3"],
  ["#184560", "#5f7f6f", "#e9eaed"],
  ["#202124", "#484a50", "#b9915b"],
  ["#5f7f6f", "#1b5e20", "#e8f5e9"],
  ["#f5eee3", "#b9915b", "#842e20"],
  ["#031a26", "#842e20", "#f6e7e3"],
  ["#e9eaed", "#184560", "#031a26"],
];

export function art(i: number, label = "") {
  const [a, b, c] = palettes[i % palettes.length];
  const r = (n: number) => ((i * 97 + n * 53) % 100) / 100;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><circle cx="${200 + r(1) * 400}" cy="${150 + r(2) * 300}" r="${120 + r(3) * 160}" fill="${c}" opacity=".55"/><rect x="${r(4) * 500}" y="${300 + r(5) * 200}" width="${260 + r(6) * 200}" height="${260}" rx="24" fill="${a}" opacity=".35" transform="rotate(${-12 + r(7) * 24} 400 300)"/>${label ? `<text x="40" y="560" font-family="Figtree,system-ui,sans-serif" font-size="30" font-weight="600" fill="#fff" opacity=".9">${label}</text>` : ""}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const gallery = [
  { alt: "Fachada do escritório em São Paulo", caption: "Escritório · São Paulo" },
  { alt: "Equipe comercial em workshop", caption: "Workshop do time comercial" },
  { alt: "Painel de indicadores na TV da sala", caption: "Painel de indicadores" },
  { alt: "Mesa de reunião com notebook", caption: "Sala de reuniões" },
  { alt: "Evento de clientes no auditório", caption: "Encontro de clientes 2026" },
  { alt: "Detalhe do material de onboarding", caption: "Kit de onboarding" },
  { alt: "Time de produto em planejamento", caption: "Planejamento trimestral" },
  { alt: "Área de convivência", caption: "Área de convivência" },
].map((g, i) => ({ ...g, src: art(i) }));
