#!/usr/bin/env node
/**
 * SC1986 管理者建立工具 — 不需開瀏覽器。
 *
 * 用法:
 *   pnpm admin:create -- --email you@example.com --password 'StrongPass123!' --name '管理者' [--role owner]
 *
 * 行為:
 *   1. 以 service role 建立(或沿用既有)Supabase Auth 使用者,Email 直接設為已驗證
 *   2. 寫入/更新 admin_users(is_active = true)
 *
 * 需求:.env.local 內已設定 NEXT_PUBLIC_SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

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

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const email = arg("email");
const password = arg("password");
const name = arg("name", "管理者");
const role = arg("role", "owner");

if (!email || !password) {
  console.error("用法:pnpm admin:create -- --email you@example.com --password 'StrongPass123!' [--name 名稱] [--role owner|admin|staff]");
  process.exit(1);
}
if (!["owner", "admin", "staff"].includes(role)) {
  console.error("✗ role 必須是 owner / admin / staff");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("✗ 缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY(請設定於 .env.local)。");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findUserByEmail(targetEmail) {
  let page = 1;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`查詢使用者失敗:${error.message}`);
    const hit = data.users.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

try {
  // 1) 建立或取得 Auth 使用者
  let userId;
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    if (/already|registered|exists/i.test(createError.message)) {
      const existing = await findUserByEmail(email);
      if (!existing) throw new Error(`使用者已存在但查詢不到:${createError.message}`);
      userId = existing.id;
      console.log(`↷ Auth 使用者已存在,沿用:${email}(${userId})`);
    } else {
      throw new Error(`建立 Auth 使用者失敗:${createError.message}`);
    }
  } else {
    userId = created.user.id;
    console.log(`✓ 已建立 Auth 使用者:${email}(${userId})`);
  }

  // 2) 寫入 / 更新 admin_users(service role 繞過 RLS)
  const { error: upsertError } = await supabase
    .from("admin_users")
    .upsert(
      { auth_user_id: userId, name, role, is_active: true },
      { onConflict: "auth_user_id" },
    );
  if (upsertError) throw new Error(`寫入 admin_users 失敗:${upsertError.message}(請先執行 pnpm db:apply 建立資料表)`);

  console.log(`✓ admin_users 已就緒:${name}(${role}, is_active=true)`);
  console.log(`\n完成。請以 ${email} 登入 /admin/login`);
} catch (err) {
  console.error(`✗ ${err.message}`);
  process.exitCode = 1;
}
