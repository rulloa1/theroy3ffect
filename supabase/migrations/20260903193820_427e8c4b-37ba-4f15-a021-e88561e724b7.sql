ALTER TABLE public.client_projects
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS target_date date,
  ADD COLUMN IF NOT EXISTS next_step text;

ALTER TABLE public.client_milestones
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR lower(coalesce(customer_email, '')) = lower(coalesce(auth.jwt() ->> 'email', '~none~'))
    OR private.has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Users can view their own invoices" ON public.subscription_invoices;
CREATE POLICY "Users can view their own invoices"
  ON public.subscription_invoices FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR lower(coalesce(customer_email, '')) = lower(coalesce(auth.jwt() ->> 'email', '~none~'))
    OR private.has_role(auth.uid(), 'admin'::app_role)
  );