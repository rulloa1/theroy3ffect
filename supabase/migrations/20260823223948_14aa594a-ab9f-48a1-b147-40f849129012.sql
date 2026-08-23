ALTER TABLE private.automation_config
  ADD COLUMN IF NOT EXISTS slack_channel_id text;

UPDATE private.automation_config
  SET slack_channel_id = 'C0BQT25BW7Q'
  WHERE id = true AND slack_channel_id IS NULL;