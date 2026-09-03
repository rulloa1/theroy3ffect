import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Calendar, Check, Clock, CreditCard, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { getDiscoveryAvailability } from "@/utils/booking.functions";
import {
  createDiscoveryCheckoutSession,
  confirmDiscoveryPayment,
} from "@/utils/booking-payment.functions";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";

export const DISCOVERY_FEE_LABEL = "$49";

interface Slot {
  slot_start: string;
  spoken: string;
}

interface BookingResult {
  spoken_time: string;
  time_zone: string;
}

interface PendingBooking {
  full_name: string;
  email: string;
  phone: string;
  notes: string;
  slot_start: string;
}

function formatDayLabel(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  }).format(new Date(iso));
}

function formatTimeLabel(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  }).format(new Date(iso));
}

function groupByDay(slots: Slot[]): Record<string, Slot[]> {
  return slots.reduce((acc, slot) => {
    const key = slot.slot_start.slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {} as Record<string, Slot[]>);
}

export function BookingCalendar() {
  const fetchAvailability = useServerFn(getDiscoveryAvailability);
  const startCheckout = useServerFn(createDiscoveryCheckoutSession);
  const confirmPayment = useServerFn(confirmDiscoveryPayment);

  const { data, isLoading, error } = useQuery({
    queryKey: ["discovery-availability"],
    queryFn: () => fetchAvailability({ data: { count: 3 } }),
  });

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingBooking | null>(null);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Returning from Stripe: confirm the payment and reserve the slot if the
  // webhook has not already done it.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) return;

    setConfirming(true);
    confirmPayment({ data: { sessionId, environment: getStripeEnvironment() } })
      .then((res) => {
        if (res.status === "booked" || res.status === "already_booked") {
          setResult({ spoken_time: res.spokenTime, time_zone: res.timeZone });
          window.history.replaceState({}, "", window.location.pathname);
        } else {
          toast.error(res.message);
        }
      })
      .catch(() => toast.error("We could not confirm that payment."))
      .finally(() => setConfirming(false));
  }, [confirmPayment]);

  useEffect(() => {
    const first = data?.slots?.[0];
    if (first) {
      setSelectedDay(first.slot_start.slice(0, 10));
    }
  }, [data]);

  const slotsByDay = useMemo(() => groupByDay(data?.slots ?? []), [data]);
  const days = useMemo(() => Object.keys(slotsByDay).sort(), [slotsByDay]);
  const daySlots = selectedDay ? slotsByDay[selectedDay] ?? [] : [];

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    if (!pending) throw new Error("Booking details are missing");
    const res = await startCheckout({
      data: {
        ...pending,
        time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        returnUrl: `${window.location.origin}/book?session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
      },
    });
    if ("error" in res) throw new Error(res.error);
    if (!res.clientSecret) throw new Error("Checkout could not be started");
    return res.clientSecret;
  }, [pending, startCheckout]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSlot) return;

    const fd = new FormData(e.currentTarget);
    const full_name = String(fd.get("full_name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();

    if (!full_name || !email) {
      toast.error("Please add your name and email");
      return;
    }

    setPending({
      full_name,
      email,
      phone: String(fd.get("phone") ?? "").trim(),
      notes: String(fd.get("notes") ?? "").trim(),
      slot_start: selectedSlot,
    });
  };

  if (confirming) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-white/60">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Confirming your payment...
      </div>
    );
  }

  if (result) {
    return (
      <div className="rounded border border-white/10 bg-white/[0.02] p-8 text-center md:p-12">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-[#FF3333]/10">
          <Check className="size-8 text-[#FF3333]" />
        </div>
        <h3 className="font-display text-2xl uppercase text-white md:text-3xl">You&apos;re booked</h3>
        <p className="mx-auto mt-3 max-w-md font-mono text-sm leading-relaxed text-white/70">
          Payment received and a confirmation email is on its way. Your discovery call is set for{" "}
          <strong className="text-white">{result.spoken_time}</strong> ({result.time_zone}).
        </p>
        <a
          href="/brief"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#FF3333] px-6 py-3 font-mono text-xs tracking-widest text-white transition-colors hover:bg-[#FF3333] hover:text-black"
        >
          Complete your intake <ArrowLeft className="size-3 rotate-180" />
        </a>
      </div>
    );
  }

  if (pending) {
    return (
      <div className="rounded border border-white/10 bg-white/[0.02] p-5 md:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CreditCard className="size-5 text-[#FF3333]" />
            <h2 className="font-display text-xl uppercase text-white">
              Pay {DISCOVERY_FEE_LABEL} to confirm
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setPending(null)}
            className="font-mono text-[11px] tracking-widest text-white/50 underline hover:text-white"
          >
            CHANGE TIME
          </button>
        </div>
        <p className="mb-6 font-mono text-xs leading-relaxed text-white/50">
          Your slot is held once payment completes. The fee is credited toward your project if you
          commission work within 30 days.
        </p>
        <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-white/60">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Loading available times...
      </div>
    );
  }

  if (error || !data || data.slots.length === 0) {
    return (
      <div className="rounded border border-white/10 bg-white/[0.02] p-8 text-center">
        <p className="font-mono text-sm text-white/70">
          No available slots right now. Please reach out directly and we&apos;ll find a time.
        </p>
        <a
          href="mailto:rory@theroyeffect.com"
          className="mt-4 inline-block font-mono text-xs text-[#FF3333] underline"
        >
          rory@theroyeffect.com
        </a>
      </div>
    );
  }

  return (
    <div className="rounded border border-white/10 bg-white/[0.02] p-5 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <Calendar className="size-5 text-[#FF3333]" />
        <h2 className="font-display text-xl uppercase text-white">Pick a time</h2>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {days.map((day) => {
          const active = selectedDay === day;
          return (
            <button
              key={day}
              type="button"
              onClick={() => {
                setSelectedDay(day);
                setSelectedSlot(null);
              }}
              className={`rounded border px-3 py-3 text-left transition-all ${
                active
                  ? "border-[#FF3333] bg-[#FF3333]/10 text-white"
                  : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/30 hover:text-white"
              }`}
            >
              <span className="block font-mono text-[10px] uppercase tracking-wider opacity-70">
                {formatDayLabel(day + "T00:00:00")}
              </span>
              <span className="block font-mono text-xs font-semibold">{slotsByDay[day]?.length ?? 0} slots</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {selectedDay && (
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-8"
          >
            <div className="mb-3 flex items-center gap-2 font-mono text-xs tracking-widest text-white/50">
              <Clock className="size-3" />
              AVAILABLE TIMES
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {daySlots.map((slot) => {
                const active = selectedSlot === slot.slot_start;
                return (
                  <button
                    key={slot.slot_start}
                    type="button"
                    onClick={() => setSelectedSlot(slot.slot_start)}
                    className={`rounded border px-3 py-3 font-mono text-xs transition-all ${
                      active
                        ? "border-[#FF3333] bg-[#FF3333] text-black"
                        : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {formatTimeLabel(slot.slot_start)}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedSlot && (
          <motion.form
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="space-y-4 overflow-hidden border-t border-white/10 pt-6"
          >
            <div className="mb-4 flex items-center gap-2 font-mono text-xs tracking-widest text-[#FF3333]">
              <User className="size-3" />
              YOUR DETAILS
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                name="full_name"
                type="text"
                placeholder="Full name"
                required
                maxLength={120}
                className="w-full border-0 border-b border-white/20 bg-transparent px-0 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#FF3333] focus:outline-none"
              />
              <input
                name="email"
                type="email"
                placeholder="Email address"
                required
                maxLength={255}
                className="w-full border-0 border-b border-white/20 bg-transparent px-0 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#FF3333] focus:outline-none"
              />
            </div>
            <input
              name="phone"
              type="tel"
              placeholder="Phone (optional)"
              maxLength={40}
              className="w-full border-0 border-b border-white/20 bg-transparent px-0 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#FF3333] focus:outline-none"
            />
            <textarea
              name="notes"
              rows={3}
              placeholder="What would you like to discuss? (optional)"
              maxLength={2000}
              className="w-full resize-none border-0 border-b border-white/20 bg-transparent px-0 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#FF3333] focus:outline-none"
            />
            <div className="pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-[#FF3333] px-6 py-3 font-mono text-xs font-bold tracking-widest text-black transition-all hover:bg-[#FF5555] disabled:opacity-50"
              >
                <CreditCard className="size-4" /> CONTINUE TO PAYMENT — {DISCOVERY_FEE_LABEL}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
