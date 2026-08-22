DELETE FROM public.followup_drafts WHERE source_table = 'voice_leads' AND lead_id IN (SELECT id FROM public.voice_leads WHERE source = 'smoke_test');
DELETE FROM public.voice_leads WHERE source = 'smoke_test';
UPDATE private.automation_config SET cron_token = encode(gen_random_bytes(32), 'hex') WHERE id = true;