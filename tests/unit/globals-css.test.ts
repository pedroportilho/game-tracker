import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
// O parser de CSS que já vem com o Next
import { parse } from "next/dist/compiled/postcss-scss";

// No build de produção o Next reordena os arquivos de CSS. Se uma regra do
// globals.css tiver o mesmo peso de uma classe (.pip), vence a que vier por
// último — e o reset pode apagar o estilo de um componente só no site
// publicado. Foi o que sumiu com os círculos de nível dos checklists.
// Regra: fora de :where(), o globals.css só pode usar seletores de elemento.

const css = fs.readFileSync(path.resolve(__dirname, "../../app/globals.css"), "utf8");

// Exceções conscientes: :root só define variáveis/color-scheme (nenhum
// componente as redefine); [hidden] usa !important de propósito.
const ALLOWED = new Set([":root", "[hidden]"]);

/** O que sobra de um seletor depois de tirar o que tem peso zero ou de elemento. */
function weightedParts(selector: string) {
  return selector
    .replace(/:where\((?:[^()]|\([^()]*\))*\)/g, "") // :where(...) pesa zero
    .replace(/::[\w-]+/g, "") // pseudo-elementos pesam como elemento
    .match(/[.#[]|:(?!:)[\w-]+/g); // classe, id, atributo, pseudo-classe
}

describe("globals.css", () => {
  const selectors: string[] = [];
  parse(css).walkRules((rule) => {
    const parent = rule.parent as { type?: string; name?: string } | undefined;
    if (parent?.type === "atrule" && parent.name === "keyframes") return;
    selectors.push(...rule.selectors.map((s: string) => s.trim()));
  });

  it("tem regras para conferir", () => {
    expect(selectors.length).toBeGreaterThan(10);
  });

  it.each(selectors.filter((s) => !ALLOWED.has(s)))(
    "'%s' pesa menos que uma classe",
    (selector) => {
      expect(weightedParts(selector)).toBeNull();
    },
  );
});
