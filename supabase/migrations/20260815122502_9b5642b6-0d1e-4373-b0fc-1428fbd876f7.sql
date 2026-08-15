CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_session_id TEXT NOT NULL UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  customer_email TEXT,
  customer_name TEXT,
  price_id TEXT,
  product_name TEXT,
  tier_label TEXT,
  purchase_kind TEXT NOT NULL DEFAULT 'one_time',
  amount_total INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  environment TEXT NOT NULL DEFAULT 'sandbox',
  emails_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.retainer_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  customer_email TEXT,
  price_id TEXT,
  product_name TEXT,
  status TEXT NOT NULL DEFAULT 'incomplete',
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  current_period_end TIMESTAMP WITH TIME ZONE,
  environment TEXT NOT NULL DEFAULT 'sandbox',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT ALL ON public.retainer_subscriptions TO service_role;
ALTER TABLE public.retainer_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_retainer_subscriptions_updated_at BEFORE UPDATE ON public.retainer_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();