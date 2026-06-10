#!/usr/bin/env node
/**
 * SC1986 一鍵建庫工具 — 不需開瀏覽器、不需手動貼 SQL。
 *
 * 用法:
 *   pnpm db:apply              # 套用 supabase/migrations/*.sql(已套用的自動跳過)
 *   pnpm db:apply --with-seed  # 套用 migrations 後再灌入測試資料 seed.sql
 *   pnpm db:apply --seed-only  # 只灌測試資料
 *
 * 需求:.env.local(或環境變數)內設定 SUPABASE_DB_URL
 *   建議使用 Supabase「Session pooler」連線字串:
 *   postgresql://postgres.<project-ref>:<DB密碼>@aws-x-<region>.pooler.supabase.com:5432/postgres
 *
 * 安全:此腳本只在開發者本機執行;正式環境請勿灌 seed。
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));

// ---- 簡易 .env 載入(不引入額外依賴) ----
function loadEnvFile(file) {
  const path = join(root, file);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvFile(".env.local");
loadEnvFile(".env");

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error(
    [
      "✗ 缺少 SUPABASE_DB_URL。",
      "",
      "請在 .env.local 加入資料庫連線字串(Supabase → Connect → Session pooler):",
      "  SUPABASE_DB_URL=postgresql://postgres.<project-ref>:<DB密碼>@aws-x-<region>.pooler.supabase.com:5432/postgres",
      "",
      "註:anon / service key 無法執行 DDL,建表必須使用資料庫連線字串。",
    ].join("\n"),
  );
  process.exit(1);
}

const sql = postgres(dbUrl, {
  ssl: "require",
  max: 1,
  prepare: false, // 相容 pooler transaction mode
  onnotice: () => {},
});

async function ensureMigrationsTable() {
  await sql`
    create table if not exists public._migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )`;
}

async function appliedSet() {
  const rows = await sql`select name from public._migrations`;
  return new Set(rows.map((r) => r.name));
}

async function applyMigrations() {
  const dir = join(root, "supabase", "migrations");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  if (files.length === 0) {
    console.log("(沒有 migration 檔案)");
    return;
  }

  await ensureMigrationsTable();
  const applied = await appliedSet();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`↷ 跳過(已套用):${file}`);
      continue;
    }
    const content = readFileSync(join(dir, file), "utf8");
    process.stdout.write(`▶ 套用 ${file} … `);
    await sql.begin(async (tx) => {
      await tx.unsafe(content);
      await tx`insert into public._migrations (name) values (${file})`;
    });
    console.log("完成");
  }
}

async function applySeed() {
  const seedPath = join(root, "supabase", "seed.sql");
  if (!existsSync(seedPath)) {
    console.log("(找不到 supabase/seed.sql)");
    return;
  }

  const [{ count }] = await sql`select count(*)::int as count from public.products`;
  if (count > 0 && !args.has("--force-seed")) {
    console.log(`↷ products 已有 ${count} 筆資料,跳過 seed(要強制重灌請加 --force-seed,將先清空商品/品牌/分類)。`);
    return;
  }

  if (count > 0 && args.has("--force-seed")) {
    process.stdout.write("▶ --force-seed:清空 products / brands / categories … ");
    await sql.begin(async (tx) => {
      await tx`delete from public.products`;
      await tx`delete from public.brands`;
      await tx`delete from public.categories`;
    });
    console.log("完成");
  }

  process.stdout.write("▶ 灌入測試資料 seed.sql … ");
  const content = readFileSync(seedPath, "utf8");
  await sql.begin(async (tx) => {
    await tx.unsafe(content);
  });
  const [{ count: after }] = await sql`select count(*)::int as count from public.products`;
  console.log(`完成(products 共 ${after} 筆)`);
}

async function summary() {
  const tables =
    await sql`select table_name from information_schema.tables where table_schema = 'public' order by table_name`;
  console.log(`\npublic schema 資料表(${tables.length}):${tables.map((t) => t.table_name).join(", ")}`);
}

try {
  console.log(`連線目標:${dbUrl.replace(/:[^:@/]+@/, ":****@")}\n`);
  if (!args.has("--seed-only")) await applyMigrations();
  if (args.has("--with-seed") || args.has("--seed-only") || args.has("--force-seed")) await applySeed();
  await summary();
  console.log("\n✓ 全部完成");
} catch (err) {
  console.error(`\n✗ 失敗:${err.message}`);
  if (/password|SASL|auth/i.test(String(err.message))) {
    console.error("  → 請確認 SUPABASE_DB_URL 內的資料庫密碼正確(非 anon/service key)。");
  }
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT/i.test(String(err.message))) {
    console.error("  → 無法連線,請改用 Session pooler 連線字串(IPv4 相容)。");
  }
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
