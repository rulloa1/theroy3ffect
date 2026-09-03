ALTER TABLE public.voice_bookings
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS amount_paid_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'usd';

CREATE UNIQUE INDEX IF NOT EXISTS voice_bookings_stripe_session_id_key
  ON public.voice_bookings (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;