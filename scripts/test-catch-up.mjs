#!/usr/bin/env node
// Regressão em Chromium: falha e nova tentativa funcionam no primeiro clique.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { chromium } from "playwright-core";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const executablePath = [process.env.CHROME_PATH, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].filter(Boolean).find(existsSync);
assert.ok(executablePath, "Chrome/Chromium não encontrado. Defina CHROME_PATH.");
const bundle = await build({
  stdin: {
    contents: `
      import React from "react";
      import { createRoot } from "react-dom/client";
      import CatchUp from "./src/blocks/ai-catch-up";
      createRoot(document.getElementById("root")).render(<CatchUp />);
    `,
    resolveDir: root,
    loader: "tsx",
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  logLevel: "error",
});

const browser = await chromium.launch({ executablePath, headless: true });
try {
  for (const reducedMotion of ["reduce", "no-preference"]) {
    const page = await browser.newPage({ reducedMotion });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setContent('<div id="root"></div>');
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.getByRole("button", { name: "Resumir 3 dias", exact: true }).click();
    await page.waitForFunction(() => globalThis.document.querySelectorAll("[data-catch-up-read]").length === 6);
    for (let attempt = 0; attempt < 2; attempt++) {
      await page.getByRole("button", { name: "Simular falha", exact: true }).click();
      await page.getByRole("alert").waitFor();
      assert.equal(await page.locator("[data-catch-up-read]").count(), 4, "resumo parcial exclui a fonte que falhou");
      await page.getByRole("button", { name: "Tentar de novo", exact: true }).click();
      await page.getByRole("alert").waitFor({ state: "detached" });
      await page.waitForFunction(() => globalThis.document.querySelectorAll("[data-catch-up-read]").length === 6);
    }
    await page.getByRole("button", { name: "Marcar tudo como lido", exact: true }).click();
    await page.getByRole("button", { name: "Resumir de novo", exact: true }).click();
    await page.waitForFunction(() => globalThis.document.querySelectorAll("[data-catch-up-read]").length === 6);
    assert.deepEqual(errors, [], "nenhum erro de render no navegador");
    console.log(`  ✓ movimento ${reducedMotion} · início, falha, recuperação e novo resumo`);
    await page.close();
  }
} finally {
  await browser.close();
}
