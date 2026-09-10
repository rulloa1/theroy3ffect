ALTER TABLE public.contact_inquiries
  ADD COLUMN IF NOT EXISTS sms_service_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_marketing_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_captured_at timestamptz;

ALTER TABLE public.project_briefs
  ADD COLUMN IF NOT EXISTS sms_service_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_marketing_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_captured_at timestamptz;

ALTER TABLE public.voice_bookings
  ADD COLUMN IF NOT EXISTS sms_service_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_marketing_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_captured_at timestamptz;