// Compatibilidade: a auditoria mora em scripts/lint/ (engine, regras, formatos).
// API antiga: audit(target) síncrono, auditSource(text, file), toMarkdown(report), RULES, TEXT_ALLOW.
import { auditSync, lintText } from "./lint/engine.mjs";
import { toMarkdown as md } from "./lint/format.mjs";

export { RULES, TEXT_ALLOW, CATEGORIES } from "./lint/rules.mjs";
export { runAudit, lintText, applyFixes, loadConfig, exitCode } from "./lint/engine.mjs";
export { format, FORMATS } from "./lint/format.mjs";

export const audit = (target) => auditSync(target);
export const auditSource = (text, file) => lintText(text, file);
export const toMarkdown = (report, opts) => md(report, opts);
