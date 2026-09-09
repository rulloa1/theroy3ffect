alter table public.project_proposals
  add column if not exists deposit_session_id text,
  add column if not exists deposit_paid_at timestamptz,
  add column if not exists deposit_paid_cents integer;

create unique index if not exists project_proposals_deposit_session_id_key
  on public.project_proposals (deposit_session_id)
  where deposit_session_id is not null;
