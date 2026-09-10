-- Migration: make a discovery slot un-double-bookable at the database level.
--
-- bookDiscoverySlot checked for a clash and then inserted, with nothing between
-- the two statements. Two people paying for the same slot at the same time both
-- passed the check and both inserted; the existing UNIQUE (email, slot_start)
-- only catches the case where it is the same person twice.
--
-- Duplicates already in the table are resolved without ever silently cancelling
-- a booking somebody paid for: a paid row wins the slot, and a paid loser is
-- parked in 'conflict_refund_due' so it leaves the index's predicate and shows
-- up as needing a refund rather than vanishing.

with ranked as (
  select id,
         payment_status,
         row_number() over (
           partition by slot_start
           order by (payment_status = 'paid') desc, created_at, id
         ) as rn
  from public.voice_bookings
  where status = 'scheduled'
)
update public.voice_bookings b
   set status = case when r.payment_status = 'paid' then 'conflict_refund_due' else 'cancelled' end,
       updated_at = now()
  from ranked r
 where b.id = r.id
   and r.rn > 1;

create unique index if not exists voice_bookings_one_scheduled_per_slot
  on public.voice_bookings (slot_start)
  where status = 'scheduled';
