delete from public.voice_bookings where email like 'e2e-%';
delete from public.voice_followups where email like 'e2e-%';
delete from public.voice_audit_requests where email like 'e2e-%';
delete from public.voice_leads where email like 'e2e-%';
delete from public.voice_agent_logs where vapi_call_id = 'e2e-test-call-1';