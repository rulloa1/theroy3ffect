alter table public.automation_jobs
  add column if not exists state jsonb not null default '{}'::jsonb;

insert into public.automation_jobs (job_key, status)
select 'gsc_index_watch', 'active'
where not exists (select 1 from public.automation_jobs where job_key = 'gsc_index_watch');

alter table private.automation_config
  add column if not exists gsc_index_watch_url text;

create or replace function private.trigger_gsc_index_watch()
returns void
language plpgsql
security definer
set search_path to 'private', 'public', 'extensions'
as $function$
declare
  cfg private.automation_config%rowtype;
begin
  select * into cfg from private.automation_config where id = true;
  perform net.http_post(
    url := cfg.gsc_index_watch_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-automation-token', cfg.cron_token),
    body := '{}'::jsonb
  );
end;
$function$;