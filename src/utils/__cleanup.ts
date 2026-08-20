import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function cleanup() {
  const bookingId = process.argv[2];
  const email = process.argv[3];
  if (!bookingId || !email) {
    console.error("Usage: bun run src/utils/__cleanup.ts <booking_id> <email>");
    process.exit(1);
  }

  const { data: booking } = await supabaseAdmin.from("voice_bookings").select("id,lead_id").eq("id", bookingId).single();
  if (!booking) {
    console.log("Booking not found");
    return;
  }

  await supabaseAdmin.from("voice_bookings").delete().eq("id", bookingId);
  await supabaseAdmin.from("voice_leads").delete().eq("id", booking.lead_id);
  console.log("Cleaned up booking", bookingId, "and lead", booking.lead_id);
}

cleanup();
