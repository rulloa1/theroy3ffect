delete from voice_followups where email in ('smoke.prod@example.com','other.smoke@example.com');
delete from voice_bookings where email in ('smoke.prod@example.com','other.smoke@example.com');
delete from voice_audit_requests where email in ('smoke.prod@example.com','other.smoke@example.com');
delete from voice_leads where email in ('smoke.prod@example.com','other.smoke@example.com');
delete from voice_agent_logs where vapi_call_id = 'smoke-prod-1';