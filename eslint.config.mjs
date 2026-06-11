// eslint-config-next 16 已原生輸出 flat config,不再需要 FlatCompat。
import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: ["node_modules/**", ".next/**", "out/**"],
  },
  {
    rules: {
      // react-hooks v7 新規則;現有 6 處皆為 SSR hydration 慣用法
      // (mounted flag / localStorage 讀取 / prop 變更重置),先降為 warn,
      // 後續重構元件時再逐一消除。
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
