ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS variants jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sent_variant text,
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.voice_leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS replied_at timestamptz,
  ADD COLUMN IF NOT EXISTS booked_at timestamptz,
  ADD COLUMN IF NOT EXISTS won_at timestamptz;

ALTER TABLE public.prospects DROP CONSTRAINT IF EXISTS prospects_status_check;
ALTER TABLE public.prospects ADD CONSTRAINT prospects_status_check
  CHECK (status IN ('new','queued','contacted','replied','meeting','won','lost','skipped'));

CREATE INDEX IF NOT EXISTS prospects_lead_id_idx ON public.prospects (lead_id);