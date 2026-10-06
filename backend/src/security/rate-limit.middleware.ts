import type {
  NextFunction,
  Request,
  Response,
} from 'express';

type RateLimitRule = {
  name: string;
  limit: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets =
  new Map<string, Bucket>();

const GENERAL_RULE: RateLimitRule = {
  name: 'general',
  limit: 300,
  windowMs: 60_000,
};

function ruleFor(
  req: Request,
): RateLimitRule {
  if (
    req.method === 'POST' &&
    req.path === '/auth/login'
  ) {
    return {
      name: 'auth-login',
      limit: 8,
      windowMs: 15 * 60_000,
    };
  }

  if (
    req.method === 'POST' &&
    req.path === '/auth/admin-login'
  ) {
    return {
      name: 'admin-login',
      limit: 6,
      windowMs: 15 * 60_000,
    };
  }

  if (
    req.method === 'POST' &&
    req.path === '/auth/register'
  ) {
    return {
      name: 'auth-register',
      limit: 5,
      windowMs: 60 * 60_000,
    };
  }

  if (
    req.method === 'POST' &&
    req.path === '/orders'
  ) {
    return {
      name: 'order-create',
      limit: 4,
      windowMs: 10 * 60_000,
    };
  }

  return GENERAL_RULE;
}

function clientId(
  req: Request,
) {
  return (
    req.ip ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

function pruneExpired(
  now: number,
) {
  if (buckets.size < 5_000) {
    return;
  }

  for (
    const [
      key,
      bucket,
    ] of buckets
  ) {
    if (
      bucket.resetAt <= now
    ) {
      buckets.delete(key);
    }
  }
}

export function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (
    req.method === 'OPTIONS' ||
    req.path === '/'
  ) {
    next();
    return;
  }

  const rule =
    ruleFor(req);

  const now =
    Date.now();

  pruneExpired(now);

  const key =
    `${rule.name}:${clientId(req)}`;

  const current =
    buckets.get(key);

  const bucket =
    !current ||
    current.resetAt <= now
      ? {
          count: 0,
          resetAt:
            now +
            rule.windowMs,
        }
      : current;

  bucket.count += 1;

  buckets.set(
    key,
    bucket,
  );

  const remaining =
    Math.max(
      0,
      rule.limit -
        bucket.count,
    );

  const resetSeconds =
    Math.max(
      1,
      Math.ceil(
        (bucket.resetAt -
          now) /
          1000,
      ),
    );

  res.setHeader(
    'X-RateLimit-Limit',
    String(rule.limit),
  );
  res.setHeader(
    'X-RateLimit-Remaining',
    String(remaining),
  );
  res.setHeader(
    'X-RateLimit-Reset',
    String(resetSeconds),
  );

  if (
    bucket.count >
    rule.limit
  ) {
    res.setHeader(
      'Retry-After',
      String(resetSeconds),
    );

    res.status(429).json({
      statusCode: 429,
      message:
        'Слишком много запросов. Попробуйте позже.',
    });
    return;
  }

  next();
}
