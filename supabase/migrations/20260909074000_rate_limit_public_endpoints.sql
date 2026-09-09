-- Migration: a counter the public endpoints can throttle against.
--
-- /api/public/contact and /api/public/brief-intake are unauthenticated and each
-- one sends mail to a caller-supplied address; brief-intake also renders a PDF
-- and stores it. With no limit they work as an email relay from the studio's
-- sending domain and as free storage. Counting has to be atomic, so the
-- increment and the verdict happen in one statement inside the database.

create table if not exists private.rate_limit_hits (
  bucket text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (bucket, window_start)
);

create or replace function public.rate_limit_hit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = private, public
as $$
declare
  w timestamptz := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );
  current_hits integer;
begin
  insert into private.rate_limit_hits (bucket, window_start, hits)
  values (p_bucket, w, 1)
  on conflict (bucket, window_start)
    do update set hits = rate_limit_hits.hits + 1
  returning hits into current_hits;

  -- Sweep old windows now and then rather than on every request.
  if random() < 0.01 then
    delete from private.rate_limit_hits where window_start < now() - interval '1 day';
  end if;

  -- true = allowed
  return current_hits <= p_limit;
end;
$$;

revoke all on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;
