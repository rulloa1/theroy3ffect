-- Migration: remove tautological "public" RLS policies.
--
-- project_proposals.share_token is `text not null`, so `using (share_token is not null)`
-- was true for every row: any holder of the publishable key could read every proposal
-- and rewrite pricing, terms and signatures on any of them.
--
-- contact_inquiries allowed anonymous INSERT with `with check (true)`, letting anyone
-- write rows straight to PostgREST and forge the sms_*_consent columns that back the
-- A2P/TCPA consent record.
--
-- Nothing in the app depends on either path: every read and write of these tables runs
-- through a server function on the service-role client (src/utils/proposals.functions.ts,
-- src/routes/api/public/contact.ts), which bypasses RLS. What remains after this
-- migration is the admin policy plus service-role access.

drop policy if exists "Public read proposal by token" on public.project_proposals;
drop policy if exists "Public sign proposal by token" on public.project_proposals;

drop policy if exists "Public can submit contact inquiries" on public.contact_inquiries;

-- The admin policies are `to authenticated`, so `authenticated` keeps its table grants
-- and RLS decides. `anon` needs nothing on either table.
revoke all on public.project_proposals from anon;
revoke all on public.contact_inquiries from anon;
