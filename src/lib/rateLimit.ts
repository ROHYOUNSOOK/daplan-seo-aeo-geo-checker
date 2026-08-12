const WINDOW_MS = 10 * 60 * 1000; // 10분
const MAX_REQUESTS = 10;
const BLOCK_MS = 30 * 60 * 1000; // 30분
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5분

interface RateLimitEntry {
  count: number;
  firstRequestAt: number;
  blockedUntil: number | null;
}

const store = new Map<string, RateLimitEntry>();

// 만료된 엔트리 자동 정리
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of store) {
    const windowExpired = now - entry.firstRequestAt > WINDOW_MS;
    const blockExpired = entry.blockedUntil !== null && now > entry.blockedUntil;
    if (windowExpired && (!entry.blockedUntil || blockExpired)) {
      store.delete(ip);
    }
  }
}, CLEANUP_INTERVAL_MS);

export function checkRateLimit(ip: string): { blocked: true; remainingMin: number } | { blocked: false } {
  const now = Date.now();
  const entry = store.get(ip);

  if (entry) {
    // 차단 중인지 확인
    if (entry.blockedUntil !== null) {
      if (now < entry.blockedUntil) {
        const remainingMin = Math.ceil((entry.blockedUntil - now) / 60000);
        return { blocked: true, remainingMin };
      }
      // 차단 해제 → 리셋
      store.delete(ip);
      store.set(ip, { count: 1, firstRequestAt: now, blockedUntil: null });
      return { blocked: false };
    }

    // 윈도우 초과 시 리셋
    if (now - entry.firstRequestAt > WINDOW_MS) {
      store.set(ip, { count: 1, firstRequestAt: now, blockedUntil: null });
      return { blocked: false };
    }

    // 횟수 증가
    entry.count += 1;
    if (entry.count > MAX_REQUESTS) {
      entry.blockedUntil = now + BLOCK_MS;
      const remainingMin = Math.ceil(BLOCK_MS / 60000);
      return { blocked: true, remainingMin };
    }

    return { blocked: false };
  }

  // 새 엔트리
  store.set(ip, { count: 1, firstRequestAt: now, blockedUntil: null });
  return { blocked: false };
}
