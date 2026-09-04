ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS balance_session_id text,
  ADD COLUMN IF NOT EXISTS balance_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS balance_paid_cents integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_orders_balance_session_id ON public.orders(balance_session_id);