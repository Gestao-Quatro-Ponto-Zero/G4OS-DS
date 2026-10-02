/*
 * Downloads gerados no navegador para os blocos de exemplo (sem servidor):
 * XML, CSV, HTML e um PDF mínimo válido. No app real, troque pelo arquivo
 * que a API devolve; a chamada (`saveBlob`) continua a mesma.
 */

/** Salva um Blob com o nome dado (download real do navegador). */
export function saveBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Texto como arquivo: `saveText("nota.xml", xml, "application/xml")`. */
export function saveText(name: string, text: string, type = "text/plain") {
  // BOM no CSV para o Excel abrir com acentos.
  saveBlob(name, new Blob(type.startsWith("text/csv") ? ["﻿", text] : [text], { type: `${type};charset=utf-8` }));
}

/**
 * PDF de uma página (A4, Helvetica) com as linhas dadas. A primeira linha sai
 * como título. Acentos viram a letra base (a fonte padrão do PDF não os tem).
 */
export function pdfBlob(lines: string[]) {
  const esc = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[\u00a0\u202f]/g, " ")
      .replace(/[^\x20-\x7e]/g, "-")
      .replace(/[\\()]/g, (m) => `\\${m}`);
  const [title = "", ...rest] = lines;
  const text = ["BT", "/F2 16 Tf", "56 780 Td", `(${esc(title)}) Tj`, "/F1 11 Tf", "16 TL", "T*", ...rest.map((l) => `(${esc(l)}) '`), "ET"].join("\n");
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
  ];
  let out = "%PDF-1.4\n";
  const offsets = objs.map((o, i) => {
    const at = out.length;
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
    return at;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([out], { type: "application/pdf" });
}

/** Atalho: gera e baixa um PDF de exemplo. */
export function savePdf(name: string, lines: string[]) {
  saveBlob(name.endsWith(".pdf") ? name : `${name}.pdf`, pdfBlob(lines));
}

/** Escapa texto para XML/HTML. */
export const xmlEscape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Decimal de máquina para XML/CSV técnico ("1354.00"), nunca para tela. */
export const machineDecimal = (v: number) => {
  const cents = String(Math.abs(Math.round(v * 100))).padStart(3, "0");
  return `${v < 0 ? "-" : ""}${cents.slice(0, -2)}.${cents.slice(-2)}`;
};

/**
 * Baixa um arquivo de exemplo coerente com a extensão: PDF de verdade,
 * planilha como CSV, documento como .doc (HTML que o Word abre), o resto em
 * texto. Devolve o nome com que o arquivo foi salvo.
 */
export function saveSample(name: string, lines: string[]) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const base = name.replace(/\.[^.]+$/, "");
  if (ext === "pdf") {
    savePdf(name, lines);
    return name;
  }
  if (["csv", "xls", "xlsx", "ods"].includes(ext)) {
    saveText(`${base}.csv`, lines.join("\r\n"), "text/csv");
    return `${base}.csv`;
  }
  if (["doc", "docx", "odt", "rtf"].includes(ext)) {
    const [title = base, ...rest] = lines;
    saveText(`${base}.doc`, `<html><head><meta charset="utf-8"><title>${xmlEscape(title)}</title></head><body><h1>${xmlEscape(title)}</h1>${rest.map((l) => `<p>${xmlEscape(l)}</p>`).join("")}</body></html>`, "application/msword");
    return `${base}.doc`;
  }
  if (["txt", "md", "xml", "json"].includes(ext)) {
    saveText(name, lines.join("\n"), ext === "xml" ? "application/xml" : ext === "json" ? "application/json" : "text/plain");
    return name;
  }
  saveText(`${base}.txt`, lines.join("\n"));
  return `${base}.txt`;
}
