CREATE TABLE public.voice_call_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vapi_call_id text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'in_progress',
  transcript text,
  summary text,
  recording_url text,
  ended_reason text,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.voice_call_records TO authenticated;
GRANT ALL ON public.voice_call_records TO service_role;

ALTER TABLE public.voice_call_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage voice call records"
ON public.voice_call_records FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX voice_call_records_call_id_idx ON public.voice_call_records (vapi_call_id);

CREATE TRIGGER update_voice_call_records_updated_at
BEFORE UPDATE ON public.voice_call_records
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();