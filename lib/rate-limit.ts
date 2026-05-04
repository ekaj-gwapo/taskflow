const tracker: Record<string, { count: number, resetAt: number }> = {};

export function rateLimit(ip: string, limit: number = 5, windowMs: number = 60000) {
  const now = Date.now();
  const record = tracker[ip];

  if (!record || now > record.resetAt) {
    tracker[ip] = { count: 1, resetAt: now + windowMs };
    return { success: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0 };
  }

  record.count += 1;
  return { success: true, remaining: limit - record.count };
}
