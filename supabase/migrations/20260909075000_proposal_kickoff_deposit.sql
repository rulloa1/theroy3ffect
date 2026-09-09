-- Migration: let a signed proposal collect its own kickoff deposit.
--
-- The proposal already computes a 50/50 schedule (deposit_cents / balance_cents),
-- but nothing could charge it: after signing, the "proceed to kickoff deposit"
-- button linked to the marketing homepage, so a bespoke figure had to be
-- approximated by whichever fixed catalog tier the client picked off the grid.
--
-- The session id is unique so the webhook and the return page can both fulfil
-- the same payment without paying or recording it twice.

alter table public.project_proposals
  add column if not exists deposit_session_id text,
  add column if not exists deposit_paid_at timestamptz,
  add column if not exists deposit_paid_cents integer;

create unique index if not exists project_proposals_deposit_session_id_key
  on public.project_proposals (deposit_session_id)
  where deposit_session_id is not null;
