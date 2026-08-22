CREATE TABLE public.prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'osm',
  source_ref text,
  business_name text NOT NULL,
  industry text NOT NULL,
  category text,
  address text,
  city text NOT NULL DEFAULT 'Houston',
  lat double precision,
  lon double precision,
  phone text,
  website text,
  contact_email text,
  has_website boolean NOT NULL DEFAULT false,
  pain_score integer NOT NULL DEFAULT 0,
  signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  scan_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  scanned_at timestamptz,
  report_token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  report_viewed_at timestamptz,
  draft_subject text,
  draft_body text,
  draft_rationale text,
  draft_status text NOT NULL DEFAULT 'none',
  contacted_at timestamptz,
  status text NOT NULL DEFAULT 'new',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT prospects_status_check CHECK (status IN ('new','queued','contacted','replied','won','lost','skipped')),
  CONSTRAINT prospects_draft_status_check CHECK (draft_status IN ('none','draft','sent','dismissed','failed'))
);

CREATE UNIQUE INDEX prospects_source_ref_key ON public.prospects (source, source_ref) WHERE source_ref IS NOT NULL;
CREATE UNIQUE INDEX prospects_report_token_key ON public.prospects (report_token);
CREATE INDEX prospects_rank_idx ON public.prospects (pain_score DESC, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospects TO authenticated;
GRANT ALL ON public.prospects TO service_role;

ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage prospects"
ON public.prospects FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));