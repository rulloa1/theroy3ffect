ALTER TABLE private.automation_config
  ADD COLUMN IF NOT EXISTS prospect_sync_url text NOT NULL DEFAULT 'https://project--562bff25-798c-4deb-b966-1843715c88c5.lovable.app/api/public/automation/prospect-sync';

CREATE OR REPLACE FUNCTION private.trigger_prospect_crm_sync()
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
    url := cfg.prospect_sync_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-automation-token', cfg.cron_token),
    body := '{}'::jsonb
  );
END;
$$;
REVOKE ALL ON FUNCTION private.trigger_prospect_crm_sync() FROM PUBLIC, anon, authenticated;

SELECT cron.unschedule('prospect-crm-sync-hourly')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'prospect-crm-sync-hourly');

SELECT cron.schedule(
  'prospect-crm-sync-hourly',
  '47 * * * *',
  $$SELECT private.trigger_prospect_crm_sync();$$
);