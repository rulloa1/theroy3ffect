CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS private.automation_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  cron_token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  endpoint_url text NOT NULL DEFAULT 'https://project--562bff25-798c-4deb-b966-1843715c88c5.lovable.app/api/public/automation/followups'
);
INSERT INTO private.automation_config (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.automation_cron_token()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = private, public
AS $$
  SELECT cron_token FROM private.automation_config WHERE id = true
$$;
REVOKE ALL ON FUNCTION public.automation_cron_token() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.automation_cron_token() TO service_role;

CREATE OR REPLACE FUNCTION private.trigger_followup_autopilot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public, extensions
AS $$
DECLARE
  cfg private.automation_config%ROWTYPE;
BEGIN
  SELECT * INTO cfg FROM private.automation_config WHERE id = true;
  PERFORM net.http_post(
    url := cfg.endpoint_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-automation-token', cfg.cron_token),
    body := '{}'::jsonb
  );
END;
$$;
REVOKE ALL ON FUNCTION private.trigger_followup_autopilot() FROM PUBLIC, anon, authenticated;

SELECT cron.unschedule('followup-autopilot-hourly')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'followup-autopilot-hourly');

SELECT cron.schedule(
  'followup-autopilot-hourly',
  '17 * * * *',
  $$SELECT private.trigger_followup_autopilot();$$
);