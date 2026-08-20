import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  bookingSlotSchema,
  bookDiscoverySlot,
  formatSlot,
  getAvailableSlots,
} from "@/utils/booking.server";

const slotListSchema = z.object({
  count: z.number().int().min(1).max(20).default(3),
});

export const getDiscoveryAvailability = createServerFn({ method: "GET" })
  .inputValidator((input) => slotListSchema.parse(input))
  .handler(async ({ data }) => {
    const open = await getAvailableSlots(data.count);
    return {
      slots: open.map((slot) => ({
        slot_start: slot.toISOString(),
        spoken: formatSlot(slot),
      })),
    };
  });

export const bookDiscoveryCall = createServerFn({ method: "POST" })
  .inputValidator((input) => bookingSlotSchema.parse(input))
  .handler(async ({ data }) => {
    return bookDiscoverySlot(data);
  });
