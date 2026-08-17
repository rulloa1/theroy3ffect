-- Migration: 1-Click Client Proposals & Digital Scope Agreements
create table if not exists public.project_proposals (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid references public.project_briefs(id) on delete set null,
  share_token text not null unique,
  client_name text not null,
  client_email text not null,
  client_company text,
  project_title text not null,
  scope_deliverables text not null,
  timeline_weeks text not null default '2–3 Weeks',
  total_price_cents integer not null default 500000,
  deposit_cents integer not null default 250000,
  balance_cents integer not null default 250000,
  terms text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'viewed', 'signed', 'archived')),
  client_signed_at timestamp with time zone,
  client_signature_name text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Index for fast token lookups
create index if not exists idx_proposals_share_token on public.project_proposals(share_token);
create index if not exists idx_proposals_brief_id on public.project_proposals(brief_id);

-- Enable RLS
alter table public.project_proposals enable row level security;

-- Admin can perform all operations
create policy "Admins manage all proposals" on public.project_proposals
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Public can view proposal by token
create policy "Public read proposal by token" on public.project_proposals
  for select using (share_token is not null);

-- Public can sign proposal by token
create policy "Public sign proposal by token" on public.project_proposals
  for update using (share_token is not null)
  with check (status = 'signed' or status = 'viewed');
