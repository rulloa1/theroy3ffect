create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  lead_id uuid references public.voice_leads(id) on delete set null,
  contact_name text,
  contact_email text,
  contact_phone text,
  source text not null default 'chat_widget',
  status text not null default 'new',
  last_message_at timestamptz not null default now(),
  last_message_preview text,
  unread_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  external_id text unique,
  direction text not null check (direction in ('inbound','outbound')),
  body text not null default '',
  message_type text,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_conversation_idx on public.chat_messages(conversation_id, sent_at desc);
create index if not exists chat_conversations_last_msg_idx on public.chat_conversations(last_message_at desc);

grant select, insert, update, delete on public.chat_conversations to authenticated;
grant select, insert, update, delete on public.chat_messages to authenticated;
grant all on public.chat_conversations to service_role;
grant all on public.chat_messages to service_role;

alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "Admins manage chat conversations" on public.chat_conversations;
create policy "Admins manage chat conversations"
on public.chat_conversations for all to authenticated
using (private.has_role(auth.uid(), 'admin'::app_role))
with check (private.has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "Admins manage chat messages" on public.chat_messages;
create policy "Admins manage chat messages"
on public.chat_messages for all to authenticated
using (private.has_role(auth.uid(), 'admin'::app_role))
with check (private.has_role(auth.uid(), 'admin'::app_role));