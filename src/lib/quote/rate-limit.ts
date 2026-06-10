/**
 * 簡易記憶體 rate limiter(滑動視窗)。
 *
 * 已知限制:Vercel serverless 多 instance 時各自計數,
 * 屬「降低濫用」而非絕對防線;Cloudflare WAF 為第一層。
 * 流量成長後可改用 Upstash Redis 等集中式方案。
 */
const hits = new Map<string, number[]>();

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const MAX_KEYS = 10_000;

export function checkRateLimit(key: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  // 防止 Map 無限成長
  if (hits.size > MAX_KEYS) hits.clear();

  const list = (hits.get(key) ?? []).filter((t) => t > windowStart);
  if (list.length >= MAX_PER_WINDOW) {
    hits.set(key, list);
    const retryAfterSec = Math.ceil((list[0] + WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfterSec: Math.max(1, retryAfterSec) };
  }
  list.push(now);
  hits.set(key, list);
  return { allowed: true, retryAfterSec: 0 };
}
