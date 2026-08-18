create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

revoke all on function private.has_role(uuid, public.app_role) from public;
revoke all on function private.has_role(uuid, public.app_role) from anon;
grant execute on function private.has_role(uuid, public.app_role) to authenticated, service_role;

alter policy "Users can view their own profile" on public.profiles using ((auth.uid() = id) or private.has_role(auth.uid(), 'admin'));
alter policy "Users can view their own orders" on public.orders using ((auth.uid() = user_id) or private.has_role(auth.uid(), 'admin'));
alter policy "Users can view their own retainers" on public.retainer_subscriptions using ((auth.uid() = user_id) or private.has_role(auth.uid(), 'admin'));
alter policy "Users can view their own briefs" on public.project_briefs using ((auth.uid() = user_id) or private.has_role(auth.uid(), 'admin'));
alter policy "Users can view their own invoices" on public.subscription_invoices using ((auth.uid() = user_id) or private.has_role(auth.uid(), 'admin'));
alter policy "Admins manage projects" on public.showcase_projects using (private.has_role(auth.uid(), 'admin')) with check (private.has_role(auth.uid(), 'admin'));
alter policy "Admins manage inquiries" on public.contact_inquiries using (private.has_role(auth.uid(), 'admin')) with check (private.has_role(auth.uid(), 'admin'));
alter policy "Admins manage proposals" on public.project_proposals using (private.has_role(auth.uid(), 'admin')) with check (private.has_role(auth.uid(), 'admin'));

alter policy "Owners and admins can read their brief PDFs" on storage.objects using (
  bucket_id = 'brief-pdfs' and (
    private.has_role(auth.uid(), 'admin')
    or exists (select 1 from public.project_briefs pb where pb.pdf_path = storage.objects.name and pb.user_id = auth.uid())
  )
);
alter policy "Admins can insert brief PDFs" on storage.objects with check (bucket_id = 'brief-pdfs' and private.has_role(auth.uid(), 'admin'));
alter policy "Admins can update brief PDFs" on storage.objects using (bucket_id = 'brief-pdfs' and private.has_role(auth.uid(), 'admin')) with check (bucket_id = 'brief-pdfs' and private.has_role(auth.uid(), 'admin'));
alter policy "Admins can delete brief PDFs" on storage.objects using (bucket_id = 'brief-pdfs' and private.has_role(auth.uid(), 'admin'));

drop function if exists public.has_role(uuid, public.app_role);