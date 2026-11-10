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
    // Sem o CSS do showcase, oculta a cópia compacta do cabeçalho como no topo da página.
    await page.setContent('<style>.sticky-page-header-overlay { display: none }</style><div id="root"></div>');
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.evaluate(() => {
      globalThis.window.offerCount = 0;
      globalThis.window.addEventListener("g4os-ds:feedback", (event) => {
        if (event.detail.message.startsWith("Pedido enviado")) globalThis.window.offerCount++;
      });
    });
    await page.getByRole("button", { name: "Resumir 3 dias", exact: true }).click();
    if (reducedMotion === "no-preference") {
      await page.getByRole("button", { name: "Parar", exact: true }).click();
      await page.getByText("Resumo interrompido. A leitura parou antes de gerar itens.").waitFor();
      assert.equal(await page.getByText("Tudo em dia", { exact: true }).count(), 0, "interromper não conclui o resumo");
      assert.equal(await page.getByRole("img", { name: / lido$/ }).count(), 0, "fontes pendentes não aparecem como lidas");
      await page.getByRole("button", { name: "Refazer resumo", exact: true }).click();
      await page.locator("[data-catch-up-read]").first().waitFor();
      await page.getByRole("button", { name: "Parar", exact: true }).click();
      await page.getByText("Resumo interrompido. O conteúdo abaixo é parcial.").waitFor();
      assert.ok(await page.locator("[data-catch-up-read]").count() < 6, "a interrupção preserva só os itens já gerados");
      await page.getByRole("button", { name: "Refazer resumo", exact: true }).click();
    }
    await page.waitForFunction(() => globalThis.document.querySelectorAll("[data-catch-up-read]").length === 6);
    await page.getByRole("button", { name: "Responder", exact: true }).focus();
    await page.getByRole("button", { name: "Responder", exact: true }).evaluate((button) => {
      button.click();
      button.click();
    });
    await page.waitForFunction(() => globalThis.document.querySelectorAll("[data-catch-up-read]").length === 5);
    await page.waitForFunction(() => globalThis.document.activeElement.hasAttribute("data-catch-up-read"));
    assert.equal(await page.evaluate(() => globalThis.window.offerCount), 1, "ativar duas vezes não duplica a oferta");
    await page.getByRole("button", { name: "Hoje", exact: true }).first().click();
    await page.waitForFunction(() => globalThis.document.querySelectorAll("[data-catch-up-read]").length === 2);
    await page.getByRole("button", { name: "3 dias", exact: true }).first().click();
    await page.waitForFunction(() => globalThis.document.querySelectorAll("[data-catch-up-read]").length === 6);
    for (let attempt = 0; attempt < 2; attempt++) {
      await page.getByRole("button", { name: "Simular falha", exact: true }).click();
      await page.getByRole("alert").waitFor();
      assert.equal(await page.locator("[data-catch-up-read]").count(), 4, "resumo parcial exclui a fonte que falhou");
      await page.getByRole("button", { name: "Marcar tudo como lido", exact: true }).click();
      await page.getByText("Itens disponíveis lidos. Tente ler o Gmail para concluir o resumo.").waitFor();
      assert.equal(await page.getByText("Tudo em dia", { exact: true }).count(), 0, "falha pendente não conclui o resumo");
      await page.waitForFunction(() => globalThis.document.activeElement?.textContent.includes("Tentar de novo"));
      await page.getByRole("button", { name: "Tentar de novo", exact: true }).click();
      await page.getByRole("alert").waitFor({ state: "detached" });
      await page.waitForFunction(() => globalThis.document.querySelectorAll("[data-catch-up-read]").length === 6);
    }
    await page.getByRole("button", { name: "Marcar tudo como lido", exact: true }).click();
    await page.getByRole("button", { name: "Resumir de novo", exact: true }).click();
    await page.waitForFunction(() => globalThis.document.querySelectorAll("[data-catch-up-read]").length === 6);
    if (reducedMotion === "no-preference") {
      await page.locator("[data-catch-up-read]").first().click();
    }
    await page.getByRole("button", { name: "Semana", exact: true }).first().click();
    await page.waitForFunction(() => globalThis.document.querySelectorAll("[data-catch-up-read]").length === 7);
    await page.getByText("A Marina pediu a versão final do contrato da Vértice até qui., 30/10.").waitFor();
    await page.getByRole("button", { name: "Hoje", exact: true }).first().click();
    await page.waitForFunction(() => globalThis.document.querySelectorAll("[data-catch-up-read]").length === 2);
    assert.equal(await page.getByText("A Marina pediu a versão final do contrato da Vértice até qui., 30/10.").count(), 0, "Hoje exclui itens anteriores ao período");
    await page.getByRole("button", { name: "3 dias", exact: true }).first().click();
    await page.waitForFunction(() => globalThis.document.querySelectorAll("[data-catch-up-read]").length === 6);
    assert.deepEqual(errors, [], "nenhum erro de render no navegador");
    console.log(`  ✓ movimento ${reducedMotion} · períodos, interrupção, falha, recuperação e novo resumo`);
    await page.close();
  }
} finally {
  await browser.close();
}
