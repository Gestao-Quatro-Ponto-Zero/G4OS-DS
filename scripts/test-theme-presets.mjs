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
    assert.match(values.font, /^"Figtree"/);

    for (const [saved, expected] of [[null, null], ["g4", null], ["g4-classico", null], ["g4os", "g4os"], ["g4-institucional", "g4os"], ["oceano", "oceano"]]) {
      const result = await page.evaluate(({ saved, mode }) => {
        globalThis.localStorage.setItem("ds-theme", mode);
        if (saved === null) globalThis.localStorage.removeItem("ds-brand");
        else globalThis.localStorage.setItem("ds-brand", saved);
        if (saved === null) globalThis.document.documentElement.removeAttribute("data-brand");
        else globalThis.document.documentElement.setAttribute("data-brand", "stale");
        (0, eval)(globalThis.window.themeApi.themeScript);
        const before = globalThis.document.documentElement.getAttribute("data-brand");
        globalThis.window.themeApi.applyTheme(mode, saved);
        return { before, after: globalThis.document.documentElement.getAttribute("data-brand") };
      }, { saved, mode });
      assert.deepEqual(result, { before: expected, after: expected }, `script e API concordam para ${saved}`);
    }
    // Tipografia: Figtree é o padrão (sem atributo); "g4" era o id do padrão antigo; "g4os" é a Manrope opcional.
    for (const [saved, expected, family] of [[null, null, "Figtree"], ["g4", null, "Figtree"], ["classica", null, "Figtree"], ["g4os", "g4os", "Manrope"], ["editorial", "editorial", "Inter"]]) {
      const result = await page.evaluate(({ saved, mode }) => {
        const root = globalThis.document.documentElement;
        if (saved === null) globalThis.localStorage.removeItem("ds-type");
        else globalThis.localStorage.setItem("ds-type", saved);
        if (saved === null) root.removeAttribute("data-type");
        else root.setAttribute("data-type", "stale");
        (0, eval)(globalThis.window.themeApi.themeScript);
        const before = root.getAttribute("data-type");
        globalThis.window.themeApi.applyTheme(mode, undefined, root, saved ?? "classica");
        const style = globalThis.getComputedStyle(root);
        const out = { before, after: root.getAttribute("data-type"), font: style.getPropertyValue("--ds-font-sans"), weight: style.getPropertyValue("--ds-display-weight").trim() };
        globalThis.localStorage.removeItem("ds-type");
        root.removeAttribute("data-type");
        return out;
      }, { saved, mode });
      assert.deepEqual([result.before, result.after], [expected, expected], `tipografia: script e API concordam para ${saved}`);
      assert.ok(result.font.trim().startsWith(`"${family}"`), `tipografia ${saved}: ${result.font}`);
      if (expected === null) assert.equal(result.weight, "600", "títulos do padrão em 600");
    }
    const kept = await page.evaluate(() => {
      globalThis.localStorage.removeItem("ds-type");
      globalThis.document.documentElement.setAttribute("data-type", "editorial");
      (0, eval)(globalThis.window.themeApi.themeScript);
      const value = globalThis.document.documentElement.getAttribute("data-type");
      globalThis.document.documentElement.removeAttribute("data-type");
      return value;
    });
    assert.equal(kept, "editorial", "sem preferência salva, respeita a tipografia do HTML");
    for (const [markup, expected] of [["g4os", "g4os"], ["oceano", "oceano"], ["g4-institucional", "g4os"]]) {
      const attribute = await page.evaluate(({ markup }) => {
        globalThis.localStorage.removeItem("ds-brand");
        globalThis.document.documentElement.setAttribute("data-brand", markup);
        (0, eval)(globalThis.window.themeApi.themeScript);
        return globalThis.document.documentElement.getAttribute("data-brand");
      }, { markup });
      assert.equal(attribute, expected, "sem preferência salva, respeita a marca do HTML");
    }
    const scoped = await page.evaluate(({ mode }) => {
      globalThis.window.themeApi.applyTheme(mode, "g4os");
      const panel = globalThis.document.createElement("div");
      globalThis.document.body.appendChild(panel);
      globalThis.window.themeApi.applyTheme(mode, "g4-classico", panel);
      const style = globalThis.getComputedStyle(panel);
      const result = [style.getPropertyValue("--ds-page").trim(), style.getPropertyValue("--ds-surface").trim(), style.getPropertyValue("--ds-radius-scale").trim()];
      panel.remove();
      return result;
    }, { mode });
    assert.deepEqual(scoped, [values.page, dark ? "#18181b" : "#ffffff", "1"], "painel clássico não herda a marca do pai");
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
      globalThis.localStorage.removeItem("ds-brand");
      globalThis.document.documentElement.setAttribute("data-brand", "g4os");
      (0, eval)(globalThis.window.themeApi.themeScript);
      globalThis.window.mountTheme();
    });
    await page.waitForFunction(() => globalThis.document.querySelectorAll("output").length === 2 && [...globalThis.document.querySelectorAll("output")].every((node) => node.textContent === "g4os"));
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
