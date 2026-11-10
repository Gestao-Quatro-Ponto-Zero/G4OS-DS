#!/usr/bin/env node
// Verifica o padrão CSS, aliases e preferências de marca antes e depois do React.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { chromium } from "playwright-core";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const executablePath = [process.env.CHROME_PATH, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].filter(Boolean).find(existsSync);
assert.ok(executablePath, "Chrome/Chromium não encontrado. Defina CHROME_PATH.");
const css = ["tokens.css", "themes.css"].map((name) => readFileSync(join(root, "src/styles", name), "utf8")).join("\n");
const bundle = await build({
  stdin: {
    contents: `
      import React from "react";
      import { createRoot } from "react-dom/client";
      import { applyTheme, themeScript, useTheme, DEFAULT_BRAND, brandPresets } from "./src/lib/theme";
      function Probe() {
        const theme = useTheme("light");
        return <><output>{theme.brand}</output><button onClick={() => theme.setBrand("g4-institucional")}>Institucional</button></>;
      }
      window.themeApi = { applyTheme, themeScript, DEFAULT_BRAND, brandPresets };
      window.mountTheme = () => createRoot(document.getElementById("root")).render(<><Probe /><Probe /></>);
    `,
    loader: "tsx",
    resolveDir: root,
  },
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
});
const browser = await chromium.launch({ executablePath, headless: true });
try {
  for (const [mode, colorScheme] of [["light", "light"], ["dark", "dark"], ["system", "light"], ["system", "dark"]]) {
    const page = await browser.newPage({ colorScheme });
    await page.route("http://theme.test/", (route) => route.fulfill({ contentType: "text/html", body: `<html><head><style>${css}</style></head><body><div id="root"></div></body></html>` }));
    await page.goto("http://theme.test/");
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    const dark = colorScheme === "dark";
    const values = await page.evaluate(({ mode }) => {
      const { themeApi } = globalThis.window;
      themeApi.applyTheme(mode);
      const style = globalThis.getComputedStyle(globalThis.document.documentElement);
      return {
        brand: themeApi.DEFAULT_BRAND,
        attribute: globalThis.document.documentElement.getAttribute("data-brand"),
        presets: themeApi.brandPresets.map((preset) => preset.id),
        page: style.getPropertyValue("--ds-page").trim(),
        ink: style.getPropertyValue("--ds-ink").trim(),
        primary: style.getPropertyValue("--ds-primary").trim(),
        radius: style.getPropertyValue("--ds-radius-scale").trim(),
        font: style.getPropertyValue("--ds-font-sans"),
      };
    }, { mode });
    assert.equal(values.brand, "g4-classico");
    assert.equal(values.attribute, null);
    assert.deepEqual(values.presets.slice(0, 2), ["g4-classico", "g4os"]);
    assert.ok(!values.presets.includes("g4-institucional"));
    assert.equal(values.page, dark ? "#111113" : "#ffffff");
    assert.equal(values.ink, dark ? "#ececef" : "#202124");
    assert.equal(values.primary, dark ? "#ececef" : "#202124");
    assert.equal(values.radius, "1");
    assert.match(values.font, /Manrope/);

    for (const [saved, expected] of [[null, null], ["g4", null], ["g4-classico", null], ["g4os", "g4os"], ["g4-institucional", "g4os"], ["oceano", "oceano"]]) {
      const result = await page.evaluate(({ saved, mode }) => {
        globalThis.localStorage.setItem("ds-theme", mode);
        if (saved === null) globalThis.localStorage.removeItem("ds-brand");
        else globalThis.localStorage.setItem("ds-brand", saved);
        globalThis.document.documentElement.setAttribute("data-brand", "stale");
        (0, eval)(globalThis.window.themeApi.themeScript);
        const before = globalThis.document.documentElement.getAttribute("data-brand");
        globalThis.window.themeApi.applyTheme(mode, saved);
        return { before, after: globalThis.document.documentElement.getAttribute("data-brand") };
      }, { saved, mode });
      assert.deepEqual(result, { before: expected, after: expected }, `script e API concordam para ${saved}`);
    }
    const aliases = await page.evaluate(({ mode }) => {
      const read = () => {
        const style = globalThis.getComputedStyle(globalThis.document.documentElement);
        return ["--ds-page", "--ds-primary", "--ds-ai-accent", "--ds-radius-scale"].map((key) => style.getPropertyValue(key).trim());
      };
      globalThis.window.themeApi.applyTheme(mode, "g4os");
      const canonical = read();
      globalThis.document.documentElement.setAttribute("data-brand", "g4-institucional");
      return { canonical, legacy: read() };
    }, { mode });
    assert.deepEqual(aliases.canonical, aliases.legacy, "alias CSS preserva o preset consolidado");
    assert.deepEqual(aliases.canonical, [dark ? "#111113" : "#f9f9f9", dark ? "#ececef" : "#001f35", dark ? "#4fb3f0" : "#0084dd", "1.25"]);

    await page.evaluate(() => {
      globalThis.localStorage.setItem("ds-brand", "g4-classico");
      globalThis.window.mountTheme();
    });
    await page.waitForFunction(() => globalThis.document.querySelectorAll("output").length === 2 && [...globalThis.document.querySelectorAll("output")].every((node) => node.textContent === "g4-classico"));
    await page.getByRole("button", { name: "Institucional" }).first().click();
    await page.waitForFunction(() => [...globalThis.document.querySelectorAll("output")].every((node) => node.textContent === "g4os"));
    assert.equal(await page.evaluate(() => globalThis.localStorage.getItem("ds-brand")), "g4os");
    await page.evaluate(() => globalThis.window.dispatchEvent(new globalThis.StorageEvent("storage", { key: "ds-brand", newValue: null })));
    await page.waitForFunction(() => globalThis.document.querySelectorAll("output").length === 2 && [...globalThis.document.querySelectorAll("output")].every((node) => node.textContent === "g4-classico"));
    console.log(`  ✓ ${mode} / sistema ${colorScheme} · padrão, script, aliases e sincronização`);
    await page.close();
  }
} finally {
  await browser.close();
}
