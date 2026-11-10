#!/usr/bin/env node
// Regressão em Chromium: pontos ausentes não desenham linha, rótulo ou marcador.
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
      import { flushSync } from "react-dom";
      import { LineChart } from "./src/components/charts";
      const root = createRoot(document.getElementById("root"));
      window.renderChart = (values, curve, options = {}) => flushSync(() => root.render(
        <LineChart label="Teste de lacunas" data={values.map((value, i) => ({ x: String(i), value }))}
          index="x" series={[{ key: "value", label: "Valor" }]} height={240}
          curve={curve} format={String} labels endLabels dots {...options} />
      ));
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
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent('<div id="root" style="width:600px"></div>');
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  const cases = [
    [12, 13, null, 14, 15, null],
    [null, 12, null, 14, null],
    [null, null],
    [0, null, 1, 0],
    [12, 13, 14],
  ];
  for (const curve of ["linear", "monotone", "step"]) {
    for (const values of cases) {
      await page.evaluate(({ values, curve }) => globalThis.window.renderChart(values, curve), { values, curve });
      await page.waitForFunction(() => globalThis.document.querySelector("svg")?.getAttribute("width") === "600");
      const result = await page.locator("svg").evaluate((svg) => ({
        labels: [...svg.querySelectorAll("text.font-medium")].map((node) => node.textContent),
        endLabels: [...svg.querySelectorAll("text.font-semibold")].map((node) => node.textContent),
        points: [...svg.querySelectorAll("circle")].map((node) => Number(node.getAttribute("cy"))),
        paths: [...svg.querySelectorAll("path")].map((node) => node.getAttribute("d") ?? ""),
      }));
      assert.deepEqual(result.labels, values.filter((value) => value != null).map(String), `${curve}: rótulos dos pontos`);
      assert.deepEqual(result.endLabels, values.at(-1) == null ? [] : [String(values.at(-1))], `${curve}: rótulo final`);
      assert.ok(result.points.every((y) => Number.isFinite(y) && y >= 0 && y <= 240), `${curve}: marcador fora do gráfico`);
      assert.ok(result.paths.every((path) => !/NaN|Infinity/.test(path)), `${curve}: caminho inválido`);
      if (values.every((value) => value == null)) {
        assert.equal(result.points.length, 0, "série vazia não deve desenhar marcadores");
        assert.ok(result.paths.every((path) => !path), "série vazia não deve desenhar linha");
      }
      console.log(`  ✓ ${curve} · ${JSON.stringify(values)}`);
    }
  }
  await page.evaluate(() => globalThis.window.renderChart([12, null, 14], "linear", {
    labels: false, endLabels: false, dots: false, tooltip: { defaultIndex: 1 },
  }));
  assert.equal(await page.locator('circle[r="4.5"]').count(), 0, "cursor não marca ponto ausente");
  assert.deepEqual(errors, [], "nenhum erro de render no navegador");
  console.log("Lacunas, rótulos, zero real e cursor ok");
} finally {
  await browser.close();
}
