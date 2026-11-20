// Permite o import de CSS global (app/layout.tsx: import "./globals.css")
declare module "*.css";

// Parser de CSS que vem com o Next (usado em tests/unit/globals-css.test.ts)
declare module "next/dist/compiled/postcss-scss" {
  type CssRule = {
    selectors: string[];
    parent?: { type?: string; name?: string };
  };
  export function parse(css: string): {
    walkRules(callback: (rule: CssRule) => void): void;
  };
}
