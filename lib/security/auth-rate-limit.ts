import { query } from "../db/postgres";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

export async function hitAuthRateLimit({
  key,
  limit,
  windowMs,
}: RateLimitOptions): Promise<boolean> {
  const rows = await query<{ count: number }>(
    `insert into auth_rate_limits (key, count, window_started_at)
     values ($1, 1, now())
     on conflict (key) do update
       set count = case
             when auth_rate_limits.window_started_at < now() - ($2::int * interval '1 millisecond')
               then 1
             else auth_rate_limits.count + 1
           end,
           window_started_at = case
             when auth_rate_limits.window_started_at < now() - ($2::int * interval '1 millisecond')
               then now()
             else auth_rate_limits.window_started_at
           end
     returning count`,
    [key, windowMs],
  );

  const count = rows[0]?.count ?? 1;
  return count > limit;
}

